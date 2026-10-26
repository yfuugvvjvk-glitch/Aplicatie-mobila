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

Copiază și lipește această comandă în terminal (înlocuiește calea dacă proiectul este în alt folder):

```
cd "C:\Users\tatar\OneDrive\Desktop\DanubiusMv\proiect\aplicatie mobila\Petrescu Cristian Aplicatie mobila"
```

### Pasul 4 — Configurează backend-ul Supabase

1. Creează un proiect la [supabase.com](https://supabase.com/) și așteaptă inițializarea bazei de date.
2. În **SQL Editor**, rulează integral scriptul din `supabase/schema.sql`. Acesta creează tabelele și politicile Row Level Security pentru izolarea datelor fiecărui utilizator.
3. În setările proiectului, configurează **Authentication → URL Configuration** și opțiunile de confirmare a emailului după cerințele tale.
4. Copiază `.env.example` în `.env` și completează URL-ul proiectului și cheia **publishable/anon** din setările Supabase.
5. La prima autentificare, datele vechi din AsyncStorage (dacă există) sunt migrate criptat și asociate primului cont Supabase folosit pe acel dispozitiv.

```env
EXPO_PUBLIC_SUPABASE_URL=https://proiectul-tau.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=cheia-ta-publishable-sau-anon
```

Cheia publishable/anon este folosită de client și nu înlocuiește politicile RLS. **Nu introduce niciodată `service_role` sau alte chei secrete într-o variabilă `EXPO_PUBLIC_*` ori în aplicația mobilă.** Fișierul `.env` este exclus din Git.

Fără aceste setări autentificarea reală nu este disponibilă; aplicația afișează un mesaj de configurare în loc să simuleze conectarea.

---

### Pasul 5 — Pornește serverul de dezvoltare

```
npx expo start --clear
```

> `--clear` curăță cache-ul. Folosește-l prima dată sau după erori.

Dacă îți cere să alegi portul, apasă `Y` (yes) pentru port alternativ.

---

### Pasul 6 — Scanează codul QR

În terminal va apărea un cod QR. Acum:

- **Android**: deschide aplicația **Expo Go** → apasă **"Scan QR Code"** → scanează
- **iPhone**: deschide **Camera** (nu Expo Go) → îndreaptă spre QR → apasă notificarea

> ⚠️ **Telefonul și calculatorul trebuie să fie pe același WiFi!**
> Dacă ești pe WiFi de la facultate/rețea de campus și nu funcționează, încearcă să dai hotspot de pe telefon și conectează calculatorul la acel hotspot.

---

### Pasul 7 — Aplicația se încarcă automat

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

### Evaluarea platformei în raport cu criteriile

#### Dezvoltare declarativă / low-code

- React Native folosește **JSX declarativ**: interfața descrie ce trebuie afișat.
- Expo simplifică rularea și build-ul fără configurare nativă manuală în fluxul managed.
- **Limitare asumată:** proiectul este centrat pe cod JavaScript/JSX; nu oferă editor drag-and-drop/no-code. Criteriul low-code este evaluat ca abordare declarativă, nu ca funcționalitate no-code.

#### Abordare centrată pe cod

- Cod 100% JavaScript/JSX, editabil în orice IDE (VS Code, WebStorm, Kiro)
- Nu necesită IDE proprietar
- Hot Reload și Fast Refresh pentru ciclu rapid de dezvoltare

#### Reutilizare și arhitectură

- `TaskCard` — afișare task cu prioritate, categorie, dată, checkbox
- `StatCard` — afișare metrică cu icon și culoare
- `TaskContext` separă starea și logica de interfață; `src/services/` separă backend-ul de sincronizare.
- Supabase oferă un backend gestionat (Auth, PostgreSQL și API). Este o arhitectură backend-as-a-service, **nu o implementare de microservicii**.

#### Servicii backend, cloud și offline

- Supabase Auth gestionează înregistrarea, confirmarea emailului și autentificarea prin email/parolă.
- Task-urile și categoriile se sincronizează cu PostgreSQL prin `src/services/sync.js`.
- Modificările offline sunt criptate local și puse într-o coadă per utilizator; sincronizarea se reia la revenirea în aplicație sau prin butonul din Profil.
- Expo/EAS poate fi folosit separat pentru build și distribuție; configurarea unui proiect EAS/App Store/Google Play nu este inclusă.

#### Securitate

- Politicile **Row Level Security** din `supabase/schema.sql` permit accesul numai la rândurile utilizatorului autentificat; tabela `anon` nu primește acces.
- Sesiunea de autentificare este păstrată cu `expo-secure-store`; datele offline și coada de sincronizare sunt criptate AES-GCM, cu cheia păstrată în SecureStore.
- Parolele nu sunt păstrate în aplicație. Clientul folosește cheia publishable/anon; cheia `service_role` rămâne doar pe server.
- Securitatea cloud depinde de aplicarea scriptului SQL în proiectul Supabase și de păstrarea corectă a cheilor. Cheia locală este legată de dispozitiv, astfel încât datele cache nu se transferă automat pe alt dispozitiv.
- Recuperarea dintr-o ștergere/incident la nivelul bazei depinde de politica de backup disponibilă pentru planul Supabase ales. Verifică **Database → Backups** în dashboard și configurează backup-uri potrivite înainte de utilizarea cu date importante; scriptul aplicației nu activează singur backup-urile furnizorului.

#### Open source și pregătire pentru viitor

- React Native — licență MIT
- Expo — licență MIT
- `@react-navigation` — licență MIT
- `@react-native-async-storage` — licență MIT
- Backend-ul folosește API-uri PostgreSQL/Supabase, iar logica de sincronizare este separată de ecrane pentru a putea schimba sau extinde serviciile.
- React Native 0.86 folosește arhitectura curentă React Native. Compatibilitatea versiunilor Expo/RN trebuie reverificată la fiecare upgrade SDK.

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
│   ├── services/
│   │   ├── supabase.js            # Client Supabase + sesiune securizată
│   │   └── sync.js                # Sincronizare cloud și coadă offline
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
│       └── storage.js             # Cache/coadă offline criptate (AsyncStorage)
├── supabase/
│   └── schema.sql                 # Tabele, indecși și politici RLS
├── .env.example                  # Exemplu configurare (fără chei reale)
└── assets/                        # Iconuri și splash screen
```

---

## 🚀 Funcționalități implementate

### 🔐 Autentificare și securitate

- Înregistrare și login prin Supabase Auth, cu validare și confirmare email configurabilă
- Sesiune persistentă în SecureStore
- Delogare cu confirmare
- Izolarea task-urilor și categoriilor cu politici RLS

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

### ☁️ Offline și sincronizare

- Cache și coadă de modificări criptate AES-GCM, per utilizator
- Modificările făcute offline se trimit când aplicația revine în prim-plan; statusul și eventualele erori apar în Profil
- Pentru prima conectare este necesară o conexiune și configurarea proiectului Supabase

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
| expo                                      | ~57.0.31 | Framework cross-platform |
| react-native                              | 0.86.3   | Core UI                  |
| @react-navigation/native                  | ^7.5.0   | Navigare                 |
| @react-navigation/bottom-tabs             | ^7.20.0  | Tab navigation           |
| @react-navigation/stack                   | ^7.12.0  | Stack navigation         |
| @react-native-async-storage/async-storage | 2.2.0    | Persistență locală       |
| @supabase/supabase-js                     | 2.x      | Auth și API backend       |
| expo-secure-store                         | SDK 57   | Sesiune și cheie securizată |
| expo-crypto                               | SDK 57   | Criptare locală AES-GCM    |
| react-native-worklets                     | 0.10.x   | Peer dependency Reanimated 4 |
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
