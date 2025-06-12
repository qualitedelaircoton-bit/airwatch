# 📡 Guide de Configuration MQTT - Plateforme Qualité de l'Air

## 🔧 Configuration du Broker MQTT

### Informations de Base
- **Adresse IP** : Configurée via `MQTT_BROKER_URL`
- **Protocol MQTT** : v3.1.1 (recommandé pour compatibilité IoT)

### Ports de Communication

#### 🔐 Plateforme (Connexion Sécurisée TLS/SSL)
- **Port** : `8883`
- **Protocol** : `mqtts://`
- **Sécurité** : TLS/SSL obligatoire
- **Usage** : Applications web, serveurs, monitoring

#### 🌐 Devices IoT (Connexion Non-Sécurisée)
- **Port** : `1883`
- **Protocol** : `mqtt://`
- **Sécurité** : Aucune (pour compatibilité hardware)
- **Usage** : Capteurs IoT, devices embarqués

---

## 📋 Structure des Topics MQTT

### 🎯 Topics Principaux

#### Données de Capteurs
```
sensors/{device_id}/data
```
**Exemple** : `sensors/air-sensor-001/data`

#### Statut Système
```
system/air-quality-listener/status
system/air-quality-listener/will
```

### 📊 Format des Données (JSON)

```json
{
  "sensorId": "air-sensor-001",
  "timestamp": "2025-01-XX T14:30:00.000Z",
  "pm1_0": 12.5,
  "pm2_5": 25.3,
  "pm10": 45.8,
  "o3_raw": 120.5,
  "o3_corrige": 118.2,
  "no2_voltage_mv": 850,
  "no2_ppb": 15.2,
  "voc_voltage_mv": 1200,
  "co_voltage_mv": 650,
  "co_ppb": 8.5
}
```

---

## 🔑 Configuration d'Authentification

### Pour Plateforme (Port configuré via MQTT_SECURE_PORT)
```
Username: Configuré via MQTT_USERNAME
Password: Configuré via MQTT_PASSWORD
TLS: Requis
```

### Pour Devices IoT (Port configuré via MQTT_UNSECURE_PORT)
```
Username: Configuré via MQTT_DEVICE_USERNAME
Password: Configuré via MQTT_DEVICE_PASSWORD
TLS: Non requis
```

---

## ⚙️ Configuration des Devices IoT

### Configuration Arduino/ESP32

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// Configuration MQTT (à remplir avec vos vraies valeurs)
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";  // Remplacer par MQTT_BROKER_URL
const int mqtt_port = 1883;
const char* mqtt_user = "YOUR_DEVICE_USERNAME";   // Remplacer par MQTT_DEVICE_USERNAME
const char* mqtt_password = "YOUR_DEVICE_PASSWORD"; // Remplacer par MQTT_DEVICE_PASSWORD
const char* device_id = "YOUR_UNIQUE_DEVICE_ID";   // ID unique pour votre capteur

// Topics
String data_topic = "sensors/" + String(device_id) + "/data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    // Configuration WiFi
    WiFi.begin(ssid, password);
    
    // Configuration MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void publishSensorData() {
    String payload = "{";
    payload += "\"sensorId\":\"" + String(device_id) + "\",";
    payload += "\"timestamp\":\"" + getTimestamp() + "\",";
    payload += "\"pm1_0\":" + String(pm1_0) + ",";
    payload += "\"pm2_5\":" + String(pm2_5) + ",";
    payload += "\"pm10\":" + String(pm10) + ",";
    payload += "\"o3_raw\":" + String(o3_raw) + ",";
    payload += "\"o3_corrige\":" + String(o3_corrige) + ",";
    payload += "\"no2_voltage_mv\":" + String(no2_voltage_mv) + ",";
    payload += "\"no2_ppb\":" + String(no2_ppb) + ",";
    payload += "\"voc_voltage_mv\":" + String(voc_voltage_mv) + ",";
    payload += "\"co_voltage_mv\":" + String(co_voltage_mv) + ",";
    payload += "\"co_ppb\":" + String(co_ppb);
    payload += "}";
    
    client.publish(data_topic.c_str(), payload.c_str());
}
```

### Configuration Python (Paho MQTT)

```python
import paho.mqtt.client as mqtt
import json
import time

# Configuration (utiliser les variables d'environnement)
import os

MQTT_BROKER = os.getenv('MQTT_BROKER_URL', 'YOUR_BROKER_IP')
MQTT_PORT = int(os.getenv('MQTT_UNSECURE_PORT', '1883'))
MQTT_USER = os.getenv('MQTT_DEVICE_USERNAME', 'YOUR_USERNAME')
MQTT_PASSWORD = os.getenv('MQTT_DEVICE_PASSWORD', 'YOUR_PASSWORD')
DEVICE_ID = os.getenv('DEVICE_ID', 'YOUR_UNIQUE_DEVICE_ID')

def on_connect(client, userdata, flags, rc):
    print(f"Connecté avec le code : {rc}")

def publish_sensor_data(client, sensor_data):
    topic = f"sensors/{DEVICE_ID}/data"
    payload = json.dumps(sensor_data)
    client.publish(topic, payload, qos=1)

# Création du client
client = mqtt.Client()
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.on_connect = on_connect

# Connexion
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

# Exemple d'envoi de données
sensor_data = {
    "sensorId": DEVICE_ID,
    "timestamp": "2025-01-XX T14:30:00.000Z",
    "pm1_0": 12.5,
    "pm2_5": 25.3,
    "pm10": 45.8,
    "o3_raw": 120.5,
    "o3_corrige": 118.2,
    "no2_voltage_mv": 850,
    "no2_ppb": 15.2,
    "voc_voltage_mv": 1200,
    "co_voltage_mv": 650,
    "co_ppb": 8.5
}

publish_sensor_data(client, sensor_data)
```

---

## 🧪 Test de Connexion

### Test depuis Terminal (mosquitto_pub)

```bash
# Installation des outils mosquitto (Ubuntu/Debian)
sudo apt-get install mosquitto-clients

# Test de publication (device IoT)
# Remplacer YOUR_BROKER_IP, YOUR_USERNAME, YOUR_PASSWORD par vos vraies valeurs
mosquitto_pub -h YOUR_BROKER_IP -p 1883 \
  -u YOUR_USERNAME -P YOUR_PASSWORD \
  -t "sensors/test-device/data" \
  -m '{"sensorId":"test-device","timestamp":"2025-01-XX T14:30:00.000Z","pm2_5":25.3}'

# Test d'abonnement (écoute)
mosquitto_sub -h YOUR_BROKER_IP -p 1883 \
  -u YOUR_USERNAME -P YOUR_PASSWORD \
  -t "sensors/+/data"
```

### Test avec Node.js

```javascript
const mqtt = require('mqtt');

// Configuration pour device IoT (utiliser les variables d'environnement)
const client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_URL}:${process.env.MQTT_UNSECURE_PORT}`, {
    username: process.env.MQTT_DEVICE_USERNAME,
    password: process.env.MQTT_DEVICE_PASSWORD,
    clientId: 'test-client-' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', () => {
    console.log('✅ Connecté au broker MQTT');
    
    // Test de publication
    const testData = {
        sensorId: 'test-device',
        timestamp: new Date().toISOString(),
        pm2_5: 25.3
    };
    
    client.publish('sensors/test-device/data', JSON.stringify(testData));
    console.log('📤 Données publiées');
});

client.on('error', (error) => {
    console.error('❌ Erreur MQTT:', error);
});
```

---

## 🔒 Sécurité et Best Practices

### Devices IoT (Port 1883)
- ✅ Utiliser des identifiants uniques par device
- ✅ Changer les mots de passe par défaut
- ✅ Implémenter un watchdog de connexion
- ✅ Utiliser QoS 1 pour les données critiques

### Plateforme (Port 8883)
- ✅ TLS/SSL obligatoire
- ✅ Certificats valides
- ✅ Sessions persistantes activées
- ✅ Monitoring des connexions

---

## 📊 QoS Recommandés

### Données de Capteurs
- **QoS 1** : Au moins une fois (recommandé)
- Garantit la livraison sans duplication excessive

### Messages de Statut
- **QoS 0** : Au plus une fois (suffisant)
- Pour les heartbeats et messages non-critiques

### Will Messages
- **QoS 1** avec `retain: true`
- Pour notifications de déconnexion

---

## 🚨 Dépannage

### Problèmes Courants

#### ❌ Connexion Refusée
```
Vérifier :
- IP et port corrects
- Identifiants valides
- Firewall ouvert
```

#### ❌ Timeout de Connexion
```
Solutions :
- Augmenter keepalive (60s)
- Vérifier la connectivité réseau
- Tester avec ping 
```

#### ❌ Messages Non Reçus
```
Contrôler :
- Format JSON valide
- Topics corrects (sensors/{id}/data)
- QoS approprié
```

### Commandes de Debug

```bash
# Test de connectivité (remplacer YOUR_BROKER_IP par votre IP)
ping YOUR_BROKER_IP

# Test des ports ouverts
telnet YOUR_BROKER_IP 1883
telnet YOUR_BROKER_IP 8883

# Monitoring MQTT (remplacer par vos vraies valeurs)
mosquitto_sub -h YOUR_BROKER_IP -p 1883 \
  -u YOUR_USERNAME -P YOUR_PASSWORD \
  -t "#" -v
```

---


## ✅ Checklist de Configuration

### Device IoT
- [ ] IP broker : Configuré via `MQTT_BROKER_URL`
- [ ] Port : Configuré via `MQTT_UNSECURE_PORT` (défaut: 1883)
- [ ] Username : Configuré via `MQTT_DEVICE_USERNAME`
- [ ] Password : Configuré via `MQTT_DEVICE_PASSWORD`
- [ ] Client ID : unique par device
- [ ] Topic : `sensors/{device_id}/data`
- [ ] Format JSON : valide
- [ ] QoS : 1 (recommandé)

### Plateforme
- [ ] Port : `8883`
- [ ] TLS/SSL : activé
- [ ] Certificats : valides
- [ ] Abonnement : `sensors/+/data`
- [ ] Heartbeat : configuré
- [ ] Monitoring : opérationnel

---

*Pour plus d'aide, consultez les logs de la plateforme ou contactez l'équipe technique.* 