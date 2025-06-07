import { NextResponse } from "next/server"
import { checkDatabaseHealth, getDatabaseMetrics } from "@/lib/database-health"

export async function GET() {
  try {
    const [health, metrics] = await Promise.all([checkDatabaseHealth(), getDatabaseMetrics()])

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: health,
      metrics: metrics,
      version: process.env.npm_package_version || "1.0.0",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
