# FinSmart Mobile - React Native App

Application mobile de gestion d'objectifs financiers développée avec React Native et Expo.

## 🚀 Technologies

- **React Native** avec **Expo SDK 54**
- **TypeScript** pour la sécurité des types
- **Expo Router v6** pour la navigation
- **Zustand** pour la gestion d'état
- **React Query** pour le state serveur
- **Axios** pour les appels API
- **i18next** pour l'internationalisation (FR/EN)
- **expo-secure-store** pour le stockage sécurisé

## 📁 Structure du Projet

```
finsmart-mobile-new/
├── app/                          # Écrans Expo Router
│   ├── (auth)/                   # Flux d'authentification
│   │   ├── welcome.tsx           # Écran d'accueil
│   │   ├── login.tsx             # Connexion
│   │   └── register.tsx          # Inscription
│   ├── (tabs)/                   # Navigation tabs
│   │   ├── index.tsx             # Dashboard
│   │   ├── short-term.tsx        # Objectifs court terme
│   │   ├── long-term.tsx         # Objectifs long terme
│   │   └── profile.tsx           # Profil utilisateur
│   └── _layout.tsx               # Layout racine
│
├── src/
│   ├── components/               # Composants réutilisables
│   │   ├── common/              # Button, Input
│   │   └── goal/                # GoalCard, ProgressCircle
│   │
│   ├── services/
│   │   ├── api/                 # Services API
│   │   │   ├── client.ts        # Client Axios
│   │   │   ├── authApi.ts       # API auth
│   │   │   └── goalsApi.ts      # API goals
│   │   └── storage/             # Stockage sécurisé
│   │
│   ├── store/                   # State management
│   │   └── authStore.ts         # Store authentification
│   │
│   ├── utils/
│   │   ├── constants.ts         # Constantes
│   │   ├── helpers/             # Fonctions helpers
│   │   └── i18n/               # Internationalisation
│   │
│   └── types/                   # Types TypeScript
│
└── .env                         # Variables d'environnement
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Modifier .env avec l'URL de votre API
```

## 🏃 Démarrage

```bash
# Démarrer l'application
npx expo start

# Options:
# - Presser 'w' pour ouvrir dans le navigateur web
# - Scanner le QR code avec l'app Expo Go
# - Presser 'a' pour Android emulator
# - Presser 'i' pour iOS simulator
```

## 📱 Fonctionnalités

### Authentification
- ✅ Inscription avec validation
- ✅ Connexion
- ✅ Stockage sécurisé des tokens
- ✅ Refresh token automatique
- ✅ Déconnexion

### Gestion des Objectifs
- ✅ Liste des objectifs (court/long terme)
- ✅ Visualisation de la progression
- ✅ Dashboard avec statistiques
- ✅ Filtrage par catégorie et timeframe
- ✅ Support multi-devises

### Profil
- ✅ Affichage du profil
- ✅ Changement de langue (FR/EN)
- ✅ Déconnexion

### Internationalisation
- ✅ Support complet FR/EN
- ✅ Sauvegarde de la préférence

## 🔧 Configuration

### Variables d'Environnement (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_APP_NAME=FinSmart
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### API Backend

L'application nécessite le backend FinSmart en cours d'exécution.

```bash
# Dans le dossier backend
cd ../finsmart-backend
npm run dev
```

## 📊 Composants Principaux

### Button
Composant bouton réutilisable avec variants (primary, secondary, outline, danger)

### Input
Champ de saisie avec label, erreur et validation

### ProgressCircle
Cercle de progression SVG avec pourcentage

### GoalCard
Carte d'objectif avec progression et montants

## 🎨 Thème et Couleurs

```typescript
COLORS = {
  primary: '#3B82F6',      // Bleu
  secondary: '#10B981',    // Vert
  danger: '#EF4444',       // Rouge
  warning: '#F59E0B',      // Orange
  success: '#22C55E',      // Vert clair
}
```

## 🌐 API Integration

### Authentification

```typescript
// Login
await authApi.login(email, password);

// Register
await authApi.register(userData);

// Logout
await authApi.logout(refreshToken);
```

### Objectifs

```typescript
// Récupérer les objectifs
const goals = await goalsApi.getGoals({ timeframe: 'short' });

// Dashboard
const dashboard = await goalsApi.getDashboard();
```

## 🔐 Sécurité

- ✅ Tokens stockés dans expo-secure-store (chiffré)
- ✅ Refresh token automatique
- ✅ Validation côté client
- ✅ HTTPS uniquement en production

## 📦 Dépendances Principales

```json
{
  "expo": "~54.0.30",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "zustand": "^4.4.7",
  "@tanstack/react-query": "^5.13.4",
  "axios": "^1.6.2",
  "expo-secure-store": "~13.0.1",
  "i18next": "^23.7.11",
  "react-i18next": "^14.0.0"
}
```

## 🚀 Build Production

```bash
# Installer EAS CLI
npm install -g eas-cli

# Configurer EAS
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## 📝 Scripts

```bash
# Démarrer l'app
npm start

# Démarrer avec cache clear
npm start --clear

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios

# Lancer sur Web
npm run web
```

## 🐛 Troubleshooting

### Problème de connexion API
- Vérifier que le backend est démarré
- Vérifier l'URL dans `.env`
- Sur Android emulator, utiliser `http://10.0.2.2:3000`

### Problème de refresh token
- Supprimer les données de l'app
- Se reconnecter

### Cache Expo
```bash
npx expo start --clear
```

## 📄 Licence

ISC

## 👥 Auteur

FinSmart Team
