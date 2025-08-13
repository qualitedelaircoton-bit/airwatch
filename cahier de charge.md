Cahier des Charges : Plateforme Web de Surveillance de la Qualité de l'Air
Version : 1.5
Date : 06/06/2025
Auteur : Gemini

1.0 Objectif du Développement
L'objectif de ce document est de guider une équipe de développeurs web dans la construction d'une application full-stack complète et interactive. Cette plateforme permettra la gestion des capteurs, la surveillance en temps réel de leurs données, et l'analyse des données historiques de qualité de l'air.

L'application doit être performante, intuitive et visuellement claire. Ce document est la seule source de vérité pour ce développement et détaille l'architecture, le design, et le comportement attendu de chaque composant de l'application.

2.0 Architecture et Stack Technique
Framework Full-Stack : Next.js (utilisant l'App Router).

Base de Données : MongoDB.

ORM / Client Base de Données : Prisma.

Styling : Tailwind CSS v4. Le développement devra adopter l'approche CSS-first. La philosophie est de définir l'ensemble du système de design (couleurs, polices, espacements) via la directive @theme dans un fichier CSS global. Les composants seront stylisés en utilisant les variables CSS natives ainsi générées et la directive @variant pour gérer les états (hover, dark, etc.). Le but est de maintenir un code JSX propre et lisible, en favorisant des classes sémantiques et une réutilisation directement via le CSS.

Bibliothèque de Composants UI : shadcn/ui. Tous les éléments d'interface (boutons, formulaires, cartes, modales, etc.) devront être construits en utilisant les composants de cette bibliothèque, dont le style sera personnalisé via les variables CSS et les directives Tailwind mentionnées ci-dessus.

Déploiement : Prévu pour Firebase Hosting (Next.js) et MongoDB Atlas.

Note sur les Versions : Toutes les dépendances et bibliothèques (Next.js, React, Prisma, Tailwind CSS, shadcn/ui, etc.) doivent être utilisées dans leur dernière version stable disponible au moment du démarrage du développement.

2.1 Flux de Données
Réception : Un service Node.js indépendant (mqtt-listener.ts) est constamment connecté au broker MQTT et écoute les messages des capteurs.

Stockage : Lorsqu'un message est reçu, le listener le valide et l'insère dans la base de données MongoDB via Prisma.

Exposition : Le backend de l'application Next.js (via les API Routes) expose des endpoints sécurisés pour lire les données depuis MongoDB.

Affichage : Le frontend de l'application Next.js (composants React) appelle ces endpoints pour récupérer les données et les présenter à l'utilisateur.

3.0 Base de Données (Schéma Prisma)
Le fichier /prisma/schema.prisma est le contrat qui définit la structure de nos données dans MongoDB.

// Fichier : /prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// Représente un capteur physique déployé.
model Sensor {
  // ID unique généré par MongoDB, utilisé comme clé primaire.
  id        String      @id @default(auto()) @map("_id") @db.ObjectId
  // Nom lisible du capteur, défini par l'utilisateur (ex: "Capteur Cotonou - Place de l'Étoile Rouge").
  name      String
  // Coordonnée de latitude pour l'affichage sur la carte.
  latitude  Float
  // Coordonnée de longitude pour l'affichage sur la carte.
  longitude Float
  // Fréquence d'envoi attendue en minutes. Essentiel pour calculer le statut (orange/vert).
  frequency Int
  // Date de création de l'enregistrement dans la base de données.
  createdAt DateTime    @default(now())
  // Timestamp de la dernière réception de données de ce capteur. Mis à jour par le listener MQTT.
  lastSeen  DateTime?
  // Statut calculé du capteur, expliqué en détail ci-dessous.
  status    Status      @default(RED)

  // Relation vers toutes les données historiques de ce capteur.
  data      SensorData[]
}

// Représente une seule lecture de données envoyée par un capteur à un instant T.
model SensorData {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  // ID du capteur parent, créant le lien entre la donnée et le capteur.
  sensorId  String   @db.ObjectId
  // Timestamp exact de la lecture, envoyé par le capteur.
  timestamp DateTime
  // Toutes les valeurs numériques des capteurs.
  pm1_0          Float
  pm2_5          Float
  pm10           Float
  o3_raw         Float
  o3_corrige     Float
  no2_voltage_mv Float
  no2_ppb        Float
  voc_voltage_mv Float
  co_voltage_mv  Float
  co_ppb         Float
  // Lien de retour vers le document du capteur parent.
  sensor    Sensor   @relation(fields: [sensorId], references: [id])
}

// Définit les trois états possibles pour un capteur.
enum Status {
  GREEN
  ORANGE
  RED
}

4.0 Spécifications Détaillées de l'Interface Utilisateur (Frontend)
4.1 Charte Graphique et Composants d'UI Globaux
Élément

Code Hexadécimal

Utilisation Spécifique

Primaire

#007BFF

Boutons principaux, liens, icônes actives.

Fond

#FFFFFF

Fond de page.

Fond de Section

#F8F9FA

Fonds pour les cartes, en-têtes.

Texte Principal

#212529

Titres, paragraphes.

Statut Vert

#28A745

Logique : Capteur actif.

Statut Orange

#FFC107

Logique : Capteur en retard.

Statut Rouge

#DC3545

Logique : Capteur hors-ligne / erreur.

4.2 Page Principale / Tableau de Bord (/app/page.tsx)
Objectif : Donner une vue d'ensemble immédiate de l'état du parc de capteurs.

Structure :

Un en-tête avec le titre "Tableau de Bord - Qualité de l'Air".

Des boutons d'action : Button de shadcn/ui pour "Ajouter un Capteur" et "Télécharger les Données".

Un champ Input de shadcn/ui pour la recherche par nom.

Un groupe de Button (variante "outline") pour basculer entre la "Vue Carte" et la "Vue Grille".

Logique de Données : La page doit faire un appel à l'endpoint GET /api/sensors pour récupérer la liste des capteurs et leur état.

Vue Carte (MapView) :

Technologie : react-leaflet.

Affichage :

Une carte du Bénin est affichée.

Chaque capteur est représenté par un marqueur circulaire de 15px de diamètre.

La couleur du cercle DOIT correspondre à son statut : si sensor.status est GREEN, la couleur de fond est #28A745. Si ORANGE, #FFC107. Si RED, #DC3545.

Interactivité :

Au clic sur un marqueur, une popup s'ouvre et affiche les informations clés : nom, dernière heure de vue, et un bouton/lien "Voir les détails" qui redirige vers /sensors/{sensor.id}.

Vue Grille (GridView) :

Affichage : Une grille responsive (utilisant CSS Grid ou Flexbox) affichant les capteurs sous forme de cartes (Card) de shadcn/ui. Plusieurs cartes peuvent apparaître sur la même ligne (ex: 1 colonne sur mobile, 2 sur tablette, 3 ou 4 sur grand écran).

Contenu d'une Carte Capteur (Card) : Chaque carte est composée de CardHeader, CardContent.

En-tête (CardHeader) :

Un cercle de couleur de 12px dont la couleur est déterminée par le sensor.status.

À côté, le nom du capteur dans un CardTitle (ex: "Capteur Godomey - Centre de santé").

Corps (CardContent) : Une liste d'informations clés.

Dernière émission : La date lastSeen formatée en JJ/MM/AAAA HH:mm.

(Optionnel) Une ou deux valeurs importantes, si disponibles (ex: PM2.5 : 25 µg/m³).

Interactivité : Un clic sur n'importe quelle partie d'une Card redirige l'utilisateur vers la page de détail /sensors/{sensor.id}.

4.3 Page de Détail du Capteur (/app/sensors/[id]/page.tsx)
Objectif : Permettre une analyse approfondie des données d'un seul capteur.

Structure :

Un en-tête affichant le nom du capteur et son statut (avec un Badge de shadcn/ui).

Une section de filtres.

Un composant Tabs de shadcn/ui avec deux onglets : "Graphique" et "Tableau".

Filtres :

Sélecteur de Plage de Dates : Le composant DatePicker de shadcn/ui, configuré pour la sélection de plage (DateRangePicker). Des préréglages ("Dernières 24h", "7 derniers jours") seront implémentés avec des Button.

Sélecteur de Métriques : Une liste de Checkbox de shadcn/ui, une pour chaque type de donnée mesurable.

Onglet "Graphique" (TabsContent value="graph"):

Technologie : recharts (recommandé pour son intégration avec React et shadcn/ui) ou react-chartjs-2.

Comportement : Le graphique affiche l'évolution des données dans le temps. Chaque métrique cochée est représentée par une ligne (Line) de couleur distincte. Les changements dans les filtres mettent à jour le graphique instantanément.

Onglet "Tableau" (TabsContent value="table"):

Affiche les données brutes pour la période sélectionnée dans un Table de shadcn/ui, paginé.

4.4 Page d'Ajout de Capteur (/app/sensors/new/page.tsx)
Objectif : Permettre à un administrateur d'enregistrer un nouveau capteur et de faciliter son déploiement.

Formulaire : Construit avec des composants Input et Label de shadcn/ui. La soumission est gérée par un Button.

Processus Post-Enregistrement :

Après la soumission réussie du formulaire (POST /api/sensors), le formulaire est masqué.

Une section de succès (Alert de shadcn/ui) s'affiche avec les informations critiques pour le développeur du firmware.

Une sous-section "Test de Déploiement" affiche : "En attente de la première connexion du capteur...".

Logique de test : Le frontend appelle l'endpoint GET /api/sensors/{id} toutes les 5 secondes. Dès que la réponse montre que le champ lastSeen n'est plus vide, le message se transforme en "✅ Connexion réussie ! Le capteur est en ligne."

4.5 Modale de Téléchargement des Données
Déclenchement : Le clic sur le bouton "Télécharger les Données" ouvre une Dialog de shadcn/ui.

Contenu de la Dialog :

DialogHeader avec un DialogTitle "Télécharger les données des capteurs".

DialogContent contient les champs du formulaire :

Un Select de shadcn/ui pour choisir les capteurs.

Un DatePicker avec sélection de plage.

Un RadioGroup pour choisir le format (CSV ou JSON).

DialogFooter contient un Button "Télécharger" qui construit et appelle l'URL GET /api/sensors/data, déclenchant le téléchargement.