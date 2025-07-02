# 🔗 Configuration MQTT Webhook pour Production Vercel

## Problème Résolu

Vercel est une plateforme **serverless** qui ne peut pas maintenir des connexions persistantes comme les services MQTT. Cette configuration utilise des **webhooks HTTP** pour recevoir les données MQTT en production.

## 📋 Architecture

```
Capteur → EMQX Cloud → Webhook HTTP → Vercel Function → Base de données
```

- **Développement local** : MQTT listener persistant (comme avant)
- **Production Vercel** : Webhook HTTP via `/api/mqtt/webhook`

## 🚀 Étapes de Configuration

### 1. Variables d'Environnement

Ajoutez à votre `.env.local` et sur Vercel :

```env
# Sécurité webhook (générez un secret aléatoire fort)
MQTT_WEBHOOK_SECRET="votre-secret-webhook-super-securise-ici"
```

**Sur Vercel Dashboard** :
1. Projet → Settings → Environment Variables
2. Ajouter `MQTT_WEBHOOK_SECRET` avec une valeur sécurisée

### 2. Déployer sur Vercel

```bash
# Build et déploiement
pnpm build
vercel --prod
```

Votre webhook sera disponible à :
```
https://votre-app.vercel.app/api/mqtt/webhook
```

### 3. Configuration EMQX Cloud

#### A. Accéder aux Webhooks EMQX

1. Connectez-vous à votre console EMQX Cloud
2. Sélectionnez votre déploiement
3. Allez dans **Integration** > **Webhooks**
4. Cliquez **Create Webhook**

#### B. Configuration du Webhook

**Webhook Settings :**
- **Name** : `vercel-production-webhook`
- **URL** : `https://votre-app.vercel.app/api/mqtt/webhook`
- **Method** : `POST`
- **Headers** :
  ```
  Content-Type: application/json
  Authorization: Bearer votre-secret-webhook-super-securise-ici
  ```

**Trigger Settings :**
- **Event** : `Message Published`
- **Topic Filter** : `sensors/+/data`
- **QoS** : `1`

**Payload Template :**
```json
{
  "clientid": "${clientid}",
  "username": "${username}",
  "topic": "${topic}",
  "payload": "${payload}",
  "qos": ${qos},
  "retain": ${retain},
  "timestamp": ${timestamp}
}
```

#### C. Test et Activation

1. **Save** la configuration
2. **Enable** le webhook
3. Testez avec le script : `pnpm tsx scripts/test-webhook.ts`

## 🧪 Tests

### Test Local du Webhook

```bash
# Tester le webhook en local
pnpm tsx scripts/test-webhook.ts
```

### Test Production

```bash
# Avec votre URL Vercel
VERCEL_URL=votre-app.vercel.app pnpm tsx scripts/test-webhook.ts
```

### Vérifier les APIs

```bash
# Vérifier la santé du système
curl https://votre-app.vercel.app/api/health

# Vérifier le mode MQTT
curl https://votre-app.vercel.app/api/mqtt/status
```

## 📊 Monitoring et Debug

### Logs Vercel

1. **Vercel Dashboard** → Votre projet → **Functions**
2. Cliquez sur `/api/mqtt/webhook` pour voir les logs
3. Surveillez les erreurs et les succès

### Debug Webhook

Si les données n'arrivent pas :

1. **Vérifiez EMQX Cloud** :
   - Webhook Status : `Enabled` ✅
   - Delivery Status : `Success` 
   - Failed Deliveries : `0`

2. **Vérifiez Vercel** :
   - Logs de la fonction webhook
   - Variables d'environnement configurées
   - URL webhook correcte

3. **Testez manuellement** :
   ```bash
   curl -X POST https://votre-app.vercel.app/api/mqtt/webhook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer votre-secret" \
     -d '{
       "clientid": "test-client",
       "topic": "sensors/cmclx6pwv0000l504c62ac086/data",
       "payload": "{\"ts\":1751528700,\"PM1\":10,\"PM25\":14,\"PM10\":14,\"O3\":20,\"O3c\":0,\"NO2v\":0.04,\"NO2\":2,\"VOCv\":0.17,\"COv\":0.35,\"CO\":0}",
       "qos": 1,
       "retain": false,
       "timestamp": 1751528700000
     }'
   ```

## 🔒 Sécurité

### Webhook Secret

- **OBLIGATOIRE** : Utilisez un secret fort et unique
- **Longueur** : Minimum 32 caractères
- **Contenu** : Lettres, chiffres, symboles mélangés

Générer un secret :
```bash
openssl rand -base64 32
```

### Validation des Données

Le webhook valide automatiquement :
- ✅ Format du topic (`sensors/{id}/data`)
- ✅ Existence du capteur dans la DB
- ✅ Format des données JSON
- ✅ Types et valeurs des champs

## 🔄 Migration depuis MQTT Listener

### Environnements Détectés

Le système détecte automatiquement l'environnement :

- **Local** (`VERCEL != '1'`) : MQTT listener persistant
- **Vercel** (`VERCEL = '1'`) : Webhook HTTP

### APIs Adaptatives

Les APIs s'adaptent automatiquement :
- `/api/health` : Indique le mode utilisé
- `/api/mqtt/status` : Retourne les infos appropriées

## ✅ Checklist de Validation

### Pré-déploiement
- [ ] `MQTT_WEBHOOK_SECRET` configuré sur Vercel
- [ ] Build local réussi (`pnpm build`)
- [ ] Tests webhook local passent

### Post-déploiement
- [ ] `curl /api/health` retourne `healthy`
- [ ] `curl /api/mqtt/status` indique `webhook`
- [ ] Webhook EMQX configuré et activé
- [ ] Test webhook production réussi
- [ ] Données capteur visibles sur dashboard

## 🆘 Dépannage

### Webhook ne reçoit rien

1. **Vérifiez EMQX** :
   - Topic filter exact : `sensors/+/data`
   - Webhook URL correcte
   - Headers avec `Authorization` correct

2. **Vérifiez Vercel** :
   - Function logs montrent-ils les appels ?
   - Variables d'environnement présentes ?

### Erreur 401 Unauthorized

- Secret webhook incorrect dans headers EMQX
- Variable `MQTT_WEBHOOK_SECRET` manquante sur Vercel

### Erreur 404 Unknown sensor

- Capteur n'existe pas dans la base de données
- ID capteur incorrect dans le topic

### Données partielles

- Format payload incorrect
- Transformation des données échoue
- Validation des types échoue

## 📞 Support

En cas de problème :
1. Consultez les logs Vercel
2. Vérifiez la configuration EMQX
3. Testez avec le script de test
4. Validez les variables d'environnement 