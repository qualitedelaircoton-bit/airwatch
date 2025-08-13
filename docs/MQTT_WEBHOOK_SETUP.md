# Configuration MQTT Webhook pour Production

## Problème Résolu

Firebase Hosting ne supporte pas les connexions persistantes MQTT côté frontend. Utilisez des webhooks HTTP ou Cloud Functions pour recevoir les données MQTT en production.

## 📋 Architecture

```
Capteur → EMQX Cloud → Webhook HTTP → Cloud Function Firebase → Base de données
```

- **Développement local** : MQTT listener persistant (comme avant)
- **Production Firebase** : Webhook HTTP via une Cloud Function

## 🚀 Étapes de Configuration

1. Configurez une Cloud Function HTTP sur Firebase pour recevoir les webhooks EMQX.
2. Ajoutez la variable d'environnement `MQTT_WEBHOOK_SECRET` dans les paramètres Firebase Functions.
3. Configurez EMQX pour pointer vers l'URL de la Cloud Function Firebase.

Voir `docs/FIREBASE_SETUP.md` pour la configuration détaillée.

## 🔄 Migration

Si vous migrez depuis une autre plateforme, adaptez vos endpoints webhook et la logique d'environnement (`process.env.FIREBASE_CONFIG`).

## 🧪 Tests

### Test Local du Webhook

```bash
# Tester le webhook en local
pnpm tsx scripts/test-webhook.ts
```

### Test Production

```bash
# Avec votre URL Firebase Hosting
FIREBASE_URL=votre-app.firebaseapp.com pnpm tsx scripts/test-webhook.ts
```

### Vérifier les APIs

```bash
# Vérifier la santé du système
curl https://votre-app.firebaseapp.com/api/health

# Vérifier le mode MQTT
curl https://votre-app.firebaseapp.com/api/mqtt/status
```

## 📊 Monitoring et Debug

### Logs Firebase Functions

1. **Votre projet** → **Functions**
2. Cliquez sur `/api/mqtt/webhook` pour voir les logs
3. Surveillez les erreurs et les succès

### Debug Webhook

Si les données n'arrivent pas :

1. **Vérifiez EMQX Cloud** :
   - Webhook Status : `Enabled` ✅
   - Delivery Status : `Success` 
   - Failed Deliveries : `0`

2. **Vérifiez Firebase** :
   - Logs de la Cloud Function
   - Variables d'environnement configurées

3. **Testez manuellement** :
   ```bash
   curl -X POST https://votre-app.firebaseapp.com/api/mqtt/webhook \
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

- **Local** (`FIREBASE_CONFIG` absent) : MQTT listener persistant
- **Firebase Hosting** (`FIREBASE_CONFIG` présent) : Webhook HTTP

### APIs Adaptatives

Les APIs s'adaptent automatiquement :
- `/api/health` : Indique le mode utilisé
- `/api/mqtt/status` : Retourne les infos appropriées

## ✅ Checklist de Validation

### Pré-déploiement
- [ ] `MQTT_WEBHOOK_SECRET` configuré sur Firebase
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

2. **Vérifiez Firebase** :
   - Function logs montrent-ils les appels ?
   - Variables d'environnement présentes ?

### Erreur 401 Unauthorized

- Secret webhook incorrect dans headers EMQX
- Variable `MQTT_WEBHOOK_SECRET` manquante sur Firebase

### Erreur 404 Unknown sensor

- Capteur n'existe pas dans la base de données
- ID capteur incorrect dans le topic

### Données partielles

- Format payload incorrect
- Transformation des données échoue
- Validation des types échoue

## 📞 Support

En cas de problème :
1. Consultez les logs Firebase
2. Vérifiez la configuration EMQX
3. Testez avec le script de test
4. Validez les variables d'environnement 