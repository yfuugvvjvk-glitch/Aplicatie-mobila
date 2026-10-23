# TaskManager — Aplicație Mobilă React Native / Expo

## 📌 Prezentare generală

**TaskManager** este o aplicație mobilă cross-platform (Android/iOS) dezvoltată cu **React Native** și **Expo SDK 57**, ca proiect academic pentru cursul de Dezvoltare Aplicații Mobile.

Aplicația permite utilizatorilor să gestioneze sarcini zilnice, să le organizeze pe categorii, să urmărească progresul și să vizualizeze statistici de productivitate.

---

## 📱 CUM INSTALEZI ȘI RULEZI PE TELEFON (pas cu pas)

### Pasul 1 — Instalează Expo Go pe telefon

- **Android** → deschide **Google Play Store** → caută **Expo Go** → instalează
- **iPhone** → deschide **App Store** → caută **Expo Go** → instalează

> Expo Go este aplicația „gazdă" care rulează proiectul tău fără să fie nevoie să construiești un APK.

---

### Pasul 2 — Deschide un terminal pe calculator

Apasă `Win + R` → scrie `cmd` → Enter

Sau în VS Code / Kiro: deschide terminalul integrat (`Ctrl + `` ` ``)

---

### Pasul 3 — Navighează în folderul proiectului

Copiază și lipește această comandă în terminal:

```
cd "C:\Users\tatar\OneDrive\Desktop\colegiu\proiect\aplicatie mobila\TaskManagerApp"
```

---

### Pasul 4 — Pornește serverul de dezvoltare

```
npx expo start --clear
```

> `--clear` curăță cache-ul. Folosește-l prima dată sau după erori.

Dacă îți cere să alegi portul, apasă `Y` (yes) pentru port alternativ.

---

### Pasul 5 — Scanează codul QR

În terminal va apărea un cod QR. Acum:

- **Android**: deschide aplicația **Expo Go** → apasă **"Scan QR Code"** → scanează
- **iPhone**: deschide **Camera** (nu Expo Go) → îndreaptă spre QR → apasă notificarea

> ⚠️ **Telefonul și calculatorul trebuie să fie pe același WiFi!**
> Dacă ești pe WiFi de la facultate/rețea de campus și nu funcționează, încearcă să dai hotspot de pe telefon și conectează calculatorul la acel hotspot.

---

### Pasul 6 — Aplicația se încarcă automat

Prima încărcare durează ~30-60 secunde (compilare). La modificări ulterioare e instantaneu.

---

## 🔧 Dacă apare o eroare pe telefon

### Eroarea `hitSlop cannot be cast` sau erori de gesture handler

Aceasta a fost deja rezolvată prin downgrade la versiunea compatibilă. Asigură-te că ai rulat `--clear`.

### Eroarea `Network response timed out` sau QR nu funcționează

Telefonul nu găsește calculatorul. Soluții:

1. Asigură-te că ești pe același WiFi
2. În Expo Go, în loc să scanezi QR, apasă **"Enter URL manually"** și scrie:
   ```
   exp://IP_CALCULATOR:8081
   ```
   (IP-ul calculatorului îl găsești în terminal lângă `exp://`)

### Eroarea `Something went wrong` generică

În terminal apasă `R` pentru a reîncărca, sau repornește cu `npx expo start --clear`.

---

## 🏗️ Arhitectura platformei (criterii de evaluare)

### ✅ Low-coding / Declarativ

- React Native folosește **JSX** — o abordare **declarativă** în care se descrie _ce_ să fie afișat, nu _cum_
- Stilurile sunt definite cu `StyleSheet.create()`, similar CSS
- Expo oferă un **workflow managed** care elimină configurarea nativă (Android Studio / Xcode)

### ✅ Abordare centrică pe cod

- Cod 100% JavaScript/JSX, editabil în orice IDE (VS Code, WebStorm, Kiro)
- Nu necesită IDE proprietar
- Hot Reload și Fast Refresh pentru ciclu rapid de dezvoltare

### ✅ Componentă reutilizabilă

- `TaskCard` — afișare task cu prioritate, categorie, dată, checkbox
- `StatCard` — afișare metrică cu icon și culoare
- `TaskContext` — logica de business separată de UI (portabilă)

### ✅ Arhitectura serviciilor

- **Context API + useReducer** — state management predictibil, similar Redux, fără dependențe externe
- **Layerul de servicii** separat în `src/utils/storage.js`
- Arhitectură pregătită pentru **microservicii** — înlocuiești `storage.js` cu apeluri REST/GraphQL

### ✅ Servicii back-end

- **AsyncStorage** — persistență locală, funcționează **offline-first**
- Structura permite integrare ușoară cu Firebase, Supabase, REST APIs
- Gestionare utilizatori cu sesiune persistentă

### ✅ Serviciul Cloud

- **Expo Go** permite testare imediată pe dispozitive reale (scanare QR)
- **EAS Build** (Expo Application Services) pentru build în cloud
- Deployment pe App Store / Google Play prin `eas submit`

### ✅ Securitate

- Validare input pe toate formularele (email, parolă, titlu, date)
- Nu se stochează parole în text clar
- `AsyncStorage` izolat per aplicație (sandboxed)

### ✅ Open Source

- React Native — licență MIT
- Expo — licență MIT
- `@react-navigation` — licență MIT
- `@react-native-async-storage` — licență MIT

### ✅ Future Ready

- **React Native New Architecture** activată (`newArchEnabled: true`)
- Suport pentru React 19 și React Native 0.86
- Scalabil: se poate adăuga TypeScript, Redux Toolkit, TanStack Query

---

## 📁 Structura proiectului

```
TaskManagerApp/
├── App.js                         # Punct de intrare
├── app.json                       # Configurație Expo
├── babel.config.js                # Configurație Babel (reanimated plugin)
├── src/
│   ├── context/
│   │   └── TaskContext.js         # State global (Context API + useReducer)
│   ├── navigation/
│   │   └── AppNavigator.js        # React Navigation (Stack + Tab)
│   ├── screens/
│   │   ├── LoginScreen.js         # Autentificare / Înregistrare
│   │   ├── HomeScreen.js          # Dashboard principal
│   │   ├── AddTaskScreen.js       # Adăugare / Editare task
│   │   ├── TaskDetailScreen.js    # Detalii task
│   │   ├── CategoriesScreen.js    # Gestionare categorii
│   │   └── ProfileScreen.js       # Profil utilizator + statistici
│   ├── components/
│   │   ├── TaskCard.js            # Card reutilizabil task
│   │   └── StatCard.js            # Card statistici
│   └── utils/
│       └── storage.js             # Layer persistență (AsyncStorage)
└── assets/                        # Iconuri și splash screen
```

---

## 🚀 Funcționalități implementate

### 🔐 Autentificare

- Formular login / înregistrare cu validare completă
- Sesiune persistentă (rămâi logat după închidere)
- Delogare cu confirmare

### 📋 Gestionare Task-uri

- **Adăugare** task cu: titlu, descriere, prioritate, categorie, dată scadentă, reminder
- **Editare** task existent (ecran reutilizat)
- **Ștergere** cu dialog de confirmare
- **Marcare** completat/activ direct din listă sau ecran detalii
- **Sortare** automată: active primele, ordonate după dată scadentă

### 🔍 Filtrare și Căutare

- Filtre rapide: Toate / Active / Finalizate
- Căutare full-text în titlu și descriere

### 📁 Categorii

- 5 categorii predefinite: Muncă, Personal, Sănătate, Studiu, Cumpărături
- Adăugare categorii noi cu nume, culoare și pictogramă personalizate
- Vizualizare task-uri per categorie cu progress bar

### 📊 Statistici și Profil

- Dashboard cu 4 metrici: Total, Active, Finalizate, Depășite
- Rată de finalizare globală cu progress bar
- Task-uri urgente (prioritate ridicată)
- Progres per categorie

### ♿ Accesibilitate

- Toate elementele interactive au `accessibilityRole` și `accessibilityLabel`
- `accessibilityState` pentru checkbox-uri și radio buttons
- Contrast vizual ridicat (WCAG AA)
- Suport KeyboardAvoidingView pentru formulare

---

## 📦 Dependențe principale

| Pachet                                    | Versiune | Scop                     |
| ----------------------------------------- | -------- | ------------------------ |
| expo                                      | ~57.0.28 | Framework cross-platform |
| react-native                              | 0.86.3   | Core UI                  |
| @react-navigation/native                  | ^7.5.0   | Navigare                 |
| @react-navigation/bottom-tabs             | ^7.20.0  | Tab navigation           |
| @react-navigation/stack                   | ^7.12.0  | Stack navigation         |
| @react-native-async-storage/async-storage | 2.2.0    | Persistență locală       |
| react-native-gesture-handler              | 2.32.0   | Gesturi touch            |
| react-native-safe-area-context            | 5.7.0    | Safe area                |
| react-native-screens                      | 4.26.2   | Optimizare ecrane        |
| react-native-reanimated                   | 4.5.1    | Animații fluide          |

---

## 🎓 Tehnologii și concepte aplicate

- **React Hooks**: `useState`, `useEffect`, `useReducer`, `useContext`
- **Context API**: state management global fără Redux
- **AsyncStorage**: persistență asincronă, pattern CRUD
- **React Navigation**: navigare declarativă Stack + Tab
- **Validare formulare**: validare sincronă cu feedback vizual
- **Componente reutilizabile**: separare logică UI/business
- **Accesibilitate mobilă**: ARIA roles pentru React Native

---

## 👤 Autor

Proiect academic — Curs Dezvoltare Aplicații Mobile
Platforma aleasă: **React Native + Expo** (Open Source, Cross-Platform, Future Ready)
