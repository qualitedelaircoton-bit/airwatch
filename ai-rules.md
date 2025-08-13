# 🤖 Règles de Collaboration IA

## Principe Fondamental
**RECHERCHER AVANT D'AGIR**. Incertitude = recherche web obligatoire avec "2025".

## 🔍 Méthodologie de Recherche

### Règle d'Or
> "est ce que c'est pas mieux que si tu identifie un problème, tu la corrige partout avant de continuer?"

**Pattern** : Identifier → Rechercher → Corriger PARTOUT → Tester

### Quand Rechercher (OBLIGATOIRE)
- ❌ Incertitude technique
- ❌ Erreur inconnue  
- ❌ Nouvelle syntaxe/version
- ❌ Configuration complexe
- ❌ Best practices

### Format Recherche
- **Toujours inclure "2025"** dans les termes
- **Versions exactes** : "Next.js 15.3.3", "Tailwind CSS 4.1.8"
- **Sources** : Docs officielles > GitHub > Stack Overflow

## 🛠️ Stack & Gestionnaire

### Technologique
- **Next.js 15.3.3** + App Router
- **React 19** + Server Components  
- **TypeScript strict** + `exactOptionalPropertyTypes`
- **Tailwind CSS 4.1.8** (CSS-first)
- **Prisma ORM** + PostgreSQL
- **pnpm** (gestionnaire de packages)

### Déploiement
- **Firebase Hosting** (hébergement)
- **EMQX Cloud** (MQTT IoT)

## ⚡ Corrections Systématiques

### TypeScript Strict
```typescript
// API Routes Next.js 15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}

// Imports corrects
import { cva, type VariantProps } from "class-variance-authority";

// Props sécurisées
const isChecked = checked ?? false;
const theme = selectedTheme ?? "system";
```

### Patterns Communs
- **API Routes** : `params` → `Promise<{ id: string }>`
- **Pages** : `use()` de React pour params async
- **Environnement** : `process.env.VAR || ""`
- **Props optionnelles** : `value ?? defaultValue`

## 🚀 Configuration

### Variables d'Environnement
```env
# EMQX Cloud  
MQTT_BROKER_URL="z166d525.ala.us-east-1.emqxsl.com"
MQTT_PORT="8883"
MQTT_WS_PORT="8084"
MQTT_USERNAME="your_username"
MQTT_PASSWORD="your_password"
```

### Scripts pnpm
```bash
pnpm install        # Installation
pnpm dev           # Développement
pnpm build         # Build production
pnpm prisma:push   # Base de données
```

## 📋 Processus de Travail

### 1. Identification
- Scanner TOUS les problèmes similaires
- Grouper par type/pattern
- Prioriser par impact

### 2. Recherche
- **Obligatoire** pour chaque type de problème
- Vérifier compatibilité versions
- Documenter solutions trouvées

### 3. Correction Globale
- Appliquer à TOUS les fichiers concernés
- Batch corrections par type
- Éviter corrections one-by-one

### 4. Validation
- `pnpm build` après chaque batch
- Tests manuels fonctionnalités critiques
- Documentation des changements

## 🎯 Règles d'Exécution

### Interdictions
- ❌ Corriger un fichier puis tester
- ❌ Deviner sans rechercher
- ❌ Utiliser `any` ou désactiver types
- ❌ Références "2024" (sauf historique)
- ❌ Docker (projet Firebase Hosting only)

### Obligations
- ✅ Recherche web systématique
- ✅ Correction globale avant tests
- ✅ Documentation changements
- ✅ TypeScript strict respecté
- ✅ pnpm comme gestionnaire

## 📝 Documentation

### Quelque ressource
1. **MIGRATION_LOG.md** - Journal technique détaillé
2. **README.md** - Documentation projet (Firebase Hosting + EMQX)
3. **ai-rules.md** - Ce fichier

### Éléments Critiques README
- Installation avec pnpm
- Configuration Neon DB
- EMQX Cloud setup
- API endpoints
- Déploiement Firebase Hosting
- **Pas de Docker**

## 🔄 Validation Finale

### Checklist Obligatoire
- [ ] `pnpm build` successful
- [ ] Changements documentés
- [ ] Fonctionnalités testées  
- [ ] Recherches effectuées
- [ ] Patterns appliqués globalement

### Flexibilité Encadrée
- Adapter selon nouveautés 2025
- Questionner si recherche révèle mieux
- Proposer optimisations research-based
- Maintenir compatibilité stack

## 💡 Mémo Final

**Source de vérité** : Web search avec "2025"
**Philosophie** : Rechercher → Comprendre → Appliquer partout → Tester
**Gestionnaire** : pnpm obligatoire
**Déploiement** : Firebase Hosting + EMQX Cloud

En cas de doute : **RECHERCHER** 🔍 