# Configuration de la Base de Données avec Prisma

## Pourquoi Prisma ?

✅ **Type-safe** : Génération automatique des types TypeScript  
✅ **Migrations** : Gestion des changements de schéma  
✅ **Relations** : Gestion automatique des clés étrangères  
✅ **Performance** : Requêtes optimisées et connection pooling  
✅ **DevEx** : Prisma Studio pour explorer les données  

## Configuration Rapide

### 1. Variables d'environnement
\`\`\`bash
# Copiez et éditez
cp .env.local.example .env.local

# Ajoutez votre URL Neon
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/air_quality_db?sslmode=require"
\`\`\`

### 2. Installation complète
\`\`\`bash
npm run setup
\`\`\`

Cette commande exécute :
- `prisma generate` : Génère le client TypeScript
- `prisma db push` : Synchronise le schéma avec Neon
- `prisma db seed` : Ajoute des données de test réalistes
- Test de connexion et vérifications

## Scripts Disponibles

### 🔧 **Gestion de base**
\`\`\`bash
npm run db:generate    # Génère le client Prisma
npm run db:push        # Pousse le schéma vers Neon
npm run db:studio      # Interface graphique
npm run db:migrate     # Crée une migration
\`\`\`

### 🌱 **Données**
\`\`\`bash
npm run db:seed        # Ajoute des données de test
npm run db:test        # Teste la connexion
npm run db:stats       # Statistiques détaillées
\`\`\`

### 🧹 **Maintenance**
\`\`\`bash
npm run db:clean       # Nettoie les anciennes données
npm run db:check       # Vérifie l'intégrité
npm run db:averages    # Calcule les moyennes
\`\`\`

## Données de Test

Le seed crée automatiquement :
- **5 capteurs** dans différentes villes du Bénin
- **Données réalistes** pour les dernières 24h
- **Variations temporelles** (pics matin/soir)
- **Valeurs cohérentes** selon la localisation

### Capteurs créés :
- Cotonou - Place de l'Étoile Rouge
- Cotonou - Marché Dantokpa (plus pollué)
- Porto-Novo - Centre-ville
- Calavi - Université d'Abomey-Calavi
- Parakou - Centre administratif (moins pollué)

## Avantages de cette approche

### 🎯 **Type Safety**
\`\`\`typescript
// Auto-completion et vérification des types
const sensors = await prisma.sensor.findMany({
  include: {
    data: {
      where: {
        timestamp: { gte: yesterday }
      }
    }
  }
})
\`\`\`

### 🚀 **Performance**
- Connection pooling automatique avec Neon
- Requêtes optimisées
- Index automatiques sur les relations

### 🛠 **Maintenance**
- Migrations versionnées
- Rollback possible
- Schema drift detection

### 📊 **Monitoring**
- Logs des requêtes
- Métriques de performance
- Health checks intégrés
