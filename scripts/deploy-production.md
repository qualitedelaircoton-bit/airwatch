# 🚀 Déploiement en Production - AirWatch Bénin

## Solutions Mises en Place

### ✅ Problèmes Résolus

1. **Synchronisation Temps Réel**
   - ✅ Rafraîchissement automatique toutes les 30s (dashboard)
   - ✅ Rafraîchissement automatique toutes les 15s (données capteur)
   - ✅ Indicateur de dernière mise à jour visible
   - ✅ APIs de santé et MQTT pour monitoring

2. **Nouveau Capteur**
   - ✅ Capteur `cmc535h2i0000l704mwuntrhu` (zogbo-essai) fonctionne
   - ✅ Données reçues et affichées correctement
   - ✅ Statut automatiquement mis à jour (RED → GREEN)

### 🔧 APIs de Monitoring

1. **API de Santé** : `/api/health`
   - Vérifie et redémarre automatiquement le MQTT Listener
   - Retourne le statut complet du système

2. **API MQTT Status** : `/api/mqtt/status`
   - GET : Statut actuel
   - POST : Redémarrage manuel du MQTT Listener

## 📋 Instructions de Déploiement

### 1. Build et Test Local
```bash
pnpm build
pnpm tsx scripts/test-production-sync.ts
```

### 2. Déploiement Vercel
```bash
vercel --prod
```

### 3. Après Déploiement
```bash
# Vérifier l'API de santé (redémarre MQTT automatiquement)
curl https://your-app.vercel.app/api/health

# Vérifier le statut MQTT
curl https://your-app.vercel.app/api/mqtt/status

# Si nécessaire, redémarrer manuellement MQTT
curl -X POST https://your-app.vercel.app/api/mqtt/status
```

### 4. Test avec le Capteur
```bash
# Le capteur devrait envoyer automatiquement vers:
# Topic: sensors/cmc535h2i0000l704mwuntrhu/data
# Format: {"ts":275,"PM1":42,"PM25":63,"PM10":75,"O3":245,"O3c":215,"NO2v":0.01,"NO2":0,"VOCv":0.11,"COv":0.43,"CO":0}
```

## 🎯 Vérifications Post-Déploiement

### Checklist Obligatoire
- [ ] Dashboard s'ouvre sans erreur
- [ ] "Dernière mise à jour" s'affiche et se rafraîchit
- [ ] API `/api/health` retourne `healthy`
- [ ] API `/api/mqtt/status` retourne `connected: true`
- [ ] Capteur "zogbo-essai" apparaît dans la liste
- [ ] Envoi d'une donnée MQTT met à jour automatiquement l'interface (max 30s)

### Résolution des Problèmes

#### Si MQTT ne se connecte pas :
```bash
curl -X POST https://your-app.vercel.app/api/mqtt/status
```

#### Si les données n'arrivent pas :
1. Vérifier les variables d'environnement Vercel :
   - `MQTT_BROKER_HOST=34.38.83.146`
   - `DATABASE_URL=postgresql://...` (Neon DB)

2. Vérifier les logs Vercel

3. Tester la connectivité réseau

## 💡 Nouvelles Fonctionnalités

### Interface Utilisateur
- **Indicateur temps réel** : "Dernière mise à jour: XX:XX:XX"
- **Actualisation automatique** : Pas besoin de rafraîchir manuellement
- **Statut visuel** : Indication que l'actualisation fonctionne

### Backend
- **Auto-heal MQTT** : Redémarrage automatique en cas de déconnexion
- **APIs de monitoring** : Surveillance et contrôle à distance
- **Gestion des timestamps relatifs** : Support des formats d'appareils IoT

## 🔄 Cycle de Vie des Données

1. **Appareil IoT** → MQTT Topic `sensors/{ID}/data`
2. **MQTT Listener** → Réception et transformation
3. **Base Neon DB** → Stockage avec timestamp corrigé
4. **Interface Web** → Rafraîchissement automatique (30s)
5. **Utilisateur** → Voir les données sans intervention

---

**✅ Configuration validée et prête pour la production !** 