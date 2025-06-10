# 🔧 Guide de Maintenance - AirWatch Bénin

Ce guide détaille les procédures de maintenance et les bonnes pratiques pour maintenir la plateforme AirWatch Bénin.

## 📋 Tâches de Maintenance Régulières

### 🔄 Hebdomadaire

#### Monitoring de Performance
```bash
# Vérifier les métriques de build
pnpm build

# Analyser la taille des bundles
pnpm analyze

# Vérifier les erreurs TypeScript
pnpm type-check
```

#### Tests de Responsive
- [ ] Mobile portrait/paysage
- [ ] Tablette portrait/paysage
- [ ] Desktop (1280px+, 1920px+)
- [ ] Colonne description (visible lg+)
- [ ] Modal mobile (fonctionnel <lg)

### 📅 Mensuelle

#### Contenu de la Description
- [ ] Révision du texte grand public
- [ ] Vérification des emojis d'illustration
- [ ] Mise à jour des statistiques
- [ ] Test des liens externes

#### Performance Audit
```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:3000 --output html

# Bundle analyzer
pnpm build:analyze
```

### 🚀 Trimestrielle

#### Mise à jour des Dépendances
```bash
# Vérifier les versions
pnpm outdated

# Mise à jour sécurisée
pnpm update

# Tests complets après update
pnpm test:all
```

#### Accessibilité
- [ ] Audit WCAG 2.1
- [ ] Test navigateur avec lecteur d'écran
- [ ] Vérification du contraste des couleurs
- [ ] Navigation clavier complète

## 🛠️ Procédures de Débogage

### Problèmes de Colonne Description

#### Colonne ne s'affiche pas sur tablette
```typescript
// Vérifier le breakpoint
className="hidden lg:flex" // ✅ lg = 1024px+
className="hidden xl:flex" // ❌ xl = 1280px+ (trop restrictif)
```

#### Z-index conflicts
```css
/* Hiérarchie correcte */
.modal { z-index: 9999; }      /* Modal priorité absolue */
.header { z-index: 40; }       /* Header sticky */
.description { z-index: 30; }  /* Colonne fixe */
```

#### Modal ne s'ouvre pas sur mobile
```typescript
// Vérifier le trigger invisible
<button data-about-trigger className="hidden" />

// Vérifier l'événement click
const aboutButton = document.querySelector('[data-about-trigger]');
if (aboutButton) aboutButton.click();
```

### Problèmes de Responsive

#### Icônes non cachées sur mobile
```typescript
// Pattern correct pour masquer sur mobile
className="w-4 h-4 mr-2 hidden sm:block"
```

#### Layout cassé sur tablette
```typescript
// Vérifier les breakpoints
className="flex flex-col lg:flex-row" // Responsive direction
className="lg:mr-[400px]"             // Marge pour colonne
```

## 🎨 Maintenance du Design System

### Couleurs et Thèmes

#### Variables CSS à surveiller
```css
/* Variables critiques */
--color-primary: #007BFF;
--color-background: #FFFFFF;
--color-border: #dee2e6;

/* Mode sombre */
.dark {
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
}
```

#### Glassmorphism Effects
```css
.glass-effect {
  backdrop-filter: blur(12px) saturate(180%);
  background: color-mix(in srgb, var(--color-background) 80%, transparent);
}
```

### Scrollbar Personnalisée
```css
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-air-purple) 100%);
}
```

## 📱 Tests Mobile

### Devices Cibles
- **iPhone SE** : 375x667px
- **iPhone 12** : 390x844px
- **iPad** : 768x1024px
- **iPad Pro** : 1024x1366px
- **Android** : 360x640px (standard)

### Checklist Mobile
- [ ] Titre cliquable fonctionnel
- [ ] Modal slide smooth
- [ ] Overlay fermeture
- [ ] Pas d'icônes inutiles
- [ ] Buttons bien alignés
- [ ] Scrolling fluide

## 🔍 Debugging Tools

### Chrome DevTools
```javascript
// Debug responsive
window.innerWidth // Largeur actuelle
window.innerHeight // Hauteur actuelle

// Test breakpoints Tailwind
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px

// Debug modal state
document.querySelector('[data-about-trigger]')
```

### Console Utilities
```javascript
// Vérifier l'état du modal
const modal = document.querySelector('[data-about-trigger]');
console.log('Modal trigger:', modal);

// Tester la colonne description
const column = document.querySelector('.lg\\:flex');
console.log('Column visible:', getComputedStyle(column).display);
```

## 📊 Performance Monitoring

### Métriques Clés
```bash
# Build size
Route (app)                Size    First Load JS    
├ ○ /                    28.2 kB       185 kB       # ✅ <30kB
├ ƒ /sensors/[id]         112 kB       269 kB       # ✅ <300kB
```

### Alertes Performance
- **Page principale** : >30kB (⚠️ investigation)
- **Time to Interactive** : >3s (⚠️ optimisation)
- **Cumulative Layout Shift** : >0.1 (⚠️ layout)

## 🚨 Procédures d'Urgence

### Build Failure
```bash
# 1. Vérifier les erreurs TypeScript
pnpm type-check

# 2. Nettoyer le cache
rm -rf .next
pnpm install

# 3. Build de debug
pnpm build --debug
```

### Modal Cassé
```typescript
// Reset state modal
const [isModalOpen, setIsModalOpen] = useState(false);

// Force close
useEffect(() => {
  setIsModalOpen(false);
}, []);
```

### Responsive Broken
```css
/* Reset responsive */
.lg\:mr-\[400px\] {
  margin-right: 0 !important;
}

@media (min-width: 1024px) {
  .lg\:mr-\[400px\] {
    margin-right: 400px !important;
  }
}
```

## 📋 Checklist de Déploiement

### Pré-déploiement
- [ ] `pnpm build` réussi
- [ ] Tests responsives OK
- [ ] Modal mobile fonctionnel
- [ ] Colonne desktop visible
- [ ] Performance acceptable
- [ ] Accessibilité validée

### Post-déploiement
- [ ] Vérifier en production
- [ ] Tester sur devices réels
- [ ] Monitoring erreurs
- [ ] Feedback utilisateurs

## 📞 Contacts d'Urgence

### Stack Overflow
- **Next.js** : [nextjs tag](https://stackoverflow.com/questions/tagged/next.js)
- **Tailwind** : [tailwindcss tag](https://stackoverflow.com/questions/tagged/tailwindcss)
- **React** : [reactjs tag](https://stackoverflow.com/questions/tagged/reactjs)

### Documentation Officielle
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)

---

**📅 Dernière révision :** 20 Janvier 2025  
**👤 Responsable :** Équipe DevOps  
**🔄 Fréquence de mise à jour :** Mensuelle 