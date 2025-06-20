# 🔧 Guide de Dépannage AirWatch Bénin

## 🚨 Problèmes Courants

### 1. ❌ Erreur Base de Données (500 Internal Server Error)

**Symptôme** :
```
Error [PrismaClientInitializationError]: 
Can't reach database server at ep-xxx.neon.tech:5432
```

**Diagnostic** :
```bash
# Vérifier la présence du fichier .env
ls -la .env

# Tester la connexion Prisma
pnpm prisma db push
```

**Solutions** :

#### Option A : Fichier .env manquant
```bash
# Créer le fichier .env avec votre DATABASE_URL
echo 'DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech:5432/db?sslmode=require"' > .env

# Appliquer le schema
pnpm prisma db push

# Redémarrer le serveur
pnpm dev
```

#### Option B : URL invalide
```bash
# Format correct Neon DB
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.neon.tech:5432/database?sslmode=require"

# OBLIGATOIRE : ?sslmode=require à la fin
```

#### Option C : Base de données en pause (Neon)
1. Aller sur [console.neon.tech](https://console.neon.tech)
2. Sélectionner votre projet
3. Cliquer "Wake up" si en pause
4. Redémarrer : `pnpm dev`

### 2. 🔍 Champ de Recherche Trop Petit

**Avant** : `max-w-md` (384px max)
**Après** : `w-full sm:max-w-lg` (512px max sur desktop, pleine largeur mobile)

**Vérification** :
```bash
# Le fix est appliqué dans app/page.tsx ligne ~198
grep -n "sm:max-w-lg" app/page.tsx
```

### 3. 🌙 Mode Sombre Cassé

**Symptômes** :
- Fond blanc avec texte blanc
- Éléments illisibles
- Couleurs incohérentes

**Solution** : Les overrides CSS sont appliqués dans `app/globals.css`
```css
/* Classes d'override automatiques */
.dark [class*="bg-white"] {
  background-color: var(--color-card) !important;
}
```

### 4. 🎨 Styles Tailwind Non Appliqués

**Diagnostic** :
```bash
# Vérifier la compilation CSS
pnpm build

# Vérifier le cache
rm -rf .next
pnpm dev
```

## 🔄 Solutions Rapides

### Reset Complet Base de Données
```bash
# ⚠️ ATTENTION : Supprime toutes les données
pnpm prisma db push --force-reset
pnpm prisma db seed
```

### Régénérer Prisma Client
```bash
pnpm prisma generate
pnpm dev
```

### Clear Cache Next.js
```bash
rm -rf .next
rm -rf node_modules/.cache
pnpm dev
```

## 📋 Checklist de Validation

### ✅ Configuration Minimale
- [ ] Fichier `.env` existe
- [ ] `DATABASE_URL` contient une URL Neon valide
- [ ] URL termine par `?sslmode=require`
- [ ] `pnpm prisma db push` réussit

### ✅ Interface Fonctionnelle
- [ ] Champ de recherche pleine largeur mobile
- [ ] Mode sombre sans fond blanc
- [ ] Compteurs statut affichent 0
- [ ] Message "Aucun capteur enregistré"

### ✅ API Endpoints
```bash
# Tester l'API sensors
curl http://localhost:3000/api/sensors

# Doit retourner [] (array vide) au lieu d'erreur 500
```

## 🆘 En Cas d'Urgence

### Restauration Rapide
```bash
# 1. Stopper le serveur (Ctrl+C)
# 2. Reset complet
rm -rf .next node_modules/.cache
pnpm install
pnpm prisma db push --force-reset

# 3. Seeding avec données d'exemple
pnpm prisma db seed

# 4. Redémarrer
pnpm dev
```

### Configuration .env Type
```bash
# Copier/coller dans .env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.region.neon.tech:5432/neondb?sslmode=require"
MQTT_BROKER_URL="optional-for-dev"
MQTT_USERNAME="optional-for-dev"
MQTT_PASSWORD="optional-for-dev"
```

## 🛠️ Outils de Debug

### Prisma Studio
```bash
# Interface graphique base de données
pnpm prisma studio
# Ouvre http://localhost:5555
```

### Logs Détaillés
```bash
# Mode debug Prisma
DEBUG="prisma:*" pnpm dev

# Logs Next.js détaillés
NEXT_PUBLIC_DEBUG=true pnpm dev
```

### Tests API
```bash
# Sanity check
curl http://localhost:3000/api/health

# Test sensors vide
curl http://localhost:3000/api/sensors
# Doit retourner: []
```

## 📞 Support Escalation

### Niveaux d'Assistance

#### Niveau 1 : Auto-dépannage
- Suivre ce guide
- Vérifier la documentation
- Chercher dans les Issues GitHub

#### Niveau 2 : Community Support
- Créer une Issue GitHub
- Stack Overflow avec tag `airwatch-benin`
- Discord/Forum community

#### Niveau 3 : Expert Support
- Contact direct développeurs
- Session debug partagée
- Consultation technique

### Informations à Fournir

**Toujours inclure** :
```bash
# Version Node
node --version

# Version packages
cat package.json | grep -E '"(next|prisma|tailwindcss)"'

# OS et Shell
uname -a
echo $SHELL

# Logs d'erreur complets
# (copier/coller la stack trace)
```

---

**Dernière MAJ** : Janvier 2025
**Validé pour** : Next.js 15.3.3, Prisma 6.9.0
**Support** : Windows 10/11, macOS, Linux 