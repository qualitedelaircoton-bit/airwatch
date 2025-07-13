# 🔥 Configuration Firebase pour AirWatch Bénin

## Vue d'ensemble

Ce guide vous explique comment configurer Firebase pour votre projet AirWatch Bénin avec authentification et Firestore.

## 📋 Prérequis

- Compte Google/Gmail
- Projet Next.js 15 déployé
- Accès au Firebase Console

## 🚀 Étapes de Configuration

### 1. Créer un Projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Créer un projet"
3. Nommez votre projet : `airwatch-benin`
4. Activez Google Analytics (optionnel)
5. Attendez la création du projet

### 2. Configurer l'Application Web

1. Dans votre projet Firebase, cliquez sur l'icône Web `</>`
2. Nommez votre app : `AirWatch Bénin`
3. Cochez "Configurer aussi Firebase Hosting" si vous voulez utiliser Firebase Hosting
4. Cliquez sur "Enregistrer l'app"

### 3. Copier les Clés de Configuration

Copiez les clés de configuration affichées et créez un fichier `.env.local` :

```env
# Configuration Firebase (côté client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Configurer l'Authentification

1. Dans le menu Firebase, allez dans **Authentication**
2. Cliquez sur "Commencer"
3. Onglet **Sign-in method** :
   - Activez "E-mail/Mot de passe"
   - Activez "Lien par e-mail (connexion sans mot de passe)" si souhaité
4. Onglet **Settings** :
   - Configurez le nom de votre projet
   - Ajoutez votre domaine autorisé

### 5. Créer Firestore Database

1. Dans le menu Firebase, allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données"
3. Choisissez "Commencer en mode test" (développement)
4. Sélectionnez votre région (europe-west1 pour l'Europe)
5. Cliquez sur "Terminé"

### 6. Configurer les Règles Firestore

Remplacez les règles par défaut par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    
    // Règles pour les capteurs
    match /sensors/{sensorId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isApproved == true;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    
    // Règles pour les données des capteurs
    match /sensor-data/{dataId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isApproved == true;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```

### 7. Configurer Firebase Admin (pour les opérations serveur)

1. Dans Firebase Console, allez dans **Paramètres du projet** (roue crantée)
2. Onglet **Comptes de service**
3. Cliquez sur "Générer une nouvelle clé privée"
4. Téléchargez le fichier JSON

Ajoutez à votre `.env.local` :

```env
# Configuration Firebase Admin (côté serveur)
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----"
```

**⚠️ Important :** Remplacez `\\n` par de vraies nouvelles lignes dans la clé privée.

### 8. Configurer les Templates d'Email

1. Dans Firebase Console, allez dans **Authentication**
2. Onglet **Templates** :
   - Personnalisez l'email de vérification
   - Personnalisez l'email de réinitialisation de mot de passe
   - Configurez le domaine d'action (votre domaine)

### 9. Créer un Utilisateur Admin Initial

Une fois votre application déployée :

1. Inscrivez-vous avec votre email admin
2. Allez dans Firestore Database
3. Trouvez votre document utilisateur
4. Modifiez manuellement :
   - `role: "admin"`
   - `isApproved: true`

## 🔐 Sécurité

### Variables d'Environnement

- **NEXT_PUBLIC_*** : Visibles côté client (OK pour les clés publiques)
- **FIREBASE_*** : Secrètes, utilisées côté serveur uniquement

### Règles de Sécurité

- Les utilisateurs ne peuvent voir que leur propre profil
- Seuls les admins peuvent voir tous les profils
- Les consultants peuvent lire les données des capteurs
- Seuls les admins peuvent modifier les capteurs

## 📂 Structure Firestore

```
/users/{userId}
  - email: string
  - displayName: string
  - role: "admin" | "consultant"
  - isApproved: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  - emailVerified: boolean

/sensors/{sensorId}
  - name: string
  - latitude: number
  - longitude: number
  - frequency: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - createdBy: string (userId)

/sensor-data/{dataId}
  - sensorId: string
  - value: number
  - timestamp: timestamp
  - quality: "good" | "moderate" | "poor"
```

## 🧪 Tests

Pour tester votre configuration :

```bash
# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer en développement
pnpm dev
```

## ❗ Dépannage

### Erreur "Firebase not initialized"
- Vérifiez que toutes les variables d'environnement sont configurées
- Redémarrez votre serveur de développement

### Erreur "Permission denied"
- Vérifiez vos règles Firestore
- Assurez-vous que l'utilisateur est authentifié et approuvé

### Erreur "Invalid private key"
- Vérifiez que la clé privée est correctement formatée
- Assurez-vous que les `\\n` sont remplacés par de vraies nouvelles lignes

### Email non reçu
- Vérifiez les spams
- Configurez un domaine d'action personnalisé
- Vérifiez les templates d'email

## 🚀 Déploiement

Pour la production :

1. Ajoutez votre domaine de production dans les domaines autorisés
2. Configurez les variables d'environnement sur votre plateforme (Vercel, Netlify)
3. Passez Firestore en mode production
4. Créez des règles de sécurité plus strictes

## 🔄 Migration depuis Prisma

Si vous migrez depuis Prisma, suivez le guide de migration dans `MIGRATION_GUIDE.md`.

## 📞 Support

Pour obtenir de l'aide :
- Documentation Firebase : https://firebase.google.com/docs
- Console Firebase : https://console.firebase.google.com/
- Support Firebase : https://firebase.google.com/support/

---

**Date de création** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025  
**Version Firebase** : v11.x  
**Version Next.js** : 15.3.3 