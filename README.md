# TaskManager — Aplicație Mobilă React Native / Expo

## 📌 Prezentare generală

**TaskManager** este o aplicație mobilă cross-platform (Android/iOS) dezvoltată cu **React Native** și **Expo SDK 57**, ca proiect academic pentru cursul de Dezvoltare Aplicații Mobile.

Aplicația permite utilizatorilor să gestioneze sarcini zilnice, să le organizeze pe categorii, să urmărească progresul și să vizualizeze statistici de productivitate.

---

## 📱 Pornirea aplicației pe telefon

### Cerințe

- Node.js LTS și Git instalate pe calculator.
- Expo Go instalat pe telefon din Google Play sau App Store. Versiunea Expo Go trebuie să fie compatibilă cu Expo SDK 57 folosit de proiect.
- Telefonul și calculatorul conectate la aceeași rețea Wi-Fi pentru conexiunea LAN.

### 1. Obține proiectul

Clonează repository-ul:

```bash
git clone https://github.com/yfuugvvjvk-glitch/Aplicatie-mobila.git
cd Aplicatie-mobila
```

Sau deschide terminalul în folderul proiectului deja descărcat.

### 2. Instalează pachetele și verifică proiectul

Din folderul rădăcină al proiectului:

```bash
npm ci
npx expo lint
```

`npm ci` instalează versiunile fixate în `package-lock.json`. Dacă ai schimbat pachetele și lockfile-ul nu mai corespunde, folosește `npm install`.

### 3. Alege modul de utilizare

**Demo/local:** pornește aplicația și apasă „Continuă fără cont (demo)”. Nu ai nevoie de proiect Supabase sau de fișier `.env`. Sarcinile și categoriile rămân pe telefonul curent și nu se sincronizează cu alte dispozitive.

**Cont și sincronizare cloud:** configurează Supabase conform secțiunii următoare înainte de a porni Expo. Înregistrarea și autentificarea cloud nu funcționează fără un proiect Supabase configurat și schema SQL aplicată.

### 4. Pornește Expo

```bash
npx expo start
```

Pentru depanare sau după schimbarea configurației, poți curăța cache-ul:

```bash
npx expo start --clear
```

Scanează codul QR din terminal cu Expo Go pe Android. Pe iPhone poți folosi Camera sau scanerul din Expo Go. La schimbarea valorilor din `.env`, oprește serverul și pornește-l din nou, deoarece valorile `EXPO_PUBLIC_*` sunt incluse la pornirea bundle-ului.

Telefonul și calculatorul trebuie să fie pe aceeași rețea pentru conexiunea LAN. Dacă rețeaua blochează dispozitivele între ele, încearcă o rețea personală/hotspot sau pornește cu `npx expo start --tunnel`.

> Expo Go rulează proiectul pentru testare; GitHub nu găzduiește serverul Metro și nu distribuie automat o aplicație instalabilă. Pentru ca altcineva să testeze cu Expo Go, trebuie să aibă acces la serverul de dezvoltare pornit. Pentru distribuirea unei aplicații instalabile este necesar un build Android/iOS separat (de exemplu, cu EAS Build).

## ☁️ Configurarea Supabase (opțional, pentru conturi și sincronizare)

Supabase este un serviciu cloud separat de GitHub. Repository-ul conține scriptul pentru baza de date, dar încărcarea codului pe GitHub **nu creează** proiectul Supabase și **nu rulează** automat SQL-ul.

### 1. Creează proiectul cloud

1. Creează sau deschide un proiect în [Supabase](https://supabase.com/).
2. Așteaptă ca baza de date să fie pornită.
3. În Dashboard, deschide **SQL Editor**, creează o interogare nouă, copiază tot conținutul din `supabase/schema.sql` și apasă **Run**.
4. Verifică în **Table Editor** că au fost create tabelele `categories` și `tasks`. Scriptul activează Row Level Security și politicile pentru utilizatorii autentificați.
5. Din setările proiectului, copiază Project URL și cheia client **Publishable** (sau cheia legacy `anon`). Nu folosi cheia `service_role`/`secret` în aplicația mobilă.

### 2. Configurează aplicația local

Creează `.env` din exemplul inclus. În macOS/Linux folosește:

```bash
cp .env.example .env
```

În Windows PowerShell folosește `Copy-Item .env.example .env`, iar în Command Prompt folosește `copy .env.example .env`. Apoi deschide `.env` și completează valorile proiectului tău:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_public_key
```

Fișierul `.env` este ignorat de Git; nu îl adăuga și nu îl trimite nimănui cu cheile reale.

Cheia Publishable/anon este o cheie client publică și poate ajunge în pachetul mobil. Ea nu este un secret și nu înlocuiește RLS. **Nu pune niciodată `service_role`, `sb_secret_...`, parole sau alte secrete în `EXPO_PUBLIC_*`, în cod ori în GitHub.** Dacă o cheie secretă a fost expusă, roteaz-o din Dashboard-ul Supabase.

### 3. Activează autentificarea prin email

În Supabase Dashboard verifică **Authentication → Providers → Email** și stabilește dacă înregistrarea necesită confirmarea adresei. Dacă confirmarea este activată, utilizatorul trebuie să confirme mesajul primit înainte de autentificare. În modul cloud, fiecare utilizator are date separate prin politicile RLS. În demo, nu se creează cont și nu se face sincronizare.

Schema se aplică o singură dată pentru fiecare proiect Supabase. Dacă modifici ulterior `supabase/schema.sql`, rulează modificările necesare și în proiectul cloud; simpla actualizare a fișierului pe GitHub nu modifică baza de date deja creată.

### Ce se trimite prin GitHub și ce rămâne separat

| Resursă | Unde se păstrează | Se trimite pe GitHub? |
| --- | --- | --- |
| Codul aplicației și documentația | Repository GitHub | Da |
| `supabase/schema.sql` | Repository; se aplică separat în SQL Editor | Da |
| `.env.example` cu valori demonstrative | Repository | Da |
| `.env` cu URL/cheia proiectului tău | Calculatorul dezvoltatorului | Nu |
| Chei `secret`/`service_role` și parole | Niciodată în client sau repository | Nu |
| Datele utilizatorilor și tabelele Supabase | Proiectul Supabase | Nu sunt încărcate prin `git push` |

O persoană care clonează proiectul poate rula aplicația în demo fără credențiale. Pentru conturi și sincronizare, aceasta trebuie să configureze propriul proiect Supabase (sau să primească accesul corespunzător în proiectul cloud) și propriul `.env`.

## 🐛 Depanare

- **Expo Go spune că proiectul nu este compatibil:** instalează/actualizează Expo Go și verifică compatibilitatea cu SDK 57. Dacă versiunea Expo Go disponibilă pe telefon nu acceptă SDK-ul folosit, este necesar un development build compatibil, nu o schimbare a cheilor Supabase.
- **QR-ul nu se conectează / apare timeout:** verifică aceeași rețea Wi-Fi, firewall-ul calculatorului și încearcă `npx expo start --tunnel`.
- **Aplicația nu vede schimbările din `.env`:** oprește Metro (`Ctrl+C`) și pornește din nou cu `npx expo start --clear`.
- **Înregistrarea sau sincronizarea cloud eșuează:** verifică URL-ul și cheia publică din `.env`, conexiunea proiectului Supabase, tabelele/politicile din `supabase/schema.sql` și confirmarea emailului. Un răspuns Supabase `503`/`PGRST002` indică o problemă de disponibilitate/schema cache la backend; verifică starea bazei în Dashboard și încearcă din nou după ce serviciul este sănătos.
- **Vrei doar să testezi aplicația:** alege „Continuă fără cont (demo)”; Supabase nu este necesar pentru utilizarea locală.

## 🚀 Actualizarea proiectului pe GitHub

GitHub păstrează codul și istoricul proiectului; nu pornește aplicația și nu publică automat schema într-o bază de date. După modificări, din folderul repository-ului:

```bash
git status
git add README.md
git commit -m "Document app setup and Supabase configuration"
git push origin master
```

Dacă ai modificat și alte fișiere urmărite, adaugă-le explicit cu `git add <cale>`. Înainte de commit verifică `git status` și asigură-te că `.env`, cheile secrete și fișierele generate nu apar în lista fișierelor staged. După push, documentația și scriptul SQL pot fi accesate de pe pagina repository-ului; schema tot trebuie rulată separat în Supabase.

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
- Fără configurare Supabase, butonul „Continuă în modul demo” permite folosirea imediată a aplicației; modul demo nu este un cont și nu sincronizează date cu cloud-ul.

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
- În modul demo, toate funcțiile sunt locale; datele rămân criptate pe dispozitiv și nu se transferă între telefoane.

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
