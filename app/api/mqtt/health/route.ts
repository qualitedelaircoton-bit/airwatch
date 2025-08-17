import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface MQTTHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  emqx_cloud: {
    status: 'connected' | 'disconnected';
    last_check: string;
  };
  webhook_endpoint: {
    status: 'operational' | 'error';
    last_received: string | null;
    success_rate: number;
  };
  database: {
    status: 'connected' | 'error';
    response_time: number;
  };
  active_sensors: number;
  metrics: {
    messages_last_hour: number;
    error_rate: number;
    avg_processing_time: number;
  };
}

async function checkDatabaseHealth(): Promise<{ status: 'connected' | 'error', response_time: number }> {
  const startTime = Date.now();
  try {
    await adminDb.collection("sensors").limit(1).get();
    return {
      status: 'connected',
      response_time: Date.now() - startTime
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: 'error',
      response_time: Date.now() - startTime
    };
  }
}

async function getActiveSensorsCount(): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sensorsSnapshot = await adminDb
      .collection("sensors")
      .where("lastSeen", ">=", oneHourAgo)
      .get();
    return sensorsSnapshot.size;
  } catch (error) {
    console.error("Error getting active sensors count:", error);
    return 0;
  }
}

async function getWebhookMetrics(): Promise<{
  last_received: string | null;
  success_rate: number;
  messages_last_hour: number;
  error_rate: number;
  avg_processing_time: number;
}> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Get webhook logs from the last hour (simulé pour l'exemple)
    // En production, vous pourriez utiliser Firebase Analytics ou une collection dédiée
    const logsSnapshot = await adminDb
      .collection("webhook_logs")
      .where("timestamp", ">=", oneHourAgo)
      .orderBy("timestamp", "desc")
      .limit(1000)
      .get();

    const logs = logsSnapshot.docs.map(doc => doc.data());
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.status === 'success').length;
    const errorRequests = logs.filter(log => log.status === 'error').length;
    
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    // Calcul du temps de traitement moyen
    const processingTimes = logs
      .filter(log => log.processing_time)
      .map(log => log.processing_time);
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    const lastReceived = logs.length > 0 ? logs[0].timestamp : null;

    return {
      last_received: lastReceived,
      success_rate: Math.round(successRate * 100) / 100,
      messages_last_hour: totalRequests,
      error_rate: Math.round(errorRate * 100) / 100,
      avg_processing_time: Math.round(avgProcessingTime * 100) / 100
    };
  } catch (error) {
    console.error("Error getting webhook metrics:", error);
    return {
      last_received: null,
      success_rate: 0,
      messages_last_hour: 0,
      error_rate: 0,
      avg_processing_time: 0
    };
  }
}

export async function GET(): Promise<NextResponse<MQTTHealthStatus>> {
  try {
    const [dbHealth, activeSensors, webhookMetrics] = await Promise.all([
      checkDatabaseHealth(),
      getActiveSensorsCount(),
      getWebhookMetrics()
    ]);

    // Déterminer le statut général
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbHealth.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (webhookMetrics.error_rate > 10 || webhookMetrics.success_rate < 90) {
      overallStatus = 'degraded';
    } else if (activeSensors === 0) {
      overallStatus = 'degraded';
    }

    const healthStatus: MQTTHealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      emqx_cloud: {
        status: webhookMetrics.messages_last_hour > 0 ? 'connected' : 'disconnected',
        last_check: new Date().toISOString()
      },
      webhook_endpoint: {
        status: webhookMetrics.error_rate < 5 ? 'operational' : 'error',
        last_received: webhookMetrics.last_received,
        success_rate: webhookMetrics.success_rate
      },
      database: dbHealth,
      active_sensors: activeSensors,
      metrics: {
        messages_last_hour: webhookMetrics.messages_last_hour,
        error_rate: webhookMetrics.error_rate,
        avg_processing_time: webhookMetrics.avg_processing_time
      }
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error("MQTT health check failed:", error);
    
    const errorStatus: MQTTHealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      emqx_cloud: {
        status: 'disconnected',
        last_check: new Date().toISOString()
      },
      webhook_endpoint: {
        status: 'error',
        last_received: null,
        success_rate: 0
      },
      database: {
        status: 'error',
        response_time: 0
      },
      active_sensors: 0,
      metrics: {
        messages_last_hour: 0,
        error_rate: 100,
        avg_processing_time: 0
      }
    };

    return NextResponse.json(errorStatus, { status: 500 });
  }
}
