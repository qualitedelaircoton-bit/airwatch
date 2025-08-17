# 🚀 Configuration MQTT/EMQX Optimisée 2025

## Vue d'Ensemble

Ce document présente une configuration complète et optimisée de MQTT avec EMQX Cloud pour la plateforme de qualité de l'air, basée sur les meilleures pratiques 2025.

## 📋 Architecture Cible

### Principe Fondamental
**Webhook-First Architecture** avec monitoring, retry policies, et sécurité renforcée.

```
Capteur IoT → EMQX Cloud → Webhook (Firebase Functions) → Firestore → Dashboard
    ↓              ↓               ↓                      ↓
Monitoring → Health Check → Retry Policy → Real-time Updates
```

## 🔧 Configuration EMQX Cloud

### 1. Paramètres de Base

```yaml
# Broker Configuration
broker_url: "z166d525.ala.us-east-1.emqxsl.com"
mqtt_port: 8883  # Plateforme (TLS)
mqtt_unsecure_port: 1883  # Capteurs IoT
websocket_port: 8084  # WebSocket sécurisé

# Authentification
platform_auth:
  username: "${MQTT_USERNAME}"
  password: "${MQTT_PASSWORD}"
  tls: required

device_auth:
  username: "${MQTT_DEVICE_USERNAME}"
  password: "${MQTT_DEVICE_PASSWORD}"
  tls: optional
```

### 2. Configuration des Topics

#### Structure Hiérarchique
```
sensors/{sensor_id}/data          # Données capteur
sensors/{sensor_id}/status        # Statut capteur
sensors/{sensor_id}/config        # Configuration capteur
system/heartbeat                  # Health check système
system/alerts                     # Alertes système
```

#### Filtres de Topics
```sql
-- Webhook Rule pour données capteur
SELECT 
  payload,
  topic,
  timestamp,
  clientid
FROM "sensors/+/data"
WHERE payload.sensorId != ''

-- Rule pour alertes
SELECT *
FROM "system/alerts"
WHERE payload.level IN ('warning', 'error', 'critical')
```

## 📡 Configuration Webhook Optimisée

### 1. Paramètres Webhook EMQX

```json
{
  "name": "air-quality-webhook-production",
  "url": "${FIREBASE_FUNCTION_URL}/mqttWebhook",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${MQTT_WEBHOOK_SECRET}",
    "X-Webhook-Secret": "${MQTT_WEBHOOK_SECRET}",
    "X-EMQX-Source": "air-quality-platform",
    "User-Agent": "EMQX-Webhook/5.x"
  },
  "body": {
    "topic": "${topic}",
    "payload": "${payload}",
    "timestamp": "${timestamp}",
    "clientid": "${clientid}",
    "qos": "${qos}",
    "retain": "${retain}"
  }
}
```

### 2. Retry Policy & Circuit Breaker

```json
{
  "retry": {
    "max_retries": 3,
    "initial_interval": "1s",
    "max_interval": "60s",
    "multiplier": 2.0,
    "max_elapsed_time": "300s"
  },
  "circuit_breaker": {
    "failure_threshold": 5,
    "recovery_timeout": "30s",
    "half_open_max_calls": 3
  },
  "timeout": "10s",
  "pool_size": 100
}
```

## 🔒 Sécurité Renforcée

### 1. Authentification Multi-Niveaux

```typescript
// Firebase Function - Validation auth renforcée
export const validateWebhookAuth = (req: Request): boolean => {
  const bearerAuth = req.headers.authorization;
  const customAuth = req.headers['x-webhook-secret'];
  const sourceAuth = req.headers['x-emqx-source'];
  
  const isValidBearer = bearerAuth === `Bearer ${WEBHOOK_SECRET}`;
  const isValidCustom = customAuth === WEBHOOK_SECRET;
  const isValidSource = sourceAuth === 'air-quality-platform';
  
  return isValidBearer && isValidCustom && isValidSource;
};
```

### 2. Rate Limiting

```typescript
// Rate limiting par IP et source
const rateLimiter = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,    // Max 1000 requêtes/min
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};
```

### 3. Validation Payload Stricte

```typescript
interface ValidatedMQTTPayload {
  topic: string;
  payload: string;
  timestamp: number;
  clientid: string;
  qos: 0 | 1 | 2;
  retain: boolean;
}

const validateMQTTPayload = (data: any): ValidatedMQTTPayload | null => {
  // Validation stricte du format EMQX
  const required = ['topic', 'payload', 'timestamp', 'clientid'];
  if (!required.every(field => field in data)) {
    return null;
  }
  
  // Validation du topic pattern
  if (!data.topic.match(/^sensors\/[a-zA-Z0-9-_]+\/data$/)) {
    return null;
  }
  
  return data as ValidatedMQTTPayload;
};
```

## 📊 Monitoring et Observabilité

### 1. Health Checks Dédiés

```typescript
// API Route: /api/mqtt/health
export async function GET() {
  const healthStatus = {
    emqx_cloud: await checkEMQXHealth(),
    webhook_endpoint: await checkWebhookHealth(),
    last_message_received: await getLastMessageTimestamp(),
    active_sensors: await getActiveSensorsCount(),
    error_rate: await getWebhookErrorRate(),
    performance: {
      avg_processing_time: await getAvgProcessingTime(),
      success_rate: await getSuccessRate()
    }
  };
  
  return NextResponse.json(healthStatus);
}
```

### 2. Métriques en Temps Réel

```typescript
interface MQTTMetrics {
  messages_received_total: number;
  messages_processed_success: number;
  messages_processed_error: number;
  webhook_response_time_avg: number;
  active_connections: number;
  topics_subscribed: string[];
  last_activity: Date;
}
```

### 3. Alerting Automatique

```typescript
// Alertes configurables
const alertConfig = {
  webhook_failure_threshold: 3,    // 3 échecs consécutifs
  message_delay_threshold: 300,    // 5 minutes sans message
  error_rate_threshold: 0.05,      // 5% d'erreurs
  response_time_threshold: 5000    // 5 secondes de réponse
};
```

## 🛠️ Implémentation Technique

### 1. Variables d'Environnement

```env
# EMQX Cloud Configuration
MQTT_BROKER_URL="z166d525.ala.us-east-1.emqxsl.com"
MQTT_PORT="8883"
MQTT_UNSECURE_PORT="1883"
MQTT_WS_PORT="8084"

# Authentication Platform
MQTT_USERNAME="air-quality-platform"
MQTT_PASSWORD="secure_platform_password_2025"

# Authentication Devices
MQTT_DEVICE_USERNAME="air-quality-devices"
MQTT_DEVICE_PASSWORD="secure_device_password_2025"

# Webhook Security
MQTT_WEBHOOK_SECRET="ultra_secure_webhook_secret_2025"
MQTT_WEBHOOK_SOURCE="air-quality-platform"

# Monitoring
MQTT_HEALTH_CHECK_INTERVAL="60000"  # 1 minute
MQTT_METRICS_RETENTION="7d"        # 7 jours
```

### 2. Structure des Fichiers

```
├── lib/
│   ├── mqtt/
│   │   ├── client.ts              # Client MQTT optimisé
│   │   ├── webhook-handler.ts     # Gestionnaire webhook
│   │   ├── metrics-collector.ts   # Collecteur de métriques
│   │   └── health-checker.ts      # Health checks
├── app/api/mqtt/
│   ├── health/route.ts           # API health check
│   ├── metrics/route.ts          # API métriques
│   └── webhook/route.ts          # Webhook endpoint
├── functions/src/
│   ├── mqtt-webhook.ts           # Firebase Function
│   └── mqtt-monitoring.ts        # Monitoring Firebase
└── docs/
    ├── MQTT_EMQX_OPTIMIZED_CONFIGURATION.md
    └── MQTT_MONITORING_GUIDE.md
```

## 🔄 Migration Depuis l'Existant

### Étapes de Migration

1. **Sauvegarde Configuration Actuelle**
   ```bash
   # Backup des variables d'environnement
   cp .env .env.backup.$(date +%Y%m%d)
   ```

2. **Mise à Jour Progressive**
   - Ajouter nouvelles variables d'environnement
   - Déployer nouveaux endpoints monitoring
   - Configurer retry policy EMQX
   - Tester en parallèle

3. **Validation**
   ```bash
   # Test de la nouvelle configuration
   pnpm test:mqtt-health
   pnpm test:webhook-performance
   ```

## 📈 Optimisations de Performance

### 1. Pooling de Connexions
```typescript
const mqttConnectionPool = {
  maxConnections: 50,
  keepAlive: 60,
  reconnectPeriod: 1000,
  connectTimeout: 30000
};
```

### 2. Batch Processing
```typescript
// Traitement par lot pour réduire les appels Firestore
const batchProcessor = {
  batchSize: 10,
  flushInterval: 5000, // 5 secondes
  maxWaitTime: 30000   // 30 secondes max
};
```

### 3. Caching Intelligent
```typescript
// Cache des métadonnées capteurs
const sensorCache = {
  ttl: 300000,        // 5 minutes
  maxSize: 1000,      // 1000 capteurs max
  refreshOnAccess: true
};
```

## 🧪 Tests et Validation

### 1. Tests Automatisés
```bash
# Suite de tests complète
pnpm test:mqtt-connection
pnpm test:webhook-security
pnpm test:data-validation
pnpm test:performance
```

### 2. Tests de Charge
```bash
# Simulation de charge avec K6
k6 run tests/mqtt-load-test.js
```

### 3. Tests de Failover
```bash
# Tests de résistance aux pannes
pnpm test:circuit-breaker
pnpm test:retry-policy
```

## 📚 Documentation et Maintenance

### 1. Runbooks
- Procédures de dépannage webhook
- Guide de scaling EMQX
- Protocoles d'incident

### 2. Monitoring Dashboards
- Grafana pour métriques temps réel
- Alerting Slack/Email
- Reports hebdomadaires automatiques

### 3. Formation Équipe
- Workshop MQTT/EMQX
- Bonnes pratiques IoT
- Procédures d'urgence

---

## 🎯 Résultats Attendus

- ✅ **Fiabilité**: 99.9% de disponibilité webhook
- ✅ **Performance**: < 100ms temps de réponse moyen  
- ✅ **Sécurité**: Authentification multi-niveaux
- ✅ **Monitoring**: Observabilité complète
- ✅ **Scalabilité**: Support 10k+ capteurs simultanés

Cette configuration optimisée assure une plateforme MQTT robuste, sécurisée et performante pour 2025 et au-delà.
