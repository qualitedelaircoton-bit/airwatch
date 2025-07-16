export interface MQTTSensorData {
  sensorId: string;
  timestamp: string;
  pm1_0: number;
  pm2_5: number;
  pm10: number;
  o3_raw: number;
  o3_corrige: number;
  no2_voltage_v: number;
  no2_ppb: number;
  voc_voltage_v: number;
  co_voltage_v: number;
  co_ppb: number;
}

export function transformDeviceData(rawData: any, sensorId: string): MQTTSensorData | null {
  try {
    const requiredDeviceKeys = ['ts', 'PM1', 'PM25', 'PM10', 'O3', 'O3c', 'NO2v', 'NO2', 'VOCv', 'COv', 'CO'];
    for (const key of requiredDeviceKeys) {
      if (!(key in rawData)) {
        console.warn(`⚠️ Champ manquant de l'appareil: ${key}`);
        return null;
      }
    }

    let timestamp = new Date().toISOString();
    if (typeof rawData.ts === 'number') {
      const tsValue = rawData.ts < 10000000000 ? rawData.ts * 1000 : rawData.ts;
      timestamp = new Date(tsValue).toISOString();
    }

    return {
      sensorId,
      timestamp,
      pm1_0: Number(rawData.PM1),
      pm2_5: Number(rawData.PM25),
      pm10: Number(rawData.PM10),
      o3_raw: Number(rawData.O3),
      o3_corrige: Number(rawData.O3c),
      no2_voltage_v: Number(rawData.NO2v),
      no2_ppb: Number(rawData.NO2),
      voc_voltage_v: Number(rawData.VOCv),
      co_voltage_v: Number(rawData.COv),
      co_ppb: Number(rawData.CO),
    };
  } catch (error) {
    console.error("❌ Erreur transformation données:", error);
    return null;
  }
}

export function validateSensorData(data: any): data is MQTTSensorData {
  const requiredKeys: (keyof MQTTSensorData)[] = [
    'sensorId', 'timestamp', 'pm1_0', 'pm2_5', 'pm10', 'o3_raw', 'o3_corrige',
    'no2_voltage_v', 'no2_ppb', 'voc_voltage_v', 'co_voltage_v', 'co_ppb'
  ];
  for (const key of requiredKeys) {
    if (!(key in data)) {
      console.warn(`⚠️ Champ de données manquant: ${key}`);
      return false;
    }
  }
  return true;
}
