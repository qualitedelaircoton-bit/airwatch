# 🌍 AirWatch Bénin

**Plateforme de surveillance en temps réel de la qualité de l'air au Bénin**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.8-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

## 📋 Description

AirWatch Bénin est une plateforme moderne de surveillance de la qualité de l'air qui permet de monitorer en temps réel les niveaux de pollution atmosphérique sur le territoire béninois. Le système collecte, analyse et visualise les données de capteurs IoT pour fournir des informations cruciales sur la qualité de l'air aux citoyens, aux autorités et aux chercheurs.

**URL de production** : https://www.airquality.africa

## ✨ Fonctionnalités

### 🔄 Surveillance en Temps Réel
- **Monitoring continu** des particules PM1.0, PM2.5, PM10
- **Mesure des gaz** : O3 (Ozone), NO2 (Dioxyde d'azote), CO (Monoxyde de carbone)
- **Calcul automatique** de l'Index de Qualité de l'Air (AQI)
- **Mise à jour** des données toutes les minutes

### 📊 Visualisation des Données
- **Tableaux de bord interactifs** avec graphiques en temps réel
- **Cartes géographiques** montrant la distribution des capteurs
- **Historiques détaillés** avec filtrage par période
- **Alertes visuelles** pour les niveaux critiques

### 🚨 Système d'Alertes
- **Notifications automatiques** en cas de dépassement de seuils
- **Alertes par email** pour les administrateurs
- **Classifications par sévérité** : INFO, WARNING, CRITICAL
- **Historique des alertes** avec résolution tracking

### 🎛️ Gestion des Capteurs
- **Interface d'administration** pour ajouter/modifier les capteurs
- **Monitoring du statut** des capteurs (actif/inactif)
- **Géolocalisation précise** avec coordonnées GPS
- **Métadonnées personnalisables** par capteur

## 🛠️ Technologies Utilisées

### Frontend
- **[Next.js 15.3.3](https://nextjs.org/)** - Framework React avec App Router
- **[React 19](https://react.dev/)** - Bibliothèque UI avec Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Typage strict avec `exactOptionalPropertyTypes`
- **[Tailwind CSS 4.1.8](https://tailwindcss.com/)** - Framework CSS avec approche CSS-first
- **[Radix UI](https://www.radix-ui.com/)** - Composants accessibles et personnalisables
- **[Recharts](https://recharts.org/)** - Graphiques et visualisations

### Backend
- **[Firebase](https://firebase.google.com/)** - Authentification et base de données en temps réel
- **[Firestore](https://firebase.google.com/docs/firestore)** - Base de données NoSQL
- **[Cloud Functions](https://firebase.google.com/docs/functions)** - Fonctions serverless
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - API REST intégrée

### Outils de Développement
- **[pnpm](https://pnpm.io/)** - Gestionnaire de packages performant
- **[ESLint](https://eslint.org/)** - Linting et qualité de code
- **[Prettier](https://prettier.io/)** - Formatage automatique
- **[TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)** - Vérifications de type strictes

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** 18.17+ ou 20.3+
- **pnpm** 8.0+ (gestionnaire de packages)
- **Compte Firebase** (base de données cloud)
- **Git**

### 1. Clonage du Repository
```bash
git clone https://github.com/votre-username/air-quality-platform.git
cd air-quality-platform
```

### 2. Installation des Dépendances
```bash
pnpm install
```

### 3. Configuration de l'Environnement
Créez un fichier `.env.local` à la racine du projet :

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="votre_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="votre-projet.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="votre-projet"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="votre-projet.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="votre_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="votre_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXX"

# Configuration MQTT (optionnel)
NEXT_PUBLIC_MQTT_BROKER_URL="broker.hivemq.com"
NEXT_PUBLIC_MQTT_TOPIC="airquality/benin"

# Configuration de l'application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_nextauth"
```

### 4. Configuration de Firebase
1. Créez un projet sur la [console Firebase](https://console.firebase.google.com/)
2. Activez l'authentification par email/mot de passe
3. Créez une application web et récupérez les identifiants
4. Activez Firestore en mode test ou production
5. Configurez les règles de sécurité Firestore selon `firestore.rules`
6. Déployez les Cloud Functions si nécessaire :
   ```bash
   cd functions
   pnpm install
   firebase deploy --only functions
   ```

### 5. Lancement du Développement
```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
air-quality-platform/
├── app/                          # App Router Next.js 15
│   ├── api/                      # API Routes
│   │   ├── access-requests/     # Gestion des demandes d'accès
│   │   ├── health/              # Health check endpoint
│   │   └── sensors/             # API capteurs
│   ├── auth/                    # Pages d'authentification
│   ├── dashboard/               # Tableau de bord principal
│   ├── admin/                   # Section administration
│   ├── globals.css              # Styles globaux Tailwind CSS
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Page d'accueil
├── components/                  # Composants React
│   ├── ui/                      # Composants UI (shadcn/ui)
│   ├── admin/                   # Composants admin
│   ├── auth/                    # Composants d'authentification
│   └── ...                      # Autres composants
├── contexts/                    # Contextes React
│   └── auth-context.tsx         # Contexte d'authentification
├── lib/                         # Utilitaires et configuration
│   ├── firebase.ts             # Configuration Firebase
│   └── date-utils.ts           # Utilitaires de date
├── public/                      # Assets statiques
│   └── icons/                   # Icônes et images
├── functions/                   # Cloud Functions (Firebase)
│   ├── src/                    # Code source des fonctions
│   └── package.json            # Dépendances des fonctions
├── .firebaserc                 # Configuration Firebase
├── firebase.json              # Configuration du déploiement
├── firestore.rules            # Règles de sécurité Firestore
├── next.config.mjs            # Configuration Next.js
└── package.json               # Dépendances du projet
```

## 🎨 Composants UI

Le projet utilise une bibliothèque de composants personnalisée basée sur **Radix UI** et **Tailwind CSS 4** :

- **Formulaires** : Input, Textarea, Select, Checkbox, Switch
- **Navigation** : Sidebar, Breadcrumb, Pagination
- **Visualisation** : Charts, Cards, Progress, Badge
- **Feedback** : Toast, Alert, Dialog, Drawer
- **Layout** : Container, Grid, Stack, Separator

Tous les composants sont **accessibles**, **personnalisables** et **compatibles** avec le dark mode.

## 🔒 Authentification

L'application utilise Firebase Authentication avec les fonctionnalités suivantes :
- Inscription avec email/mot de passe
- Vérification d'email obligatoire
- Gestion des sessions avec JWT
- Rôles utilisateurs (admin, utilisateur, en attente)
- Mot de passe oublié

## 🔄 Déploiement

### Prérequis
- Compte [Vercel](https://vercel.com/)
- Compte [Firebase](https://firebase.google.com/)
- Domaine personnalisé configuré (optionnel)

### Étapes de déploiement

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-username/air-quality-platform.git
   cd air-quality-platform
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env.local` avec les variables nécessaires (voir section Configuration)

4. **Déployer sur Vercel**
   - Connectez votre compte GitHub à Vercel
   - Importez le dépôt
   - Configurez les variables d'environnement dans les paramètres du projet Vercel
   - Déclenchez un déploiement

5. **Configurer le domaine personnalisé** (optionnel)
   - Allez dans les paramètres du projet Vercel
   - Ajoutez votre domaine personnalisé
   - Suivez les instructions pour configurer les enregistrements DNS

## 🚦 Points d'API

### Capteurs
- `GET /api/sensors` - Liste tous les capteurs
- `GET /api/sensors/[id]` - Détails d'un capteur
- `POST /api/sensors` - Créer un nouveau capteur (admin)
- `DELETE /api/sensors/[id]` - Supprimer un capteur (admin)
- `POST /api/sensors/batch-delete` - Supprimer plusieurs capteurs (admin)

### Authentification
- `POST /api/auth/register` - S'inscrire
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/logout` - Se déconnecter
- `POST /api/auth/forgot-password` - Réinitialiser le mot de passe

### Demandes d'accès
- `GET /api/access-requests` - Lister les demandes (admin)
- `POST /api/access-requests` - Créer une demande
- `PATCH /api/access-requests/[id]` - Mettre à jour une demande (admin)

### Système
- `GET /api/health` - Health check de l'API

## 🔍 Développement

### Scripts disponibles

```bash
# Démarrer l'environnement de développement
pnpm dev

# Lancer les tests
pnpm test

# Construire pour la production
pnpm build

# Démarrer en mode production
pnpm start

# Linter le code
pnpm lint

# Formater le code
pnpm format
```

### Contributions

1. Créez une branche pour votre fonctionnalité : `git checkout -b feature/ma-nouvelle-fonctionnalite`
2. Committez vos changements : `git commit -am 'Ajouter une nouvelle fonctionnalité'`
3. Poussez vers la branche : `git push origin feature/ma-nouvelle-fonctionnalite`
4. Créez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Le framework React pour le web
- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire
- [shadcn/ui](https://ui.shadcn.com/) - Composants UI accessibles

```json
{
  "ts": 1672531200,
  "PM1": 10.1,
  "PM25": 25.2,
  "PM10": 50.3,
  "O3": 0.45,
  "O3c": 0.42,
  "NO2v": 1.23,
  "NO2": 55.6,
  "VOCv": 0.88,
  "COv": 2.15,
  "CO": 150.7
}
```

## 📈 Performance

### Optimisations Appliquées
- **Server Side Rendering** avec Next.js 15
- **Streaming** des composants React 19
- **Code splitting** automatique
- **Image optimization** Next.js
- **CSS-first approach** Tailwind CSS 4
- **Bundle analysis** avec `@next/bundle-analyzer`

### Métriques Cibles
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 3s

## 📁 Modèle de Données

### Capteurs (`Sensor`)
```prisma
model Sensor {
  id          String   @id @default(uuid())
  name        String
  location    String
  latitude    Float
  longitude   Float
  status      SensorStatus
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  lastSeen    DateTime?
  data        SensorData[]
  alerts      Alert[]
}
```

### Données Capteur (`SensorData`)
```prisma
model SensorData {
  id           String   @id @default(uuid())
  sensorId     String
  timestamp    DateTime @default(now())
  pm1_0        Float    // Particules PM1.0
  pm2_5        Float    // Particules PM2.5
  pm10         Float    // Particules PM10
  o3_corrige   Float    // Ozone corrigé
  no2_ppb      Float    // NO2 en ppb
  co_ppb       Float    // CO en ppb
  aqi          Int?     // Air Quality Index
  aqiCategory  AQICategory?
  sensor       Sensor   @relation(fields: [sensorId], references: [id])
}
```

### Alertes (`Alert`)
```prisma
model Alert {
  id          String      @id @default(uuid())
  sensorId    String
  type        AlertType
  severity    AlertSeverity
  message     String
  threshold   Float?
  actualValue Float?
  isResolved  Boolean     @default(false)
  createdAt   DateTime    @default(now())
  resolvedAt  DateTime?
  sensor      Sensor      @relation(fields: [sensorId], references: [id])
}
```

## 🔧 Scripts Disponibles

```bash
# Développement
pnpm dev                # Serveur de développement
pnpm build              # Build de production
pnpm start              # Serveur de production
pnpm lint               # Vérification ESLint
pnpm type-check         # Vérification TypeScript

# Base de données
pnpm db:migrate         # Appliquer les migrations
pnpm db:seed            # Insérer des données de test
pnpm db:studio          # Interface Prisma Studio
pnpm db:reset           # Reset complet de la DB

# Maintenance
pnpm db:clean           # Nettoyer les anciennes données
pnpm db:stats           # Statistiques de la DB
pnpm db:check           # Vérifier l'intégrité des données
```

## 🌐 API Endpoints

### Capteurs
- `GET /api/sensors` - Liste des capteurs
- `GET /api/sensors/[id]` - Détails d'un capteur
- `POST /api/sensors` - Créer un capteur
- `PUT /api/sensors/[id]` - Modifier un capteur
- `DELETE /api/sensors/[id]` - Supprimer un capteur

### Données
- `GET /api/sensors/[id]/data` - Données d'un capteur
- `POST /api/sensors/[id]/data` - Ajouter des données
- `GET /api/data/latest` - Dernières données tous capteurs
- `GET /api/data/statistics` - Statistiques globales

### Alertes
- `GET /api/alerts` - Liste des alertes
- `POST /api/alerts` - Créer une alerte
- `PUT /api/alerts/[id]/resolve` - Résoudre une alerte

### Système
- `GET /api/health` - Health check de l'API

  "PM10": 50.3,
  "O3": 0.45,
  "O3c": 0.42,
  "NO2v": 1.23,
  "NO2": 55.6,
  "VOCv": 0.88,
  "COv": 2.15,
  "CO": 150.7
}
```

| Champ  | Type   | Unité          | Description                                  |
| :----- | :----- | :------------- | :------------------------------------------- |
| `ts`   | Number | Unix Timestamp | Timestamp de la mesure (secondes ou ms)      |
| `PM1`  | Number | µg/m³          | Particules fines PM1.0                       |
| `PM25` | Number | µg/m³          | Particules fines PM2.5                       |
| `PM10` | Number | µg/m³          | Particules fines PM10                        |
| `O3`   | Number | Volts          | Tension brute du capteur O3                  |
| `O3c`  | Number | ppb            | Concentration O3 corrigée                    |
| `NO2v` | Number | Volts          | Tension brute du capteur NO2                 |
| `NO2`  | Number | ppb            | Concentration NO2                            |
| `VOCv` | Number | Volts          | Tension brute du capteur VOC                 |
| `COv`  | Number | Volts          | Tension brute du capteur CO                  |
| `CO`   | Number | ppb            | Concentration CO                             |

## 🔐 Sécurité

- **Validation des données** avec Zod schemas
- **Authentification** NextAuth.js (configurée pour extension)
- **Autorisation** basée sur les rôles
- **Protection CSRF** intégrée Next.js
- **Variables d'environnement** sécurisées
- **Validation côté serveur** pour toutes les entrées

## 🧪 Tests

```bash
# Tests unitaires (à configurer)
pnpm test

# Tests d'intégration (à configurer)
pnpm test:integration

# Tests E2E avec Playwright (à configurer)
pnpm test:e2e
```

## 📈 Performance

### Optimisations Appliquées
- **Server Side Rendering** avec Next.js 15
- **Streaming** des composants React 19
- **Code splitting** automatique
- **Image optimization** Next.js
- **CSS-first approach** Tailwind CSS 4
- **Bundle analysis** avec `@next/bundle-analyzer`

### Métriques Cibles
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 3s

## 🌍 Déploiement

### Variables d'Environnement Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
MQTT_BROKER_URL="mqtts://..."
NEXTAUTH_URL="https://airwatch.benin.gov.bj"
```

### Déploiement sur Firebase Hosting

1. Installez l'outil CLI Firebase :
   ```bash
   pnpm add -g firebase-tools
   ```
2. Connectez-vous à Firebase :
   ```bash
   firebase login
   ```
3. Initialisez Firebase Hosting (si ce n'est pas déjà fait) :
   ```bash
   firebase init hosting
   ```
4. Configurez le dossier de build Next.js comme dossier public (`.next` ou `out` selon votre config).
5. Déployez :
   ```bash
   pnpm build
   firebase deploy --only hosting
   ```

Pour plus de détails, voir `docs/FIREBASE_SETUP.md`.

### Autres Plateformes Supportées
- **Netlify** avec adaptateur Next.js
- **Railway** avec configuration automatique
- **DigitalOcean App Platform**
- **AWS Amplify** avec SSR

## 🤝 Contribution

### Guide de Contribution
1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Standards de Code
- **TypeScript strict** obligatoire
- **ESLint** et **Prettier** configurés
- **Tests** requis pour les nouvelles fonctionnalités
- **Documentation** des APIs publiques
- **Commits conventionnels** recommandés

### Règles de Collaboration IA
Voir le fichier [`ai-rules.md`](./ai-rules.md) pour les règles spécifiques de collaboration avec l'IA.

## 📝 License

Ce projet est sous license **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Product Owner** : [Nom]
- **Tech Lead** : [Nom]
- **Developer** : [Nom]
- **UI/UX Designer** : [Nom]

## 📞 Contact et Support

- **Email** : support@airwatch.benin.gov.bj
- **Documentation** : [https://docs.airwatch.benin.gov.bj](https://docs.airwatch.benin.gov.bj)
- **Issues** : [GitHub Issues](https://github.com/votre-username/air-quality-platform/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/air-quality-platform/discussions)

---

<div align="center">

**🌱 Pour un air plus pur au Bénin**

Fait avec ❤️ par l'équipe AirWatch Bénin

</div> 