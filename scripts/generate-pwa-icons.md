# Guide de génération des icônes PWA pour AirWatch Bénin

## 1. Créer l'icône principale

Pour créer les icônes PWA, vous avez besoin d'une icône source de haute qualité (au moins 512x512px).

### Outils en ligne recommandés :
- **PWA Builder** : https://www.pwabuilder.com/imageGenerator
- **Favicon Generator** : https://realfavicongenerator.net/
- **PWA Manifest Generator** : https://app-manifest.firebaseapp.com/

## 2. Tailles d'icônes requises

Créez les icônes suivantes dans le dossier `public/icons/` :

```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-180x180.png (pour iOS)
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── icon-192x192-maskable.png
├── icon-512x512-maskable.png
└── favicon.ico
```

## 3. Thème de couleur pour AirWatch Bénin

Utilisez cette palette de couleurs :
- **Couleur principale** : #059669 (vert émeraude)
- **Couleur secondaire** : #10b981 (vert clair)
- **Arrière-plan** : #ffffff (blanc)

## 4. Design des icônes

### Recommandations :
- Utilisez un symbole lié à l'air/environnement (feuille, vent, graphique)
- Gardez un design simple et reconnaissable
- Assurez-vous que l'icône est lisible en petite taille
- Utilisez la palette de couleurs définie

### Icône maskable :
- Ajoutez une zone de sécurité de 10% autour de l'icône
- Le contenu principal doit être dans un cercle central
- Utilisez un arrière-plan uni

## 5. Scripts d'automatisation

Si vous avez ImageMagick installé, vous pouvez utiliser :

```bash
# Redimensionner une icône source (512x512) vers toutes les tailles
convert icon-source.png -resize 72x72 public/icons/icon-72x72.png
convert icon-source.png -resize 96x96 public/icons/icon-96x96.png
convert icon-source.png -resize 128x128 public/icons/icon-128x128.png
convert icon-source.png -resize 144x144 public/icons/icon-144x144.png
convert icon-source.png -resize 152x152 public/icons/icon-152x152.png
convert icon-source.png -resize 180x180 public/icons/icon-180x180.png
convert icon-source.png -resize 192x192 public/icons/icon-192x192.png
convert icon-source.png -resize 384x384 public/icons/icon-384x384.png
convert icon-source.png -resize 512x512 public/icons/icon-512x512.png
```

## 6. Validation

Une fois les icônes créées, vérifiez :
- [ ] Toutes les tailles sont présentes
- [ ] Les icônes sont optimisées (compression PNG)
- [ ] Les icônes maskables ont la zone de sécurité
- [ ] Le favicon.ico est présent
- [ ] Les chemins dans `app/manifest.ts` sont corrects

## 7. Test

Testez votre PWA avec :
- Chrome DevTools > Application > Manifest
- Lighthouse audit PWA
- Test sur mobile réel 