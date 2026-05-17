# GermanMaster Mobile App

React Native (Expo) mobile frontend for the GermanMaster platform.
Uses the same backend API as the web app.

## Quick Start

### 1. Install dependencies
```bash
cd mobile
npm install
```

### 2. Start the app
```bash
npx expo start
```

Scan the QR code with **Expo Go** (free on App Store / Play Store) to run on your phone immediately.

## Folder Structure

```
mobile/
├── App.js                        ← Entry point
├── src/
│   ├── services/api.js           ← All API calls (connects to gjuhagjermane.com)
│   ├── context/AuthContext.js    ← Login state (JWT stored in SecureStore)
│   ├── navigation/
│   │   ├── AppNavigator.js       ← Root: Auth vs Main
│   │   ├── AuthNavigator.js      ← SignIn / SignUp / ForgotPassword
│   │   └── MainNavigator.js      ← Bottom tabs
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SignInScreen.js
│   │   │   ├── SignUpScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   ├── HomeScreen.js
│   │   ├── DictionaryScreen.js
│   │   ├── WordDetailScreen.js
│   │   ├── ListenScreen.js
│   │   ├── ListenDetailScreen.js
│   │   ├── QuizScreen.js
│   │   ├── QuizDetailScreen.js
│   │   ├── LeaderboardScreen.js
│   │   └── ProfileScreen.js
│   └── components/
│       ├── LoadingSpinner.js
│       ├── XPBadge.js
│       └── ErrorMessage.js
└── assets/                       ← Add icon.png and splash.png here
```

## Placeholder Assets

Expo requires icon.png (1024x1024) and splash.png in `assets/`.
You can use any image for now — just rename it to icon.png and splash.png.

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios
```
