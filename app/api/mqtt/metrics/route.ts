import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = 'nodejs'

interface MQTTMetrics {
  timeframe: string;
  total_messages: number;
  successful_messages: number;
  failed_messages: number;
  unique_sensors: number;
  performance: {
    avg_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
  };
  topics: {
    [topic: string]: {
      message_count: number;
      last_activity: string;
    };
  };
  errors: {
    [error_type: string]: number;
  };
  hourly_breakdown: Array<{
    hour: string;
    messages: number;
    errors: number;
    success_rate: number;
  }>;
}

async function getMQTTMetrics(hours: number = 24): Promise<MQTTMetrics> {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  try {
    // Récupérer les logs de webhook pour la période
    if (!adminDb) {
      return {
        timeframe: `${hours}h`,
        total_messages: 0,
        successful_messages: 0,
        failed_messages: 0,
        unique_sensors: 0,
        performance: { avg_response_time: 0, p95_response_time: 0, p99_response_time: 0 },
        topics: {},
        errors: { database_error: 1 },
        hourly_breakdown: []
      };
    }
    const logsSnapshot = await adminDb
      .collection("webhook_logs")
      .where("timestamp", ">=", startTime)
      .orderBy("timestamp", "desc")
      .get();

    const logs: any[] = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));

    // Calculer les métriques de base
    const totalMessages = logs.length;
    const successfulMessages = logs.filter(log => log.status === 'success').length;
    const failedMessages = logs.filter(log => log.status === 'error').length;

    // Capteurs uniques
    const uniqueSensors = new Set(
      logs
        .filter(log => log.sensor_id)
        .map(log => log.sensor_id)
    ).size;

    // Métriques de performance
    const responseTimes = logs
      .filter(log => log.processing_time && typeof log.processing_time === 'number')
      .map(log => log.processing_time)
      .sort((a, b) => a - b);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const performance = {
      avg_response_time: Math.round(avgResponseTime * 100) / 100,
      p95_response_time: responseTimes[p95Index] || 0,
      p99_response_time: responseTimes[p99Index] || 0
    };

    // Analyse par topic
    const topicStats: { [topic: string]: { message_count: number; last_activity: string } } = {};
    logs.forEach((log: any) => {
      const t = log?.topic as string | undefined;
      const ts = log?.timestamp as string | number | Date | undefined;
      if (!t) return;
      if (!topicStats[t]) {
        topicStats[t] = {
          message_count: 0,
          last_activity: ts ? new Date(ts as any).toISOString() : new Date(0).toISOString()
        };
      }
      topicStats[t].message_count++;
      if (ts && new Date(ts as any) > new Date(topicStats[t].last_activity)) {
        topicStats[t].last_activity = new Date(ts as any).toISOString();
      }
    });

    // Analyse des erreurs
    const errorStats: { [error_type: string]: number } = {};
    logs
      .filter(log => log.status === 'error' && log.error_type)
      .forEach(log => {
        const errorType = log.error_type || 'unknown';
        errorStats[errorType] = (errorStats[errorType] || 0) + 1;
      });

    // Répartition horaire
    const hourlyBreakdown: Array<{
      hour: string;
      messages: number;
      errors: number;
      success_rate: number;
    }> = [];

    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(Date.now() - i * 60 * 60 * 1000);
      
      const hourLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= hourStart && logTime < hourEnd;
      });

      const hourMessages = hourLogs.length;
      const hourErrors = hourLogs.filter(log => log.status === 'error').length;
      const successRate = hourMessages > 0 ? ((hourMessages - hourErrors) / hourMessages) * 100 : 100;

      const hourIso = hourStart.toISOString();
      const hourLabel = (hourIso.split('T')[1] || '').split(':')[0] ? ((hourIso.split('T')[1] as string).split(':')[0] + ':00') : hourStart.getHours().toString().padStart(2, '0') + ':00';
      hourlyBreakdown.unshift({
        hour: hourLabel,
        messages: hourMessages,
        errors: hourErrors,
        success_rate: Math.round(successRate * 100) / 100
      });
    }

    return {
      timeframe: `${hours}h`,
      total_messages: totalMessages,
      successful_messages: successfulMessages,
      failed_messages: failedMessages,
      unique_sensors: uniqueSensors,
      performance,
      topics: topicStats,
      errors: errorStats,
      hourly_breakdown: hourlyBreakdown
    };

  } catch (error) {
    console.error("Error getting MQTT metrics:", error);
    
    // Retourner des métriques vides en cas d'erreur
    return {
      timeframe: `${hours}h`,
      total_messages: 0,
      successful_messages: 0,
      failed_messages: 0,
      unique_sensors: 0,
      performance: {
        avg_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0
      },
      topics: {},
      errors: { database_error: 1 },
      hourly_breakdown: []
    };
  }
}

export async function GET(request: Request): Promise<NextResponse<MQTTMetrics>> {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    // Valider le paramètre hours
    if (hours < 1 || hours > 168) { // Max 7 jours
      return NextResponse.json(
        { error: "Invalid hours parameter. Must be between 1 and 168." } as any,
        { status: 400 }
      );
    }

    const metrics = await getMQTTMetrics(hours);
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("MQTT metrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" } as any,
      { status: 500 }
    );
  }
}
