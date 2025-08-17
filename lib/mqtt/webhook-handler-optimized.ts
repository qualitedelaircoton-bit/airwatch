import { adminDb } from "@/lib/firebase-admin";

/**
 * Gestionnaire de webhook MQTT optimisé pour 2025
 * Intègre retry policy, monitoring, et sécurité renforcée
 */

export interface WebhookPayload {
  topic: string;
  payload: string;
  timestamp: number;
  clientid: string;
  qos: 0 | 1 | 2;
  retain: boolean;
}

export interface WebhookSecurityHeaders {
  authorization?: string;
  'x-webhook-secret'?: string;
  'x-emqx-source'?: string;
  'user-agent'?: string;
}

export interface WebhookMetrics {
  request_id: string;
  timestamp: string;
  processing_time: number;
  status: 'success' | 'error';
  error_type?: string;
  error_message?: string;
  sensor_id?: string;
  topic?: string;
  payload_size: number;
}

export class OptimizedWebhookHandler {
  private static instance: OptimizedWebhookHandler;
  private metricsBuffer: WebhookMetrics[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 secondes

  constructor() {
    // Démarrer le flush automatique des métriques
    setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  static getInstance(): OptimizedWebhookHandler {
    if (!OptimizedWebhookHandler.instance) {
      OptimizedWebhookHandler.instance = new OptimizedWebhookHandler();
    }
    return OptimizedWebhookHandler.instance;
  }

  /**
   * Validation de sécurité multi-niveaux
   */
  validateSecurity(headers: WebhookSecurityHeaders): {
    isValid: boolean;
    reason?: string;
  } {
    const secret = process.env.MQTT_WEBHOOK_SECRET;
    const expectedSource = process.env.MQTT_WEBHOOK_SOURCE || 'air-quality-platform';

    if (!secret) {
      return { isValid: false, reason: 'Webhook secret not configured' };
    }

    // Vérification du Bearer token
    const bearerAuth = headers.authorization;
    const isValidBearer = bearerAuth === `Bearer ${secret}`;

    // Vérification du header personnalisé
    const customAuth = headers['x-webhook-secret'];
    const isValidCustom = customAuth === secret;

    // Vérification de la source
    const source = headers['x-emqx-source'];
    const isValidSource = source === expectedSource;

    // Vérification du User-Agent
    const userAgent = headers['user-agent'];
    const isValidUserAgent = userAgent?.includes('EMQX-Webhook') || false;

    if (!isValidBearer) {
      return { isValid: false, reason: 'Invalid Bearer token' };
    }

    if (!isValidCustom) {
      return { isValid: false, reason: 'Invalid custom secret header' };
    }

    if (!isValidSource) {
      return { isValid: false, reason: 'Invalid or missing source header' };
    }

    if (!isValidUserAgent) {
      console.warn('Suspicious User-Agent:', userAgent);
      // Ne pas bloquer, mais log pour surveillance
    }

    return { isValid: true };
  }

  /**
   * Validation stricte du payload MQTT
   */
  validateMQTTPayload(data: any): {
    isValid: boolean;
    payload?: WebhookPayload;
    reason?: string;
  } {
    // Vérification des champs obligatoires
    const requiredFields = ['topic', 'payload', 'timestamp', 'clientid'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { isValid: false, reason: `Missing required field: ${field}` };
      }
    }

    // Validation du format topic
    const topicPattern = /^sensors\/[a-zA-Z0-9-_]+\/data$/;
    if (!topicPattern.test(data.topic)) {
      return { isValid: false, reason: `Invalid topic format: ${data.topic}` };
    }

    // Validation du payload JSON
    try {
      JSON.parse(data.payload);
    } catch (error) {
      return { isValid: false, reason: 'Invalid JSON payload' };
    }

    // Validation du timestamp
    const timestamp = parseInt(data.timestamp);
    if (isNaN(timestamp) || timestamp <= 0) {
      return { isValid: false, reason: 'Invalid timestamp' };
    }

    // Validation du clientid
    if (!data.clientid || typeof data.clientid !== 'string') {
      return { isValid: false, reason: 'Invalid clientid' };
    }

    // Validation QoS
    const validQoS = [0, 1, 2];
    if (data.qos !== undefined && !validQoS.includes(data.qos)) {
      return { isValid: false, reason: 'Invalid QoS level' };
    }

    return {
      isValid: true,
      payload: {
        topic: data.topic,
        payload: data.payload,
        timestamp: timestamp,
        clientid: data.clientid,
        qos: data.qos || 0,
        retain: Boolean(data.retain)
      }
    };
  }

  /**
   * Enregistrement des métriques avec buffering
   */
  recordMetrics(metrics: Omit<WebhookMetrics, 'request_id' | 'timestamp'>): void {
    const fullMetrics: WebhookMetrics = {
      request_id: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      ...metrics
    };

    this.metricsBuffer.push(fullMetrics);

    // Flush si le buffer est plein
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Flush des métriques vers Firestore
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const batch = adminDb.batch();
      
      metricsToFlush.forEach(metric => {
        const docRef = adminDb.collection('webhook_logs').doc();
        batch.set(docRef, metric);
      });

      await batch.commit();
      console.log(`✅ Flushed ${metricsToFlush.length} webhook metrics to Firestore`);
    } catch (error) {
      console.error('❌ Error flushing webhook metrics:', error);
      // Remettre les métriques dans le buffer en cas d'erreur
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Génération d'un ID de requête unique
   */
  private generateRequestId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validation du rate limiting (basique)
   */
  async checkRateLimit(clientId: string, ip: string): Promise<{
    allowed: boolean;
    resetTime?: number;
  }> {
    // Implémentation basique - en production, utilisez Redis ou Firestore
    const rateLimitKey = `rate_limit:${clientId}:${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 1000; // 1000 requêtes par minute

    try {
      // Simulation du rate limiting avec Firestore
      const rateLimitDoc = await adminDb
        .collection('rate_limits')
        .doc(rateLimitKey)
        .get();

      if (!rateLimitDoc.exists) {
        // Première requête dans cette fenêtre
        await adminDb.collection('rate_limits').doc(rateLimitKey).set({
          count: 1,
          resetTime: now + windowMs,
          createdAt: now
        });
        return { allowed: true };
      }

      const data = rateLimitDoc.data()!;
      
      // Vérifier si la fenêtre a expiré
      if (now > data.resetTime) {
        // Nouvelle fenêtre
        await adminDb.collection('rate_limits').doc(rateLimitKey).set({
          count: 1,
          resetTime: now + windowMs,
          createdAt: now
        });
        return { allowed: true };
      }

      // Vérifier le nombre de requêtes
      if (data.count >= maxRequests) {
        return { 
          allowed: false, 
          resetTime: data.resetTime 
        };
      }

      // Incrémenter le compteur
      await adminDb.collection('rate_limits').doc(rateLimitKey).update({
        count: data.count + 1
      });

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // En cas d'erreur, permettre la requête (fail-open)
      return { allowed: true };
    }
  }

  /**
   * Nettoyage des anciennes métriques et rate limits
   */
  async cleanup(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      // Nettoyer les anciens logs de webhook
      const oldLogsQuery = adminDb
        .collection('webhook_logs')
        .where('timestamp', '<', sevenDaysAgo.toISOString())
        .limit(500);

      const oldLogsSnapshot = await oldLogsQuery.get();
      
      if (!oldLogsSnapshot.empty) {
        const batch = adminDb.batch();
        oldLogsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🧹 Cleaned up ${oldLogsSnapshot.size} old webhook logs`);
      }

      // Nettoyer les anciens rate limits
      const oldRateLimitsQuery = adminDb
        .collection('rate_limits')
        .where('createdAt', '<', Date.now() - 60 * 60 * 1000) // 1 heure
        .limit(500);

      const oldRateLimitsSnapshot = await oldRateLimitsQuery.get();
      
      if (!oldRateLimitsSnapshot.empty) {
        const batch = adminDb.batch();
        oldRateLimitsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🧹 Cleaned up ${oldRateLimitsSnapshot.size} old rate limits`);
      }

    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

export const webhookHandler = OptimizedWebhookHandler.getInstance();
