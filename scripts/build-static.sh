
#!/bin/bash
echo "🔧 Préparation de l'export statique..."

# Sauvegarder les routes API
mkdir -p temp-api-backup
cp -r app/api temp-api-backup/

# Supprimer les routes API temporairement
rm -rf app/api

# Build Next.js
pnpm build

# Restaurer les routes API
rm -rf app/api
cp -r temp-api-backup/api app/
rm -rf temp-api-backup

echo "✅ Export statique terminé"
