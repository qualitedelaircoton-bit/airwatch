/*
 * Migration script: Neon Postgres -> Firestore
 * - Discovers tables/columns from Postgres (public schema)
 * - Heuristically maps users, sensors, and sensor data
 * - Writes to Firestore using Admin SDK with batching (BulkWriter)
 * - Supports --dry-run for safe inspection
 * - Configure DATABASE_URL in .env
 *
 * Usage:
 *   pnpm db:migrate:dry            # print discovery, counts, sample mapping
 *   pnpm db:migrate                # run migration
 *   pnpm db:migrate --limit=1000   # limit rows per table
 *   pnpm db:migrate --sensors-table=sensors_old --data-table=sensor_data_old --users-table=users_old
 *   pnpm db:migrate --order-column=id --batch-size=400
 */

import { adminDb } from "../lib/firebase-admin";
import * as admin from "firebase-admin";
import { Pool } from "pg";
// Minimal pool interface to avoid type import issues under strict settings
type PgPoolLike = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  end: () => Promise<void>;
};
import { writeFileSync } from "fs";
import { resolve as pathResolve } from "path";

// Simple CLI arg parser
function getArg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return fallback;
  const raw = process.argv[idx];
  const eqIdx = raw.indexOf("=");
  if (eqIdx !== -1) return raw.slice(eqIdx + 1);
  const next = process.argv[idx + 1];
  if (!next || next.startsWith("--")) return fallback;
  return next;
}

const isDryRun = process.argv.includes("--dry-run");
const limitArg = getArg("limit");
const limit = limitArg ? Math.max(1, parseInt(limitArg, 10)) : undefined;
const batchSize = parseInt(getArg("batch-size", "400")!, 10);
const sensorsTable = getArg("sensors-table");
const dataTable = getArg("data-table");
const usersTable = getArg("users-table");
const orderColumn = getArg("order-column");

// Postgres connection
function createPgPool(): PgPoolLike {
  const connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    console.error("❌ Missing DATABASE_URL in environment.");
    process.exit(1);
  }
  // Neon with sslmode=require typically needs SSL
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  return (pool as unknown) as PgPoolLike;
}

async function queryAll<T = any>(pool: PgPoolLike, sql: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

async function getTables(pool: PgPoolLike): Promise<{ table_name: string }[]> {
  return queryAll(pool, `
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
}

async function getColumns(pool: PgPoolLike, table: string): Promise<{ column_name: string; data_type: string }[]> {
  return queryAll(pool, `
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = $1
    order by ordinal_position
  `, [table]);
}

async function getCount(pool: PgPoolLike, table: string): Promise<number> {
  const res = await queryAll<{ count: string }>(pool, `select count(*) as count from "${table}"`);
  return parseInt(res[0]?.count || "0", 10);
}

async function getSample(pool: PgPoolLike, table: string, n = 3): Promise<any[]> {
  return queryAll(pool, `select * from "${table}" limit ${n}`);
}

function looksLikeSensors(columns: string[]): boolean {
  const lc = columns.map((c) => c.toLowerCase());
  const hasName = lc.includes("name");
  const hasLat = lc.includes("latitude") || lc.includes("lat");
  const hasLng = lc.includes("longitude") || lc.includes("lng") || lc.includes("lon");
  return hasName && (hasLat || hasLng);
}

function looksLikeSensorData(columns: string[]): boolean {
  const lc = columns.map((c) => c.toLowerCase());
  const hasSensorId = lc.includes("sensor_id") || lc.includes("device_id") || lc.includes("sensorid");
  const hasTs = lc.includes("timestamp") || lc.includes("ts") || lc.includes("time");
  const hasPm = lc.includes("pm1") || lc.includes("pm1_0") || lc.includes("pm25") || lc.includes("pm2_5") || lc.includes("pm10");
  return hasSensorId && hasTs && hasPm;
}

function looksLikeUsers(columns: string[]): boolean {
  const lc = columns.map((c) => c.toLowerCase());
  return lc.includes("email") && (lc.includes("id") || lc.includes("uid"));
}

function toDateSafe(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const ms = v < 10000000000 ? v * 1000 : v; // seconds vs ms
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function pick<T extends object>(row: T, candidates: string[]): any {
  for (const c of candidates) {
    const k = Object.keys(row).find((r) => r.toLowerCase() === c.toLowerCase());
    if (k && (row as any)[k] !== undefined) return (row as any)[k];
  }
  return undefined;
}

function mapSensorRow(row: any) {
  const id = String(pick(row, ["id", "sensor_id", "device_id"]) ?? "");
  const name = pick(row, ["name", "sensor_name", "label"]) ?? "Unnamed";
  const latitude = Number(pick(row, ["latitude", "lat"])) || 0;
  const longitude = Number(pick(row, ["longitude", "lng", "lon"])) || 0;
  const frequency = Number(pick(row, ["frequency", "freq", "interval"])) || 60;
  const status = pick(row, ["status"]) ?? "RED";
  const isActive = Boolean(pick(row, ["is_active", "active"])) || false;
  const createdAt = toDateSafe(pick(row, ["createdAt", "created_at", "createdat", "created"])) || new Date();
  const updatedAt = toDateSafe(pick(row, ["updatedAt", "updated_at", "updatedat", "updated"])) || createdAt;
  const lastSeen = toDateSafe(pick(row, ["lastSeen", "last_seen", "lastseen", "last_communication"])) || null;

  return {
    id,
    data: {
      name,
      latitude,
      longitude,
      frequency,
      status,
      isActive,
      createdAt,
      updatedAt,
      ...(lastSeen ? { lastSeen } : {}),
    },
  } as const;
}

function mapDataRow(row: any) {
  const id = pick(row, ["id", "data_id"]) ?? undefined;
  const sensorRef = String(pick(row, ["sensorId", "sensor_id", "device_id"]) ?? "");
  const ts = toDateSafe(pick(row, ["timestamp", "ts", "time", "created_at"])) || new Date();

  const pm1_0 = Number(pick(row, ["pm1_0", "pm1", "pm1_0_ugm3", "pm1ugm3", "pm1ug", "pm1ugm"])) || Number(pick(row, ["PM1"])) || 0;
  const pm2_5 = Number(pick(row, ["pm2_5", "pm25", "pm2_5_ugm3"])) || Number(pick(row, ["PM25"])) || 0;
  const pm10 = Number(pick(row, ["pm10", "pm10_ugm3"])) || Number(pick(row, ["PM10"])) || 0;

  const o3_raw = Number(pick(row, ["o3_raw", "o3"])) || 0;
  const o3_corrige = Number(pick(row, ["o3_corrige", "o3c", "o3_corrected"])) || 0;
  // Voltages: support *_mv (millivolts) and convert to volts
  const no2_v_src = pick(row, ["no2_voltage_v", "no2v", "no2_voltage_mv"]);
  const no2_voltage_v = typeof no2_v_src === 'number' && pick(row, ["no2_voltage_mv"]) !== undefined ? (Number(no2_v_src) / 1000) : Number(no2_v_src ?? 0);
  const no2_ppb = Number(pick(row, ["no2_ppb", "no2"])) || 0;
  const voc_v_src = pick(row, ["voc_voltage_v", "vocv", "voc_voltage_mv"]);
  const voc_voltage_v = typeof voc_v_src === 'number' && pick(row, ["voc_voltage_mv"]) !== undefined ? (Number(voc_v_src) / 1000) : Number(voc_v_src ?? 0);
  const co_v_src = pick(row, ["co_voltage_v", "cov", "co_voltage_mv"]);
  const co_voltage_v = typeof co_v_src === 'number' && pick(row, ["co_voltage_mv"]) !== undefined ? (Number(co_v_src) / 1000) : Number(co_v_src ?? 0);
  const co_ppb = Number(pick(row, ["co_ppb", "co"])) || 0;

  return {
    id: id != null ? String(id) : undefined,
    sensorId: sensorRef,
    data: {
      timestamp: ts,
      pm1_0,
      pm2_5,
      pm10,
      o3_raw,
      o3_corrige,
      no2_voltage_v,
      no2_ppb,
      voc_voltage_v,
      co_voltage_v,
      co_ppb,
      rawData: row,
    },
  } as const;
}

function mapUserRow(row: any) {
  const id = String(pick(row, ["uid", "id"]) ?? "");
  const email = pick(row, ["email"]) ?? "";
  const displayName = pick(row, ["display_name", "displayname", "name"]) ?? null;
  const photoURL = pick(row, ["photo_url", "photourl"]) ?? null;
  const role = pick(row, ["role"]) ?? "consultant";
  const isApproved = Boolean(pick(row, ["is_approved", "approved"])) || false;
  const emailVerified = Boolean(pick(row, ["email_verified"])) || false;
  const createdAt = toDateSafe(pick(row, ["created_at"])) || new Date();
  const updatedAt = toDateSafe(pick(row, ["updated_at"])) || createdAt;
  const accessReason = pick(row, ["access_reason"]) ?? "";

  return {
    id,
    data: {
      email,
      displayName,
      photoURL,
      role,
      isApproved,
      createdAt,
      updatedAt,
      emailVerified,
      accessReason,
    },
  } as const;
}

async function migrateSensors(pool: PgPoolLike, table: string, writer: admin.firestore.BulkWriter, discoveredPk?: { name: string; isNumeric: boolean }) {
  if (!adminDb) throw new Error("Firebase Admin SDK not initialized");
  console.log(`\n➡️ Migrating sensors from table \"${table}\"...`);
  const cols = await getColumns(pool, table);
  const colNames = cols.map((c) => c.column_name);

  const rows = await queryAll<any>(pool, `select * from "${table}"${limit ? ` limit ${limit}` : ""}`);
  let migrated = 0;
  for (const row of rows) {
    const mapped = mapSensorRow(row);
    const docId = mapped.id || undefined;
    const docRef = docId ? adminDb.collection("sensors").doc(docId) : adminDb.collection("sensors").doc();
    writer.set(docRef, mapped.data, { merge: true });
    migrated++;
  }
  console.log(`   Queued ${migrated} sensor documents.`);
}

async function migrateUsers(pool: PgPoolLike, table: string, writer: admin.firestore.BulkWriter) {
  if (!adminDb) throw new Error("Firebase Admin SDK not initialized");
  console.log(`\n➡️ Migrating users from table \"${table}\"...`);
  const rows = await queryAll<any>(pool, `select * from "${table}"${limit ? ` limit ${limit}` : ""}`);
  let migrated = 0;
  for (const row of rows) {
    const mapped = mapUserRow(row);
    if (!mapped.id) continue;
    const docRef = adminDb.collection("users").doc(mapped.id);
    writer.set(docRef, mapped.data, { merge: true });
    migrated++;
  }
  console.log(`   Queued ${migrated} user documents.`);
}

async function migrateSensorData(pool: PgPoolLike, table: string, writer: admin.firestore.BulkWriter, discoveredPk?: { name: string; isNumeric: boolean }) {
  if (!adminDb) throw new Error("Firebase Admin SDK not initialized");
  console.log(`\n➡️ Migrating sensor data from table \"${table}\"...`);

  // Simple pagination
  const idCol = discoveredPk?.name || orderColumn || "id";
  let lastId: number | string | undefined = undefined;
  let totalQueued = 0;

  // We'll do 100 iterations max in case of unknowns to avoid infinite loops
  for (let iter = 0; iter < 100000; iter++) {
    let sql = `select * from "${table}"`;
    if (discoveredPk?.isNumeric) {
      sql += ` where "${idCol}" > ${lastId ?? -1} order by "${idCol}" asc limit ${batchSize}`;
    } else if (orderColumn) {
      sql += ` ${lastId ? `where "${idCol}" > '${lastId}'` : ""} order by "${idCol}" asc limit ${batchSize}`;
    } else {
      sql += ` order by 1 asc limit ${batchSize} offset ${iter * batchSize}`;
    }

    const rows = await queryAll<any>(pool, sql);
    if (rows.length === 0) break;

    for (const row of rows) {
      const mapped = mapDataRow(row);
      if (!mapped.sensorId) continue;
      const parentRef = adminDb.collection("sensors").doc(String(mapped.sensorId));
      const docRef = mapped.id ? parentRef.collection("data").doc(mapped.id) : parentRef.collection("data").doc();
      writer.set(docRef, mapped.data, { merge: true });
      totalQueued++;
      if (discoveredPk?.isNumeric) {
        lastId = Number(row[idCol]);
      } else if (orderColumn) {
        lastId = String(row[idCol]);
      }
    }

    if (limit && totalQueued >= limit) break;
    if (!discoveredPk && !orderColumn && rows.length < batchSize) break; // offset mode end
  }
  console.log(`   Queued ${totalQueued} sensor data documents.`);
}

async function discoverAndPlan(pool: PgPoolLike) {
  const tables = await getTables(pool);
  const discovery: any[] = [];
  for (const t of tables) {
    const cols = await getColumns(pool, t.table_name);
    const names = cols.map((c) => c.column_name);
    const count = await getCount(pool, t.table_name);
    const sample = await getSample(pool, t.table_name, 2);
    discovery.push({ table: t.table_name, columns: names, count, sample });
  }

  // Decide candidates
  let sensorsT = sensorsTable;
  let dataT = dataTable;
  let usersT = usersTable;

  for (const d of discovery) {
    if (!sensorsT && looksLikeSensors(d.columns)) sensorsT = d.table;
    if (!dataT && looksLikeSensorData(d.columns)) dataT = d.table;
    if (!usersT && looksLikeUsers(d.columns)) usersT = d.table;
  }

  console.log("\n--- 🔎 Discovery Summary ---");
  for (const d of discovery) {
    console.log(`Table: ${d.table} (count=${d.count})`);
    console.log(`  Columns: ${d.columns.join(", ")}`);
    console.log(`  Sample:`, d.sample);
  }
  console.log("\nMapping candidates:");
  console.log(`  sensors table -> ${sensorsT ?? "(not detected)"}`);
  console.log(`  data table    -> ${dataT ?? "(not detected)"}`);
  console.log(`  users table   -> ${usersT ?? "(not detected)"}`);

  return { discovery, sensorsT, dataT, usersT } as const;
}

async function main() {
  const pool = createPgPool();
  try {
    console.log("🌉 Starting Postgres -> Firestore migration...");

    const plan = await discoverAndPlan(pool);

    if (isDryRun) {
      // Write discovery to a JSON file for easier inspection on Windows
      const report = {
        discovery: plan.discovery,
        mapping: {
          sensorsTable: plan.sensorsT,
          dataTable: plan.dataT,
          usersTable: plan.usersT,
        },
        generatedAt: new Date().toISOString(),
      };
      try {
        const outPath = pathResolve(process.cwd(), "migration-discovery.json");
        writeFileSync(outPath, JSON.stringify(report, null, 2), { encoding: "utf-8" });
        console.log(`\n(DRY RUN) Discovery report written to: ${outPath}`);
      } catch (e) {
        console.warn("Could not write discovery report:", e);
      }
      console.log("\n(DRY RUN) No writes performed. Use pnpm db:migrate to execute.");
      return;
    }

    if (!adminDb) {
      console.error("❌ Firebase Admin SDK not initialized. Check env vars.");
      process.exit(1);
    }

    // Prepare BulkWriter with basic error handler
    const writer = admin.firestore().bulkWriter();
    writer.onWriteError((err) => {
      console.error("Write error:", err);
      // retry transient errors up to 3 times
      if (err.failedAttempts < 3) {
        return true;
      }
      return false;
    });

    // Migrate in order: users -> sensors -> data
    if (plan.usersT) {
      await migrateUsers(pool, plan.usersT, writer);
    } else {
      console.log("ℹ️ No users table detected or provided. Skipping users.");
    }

    if (plan.sensorsT) {
      await migrateSensors(pool, plan.sensorsT, writer);
    } else {
      console.warn("⚠️ No sensors table detected. You may pass --sensors-table=...");
    }

    if (plan.dataT) {
      // attempt to detect PK type for pagination
      const cols = await getColumns(pool, plan.dataT);
      const idCol = (orderColumn || cols.find((c) => c.column_name.toLowerCase() === "id")?.column_name) as string | undefined;
      const isNumeric = idCol ? /int|numeric|bigint|smallint/i.test(cols.find((c) => c.column_name === idCol)?.data_type || "") : false;
      await migrateSensorData(pool, plan.dataT, writer, idCol ? { name: idCol, isNumeric } : undefined);
    } else {
      console.warn("⚠️ No sensor data table detected. You may pass --data-table=...");
    }

    await writer.close();
    console.log("✅ Migration writes completed.");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
