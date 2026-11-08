# Angels ZTP - System Zarządzania Drużyną Siatkarską 🏐

Zaawansowana, nowoczesna aplikacja internetowa (PWA) dedykowana drużynie siatkarskiej **Angels ZTP** rywalizującej w Lidze Amatorskiej Siatkówki (LALS). System łączy kompleksowe zarządzanie meczami ligowymi, sparingami, turniejami, obecnościami na treningach, finansami i składkami (BLIK), interaktywną tablicą taktyczną 5-1 oraz niezmiennym archiwum sezonów.

---

## ⚡ Stos Technologiczny

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Język**: [TypeScript](https://www.typescriptlang.org/) (pełne statyczne typowanie)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) w dedykowanej estetyce **Pro Cyber Athletic** (ciemny sportowy motyw z akcentami błękitu cyan, szmaragdu i złota)
- **Ikony**: [Lucide React](https://lucide.dev/)
- **Baza danych**: Hybrydowy magazyn danych – lokalny plik JSON (`data/db.json`) do pracy offline oraz pełne wsparcie dla darmowej chmury **MongoDB Atlas** z auto-migracją i synchronizacją.
- **PWA & Mobile**: Obsługa instalacji jako aplikacja natywna (Service Worker, Web App Manifest)
- **Powiadomienia**: Obsługa Web Push Notifications i powiadomień przeglądarkowych o nowych meczach i ankietach

---

## ☁️ Magazyn Danych: MongoDB Atlas & Tryb Lokalny

Aplikacja posiada elastyczny, hybrydowy silnik danych:
1. **Tryb Lokalny (`data/db.json`)**: Działa domyślnie, nie wymaga internetu ani konfiguracji.
2. **Tryb Chmurowy (MongoDB Atlas)**: Idealny do udostępnienia aplikacji całej drużynie w sieci (np. na darmowym hostingu **Vercel**). Dane są bezpieczne i nie znikają przy restartach serwera.

### Jak podpiąć darmowe MongoDB Atlas (M0 512MB):
1. Zaloguj się na [mongodb.com/atlas](https://www.mongodb.com/atlas) i utwórz darmowy klaster M0 (*Free Shared*).
2. W **Database Access** stwórz użytkownika bazy i hasło.
3. W **Network Access** dodaj IP: `0.0.0.0/0` (*Allow access from anywhere*).
4. Kliknij **Connect &rarr; Drivers** i skopiuj link połączenia.
5. W pliku `.env` (lub w panelu Vercel w *Settings &rarr; Environment Variables*) wklej:
   ```env
   MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@cluster0.xxx.mongodb.net/angels_ztp?retryWrites=true&w=majority
   ```
6. **Automatyczna migracja**: Przy pierwszym uruchomieniu system sam automatycznie wyśle wszystkich zawodników, mecze, taktyki i tabele z `db.json` do Twojego klastra w chmurze! Status bazy i opcje synchronizacji możesz kontrolować w zakładce `/admin` (*Baza Danych & Chmura*).

---

## 🎯 Główne Moduły i Możliwości

### 1. 🏐 Rozgrywki & Liga (`/rozgrywki`)
Podział na 3 niezależne, dedykowane moduły meczowe:
- **⚔️ 1. Sparingi**:
  - Planowanie meczów kontrolnych, przeciwnik, data, hala, podział kosztów wynajmu.
  - Interaktywny selektor **Wyjściowej Szóstki (Lineup)** na boisku siatkarskim.
  - Zbieranie deklaracji dostępności zawodników i galeria zdjęć sparingowych.
- **🏆 2. Oficjalna Liga LALS**:
  - Pełny terminarz i wyniki meczów ligowych z setami (np. 25:22, 21:25, 15:9).
  - **Automatyczny Parser VolleyStation**: Wklejanie linku lub surowego protokołu meczowego z panelu VolleyStation (np. `phase-6925-l3d-20262027`) z natychmiastowym wyciągnięciem wyniku, punktów zdobytych przez każdego zawodnika (**ABS, Ata, Blk, Ser, Bł. przec.**), MVP, sędziów i liczby widzów.
  - Oficjalna tabela ligowa z automatycznym bilansem punktów i setów.
  - Dedykowana galeria zdjęć meczowych z filtrowaniem i tagami.
- **🥇 3. Turnieje**:
  - Rejestracja turniejów weekendowych, system pucharowy/grupowy, składy i wpisowe.

### 2. 📅 Terminarz & Frekwencja (`/events`)
- Kalendarz treningów, meczów i zbiórek.
- **Deklaracja obecności jednym kliknięciem**: *Będę*, *Niepewny*, *Nieobecny* z opcjonalną notatką dla trenera (np. kontuzja, spóźnienie 15 min).
- Weryfikacja frekwencji na żywo przez trenera lub kapitana z podsumowaniem statystyk frekwencji zespołu.

### 3. 💳 Składki & Finanse Drużyny (`/fees`)
- **Składki Zawodników**:
  - Składki miesięczne, na sprzęt/stroje oraz wpisowe na turnieje.
  - **Płatność Symulatorem BLIK**: Wpisanie 6-cyfrowego kodu BLIK, symulacja potwierdzenia w aplikacji bankowej i natychmiastowe rozliczenie.
  - Generowanie elektronicznego **Potwierdzenia Płatności PDF**.
- **Skarbiec Klubu (Treasury)**:
  - Transparentny bilans wpływów i wydatków drużyny (wynajem hali, opłaty sędziowskie, piłki).
  - Macierz rozliczeń całej kadry z możliwością wysłania przypomnienia o zaległościach.

### 4. 👥 Kadra & Profile Zawodników (`/team`)
- Lista zawodników z podziałem na Sztab oraz Zawodników.
- Karty zawodników z numerami koszulek, wzrostem, pozycją na boisku i statusem.
- Szczegółowe modale zawodnika:
  - Zagregowane statystyki ligowe VolleyStation (zdobyte punkty, skuteczność ataku, bloki, asy serwisowe).
  - Wykres radarowy umiejętności siatkarskich.
  - Edycja danych, numeru i pozycji (dla kierownika/admina).

### 5. 📋 Taktyka & Playbook 5-1 (`/taktyka` & `/coach`)
- **Interaktywna Tablica Taktyczna**:
  - Pełne boisko siatkarskie ze strefami 1–6 i siatką.
  - Oficjalne ustawienia systemu **5-1 PZPS/FIVB** dla rotacji **P1–P6** w fazach: **Przyjęcie**, **Obrona**, **Atak**, **Zagrywka**.
  - Płynny Drag & Drop zawodników i piłki w czasie rzeczywistym.
  - Narzędzia rysowania po boisku: ołówek, zakreślacz, strzałki kierunkowe, gumka, kolory i cofanie operacji.
  - Zapisywanie zrzutów taktycznych i przypisywanie ich do konkretnego meczu ligowego lub sparingu.
- **Playbook Trenerski & Scouting Rywali (`/coach`)**:
  - Baza zagrań taktycznych, wytyczne trenerskie dla danej rotacji.
  - Karty analizy rywali ligowych (scouting zagrywki, kierunków ataków skrzydłowych, słabych punktów w przyjęciu).
  - Baza materiałów taktycznych (PDF-y i grafiki) z natychmiastowym podglądem.

### 6. 🛡️ Centrum Administracji & Role (`/admin`)
- **Hierarchia i Role Kadry**:
  - **Kierownik / Kapitan (Łukasz Kremer #17)**: Pełne uprawnienia zarządzania klubem + pełne uprawnienia zawodnika (gra w meczach, obecności, składki).
  - **Trener (Hubert Obara #12)**: Zarządzanie taktyką, szóstką wyjściową, protokołami meczowymi i frekwencją.
  - **Zawodnik**: Deklaracje obecności, opłacanie składek BLIK, wgląd w analizy taktyczne i statystyki.
- **Granularna Macierz Uprawnień**:
  - Indywidualne przełączniki uprawnień per użytkownik: mecze ligowe, sparingi, statystyki VolleyStation, taktyka, finanse, komunikaty, ankiety, uprawnienia administratora.
  - Presety ról: *Kapitan*, *Asystent Trenera*, *Kierownik*.

### 7. 🗄️ System Archiwizacji Sezonów & Tryb Historyczny
- **Zamknięcie Sezonu**:
  - Bezpieczne zarchiwizowanie całego sezonu do niezmiennego zrzutu (mecze, statystyki punktowe, protokoły, taktyki, obecności, finanse, zdjęcia i skład).
  - Wyliczenie podsumowania sezonu: MVP, król strzelców, bilans meczów, łączna liczba punktów i pozycja w tabeli.
  - Zresetowanie terminarza do czystego stanu na nowy sezon (konta zawodników i hasła pozostają aktywne).
- **Przeglądanie Całego Serwisu w Trybie Archiwalnym (`isArchiveMode`)**:
  - Kliknięcie *Przeglądaj cały serwis w tym sezonie* przełącza aplikację w stan wybranego sezonu – wszystkie podstrony (`/rozgrywki`, `/events`, `/fees`, `/team`, `/taktyka`) serwują zamrożone dane historyczne.
  - **Ścisła Blokada Edycji (Read-Only)**: Formularze dodawania, edycji, deklaracji obecności, płatności BLIK i rysowania są wyłączone, a próby modyfikacji blokowane na poziomie API (403 Forbidden).
  - Wyjście z archiwum natychmiast przywraca bieżący sezon 2026/2027 bez jakichkolwiek zmian ani utraty danych.

---

## 🚀 Uruchomienie Projektu

### Wymagania
- Node.js (wersja 18.x lub nowsza)
- npm / yarn / pnpm

### Instalacja i Start

```bash
# 1. Klonowanie repozytorium lub wejście do katalogu projektu:
cd VOLLEY

# 2. Instalacja zależności:
npm install

# 3. Uruchomienie serwera deweloperskiego:
npm run dev

# 4. Lub kompilacja i start wersji produkcyjnej:
npm run build
npm start
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

---

## 🔐 Logowanie i Dostęp

Domyślne hasło dla kont w systemie: `haslo123`

| Rola / Użytkownik | Adres E-mail | Uprawnienia |
|---|---|---|
| **Łukasz Kremer (Kapitan & Kierownik #17)** | `kierownik@volley.pl` / `lukasz.kremer@volley.pl` | Pełny zarząd klubem, finanse, mecze, taktyka + konto zawodnika |
| **Hubert Obara (Trener #12)** | `trener@volley.pl` | Prowadzenie spotkań, skład wyjściowy, frekwencja, taktyka i scouting |
| **Kamil Pujanek (Zawodnik #4)** | `kamil.pujanek@volley.pl` | Profil zawodnika, składki BLIK, deklaracje, wgląd w taktykę |
| **Tomasz Krupa (Zawodnik #1)** | `tomasz.krupa@volley.pl` | Profil zawodnika, składki BLIK, deklaracje |

W systemie dostępna jest również otwarta rejestracja dla nowych zawodników w zakładce `/register`.

---

## 📁 Struktura Katalogów

```
VOLLEY/
├── data/
│   └── db.json               # Główny magazyn danych JSON (użytkownicy, mecze, sparingi, taktyka, finanse, archiwa)
├── public/
│   ├── logo.jpg              # Oficjalne logo drużyny Angels ZTP
│   ├── lals_logo.png         # Logo rozgrywek LALS
│   ├── manifest.json         # Konfiguracja PWA
│   └── ...
├── src/
│   ├── app/
│   │   ├── admin/            # Centrum administracji, role i archiwizacja sezonów
│   │   ├── coach/            # Panel trenerski, playbook i scouting rywali
│   │   ├── events/           # Terminarz i dziennik obecności treningowej
│   │   ├── fees/             # Składki, płatności BLIK i skarbiec drużyny
│   │   ├── login/            # Logowanie do systemu
│   │   ├── matches/          # Przekierowanie do modułu ligowego
│   │   ├── register/         # Rejestracja nowego zawodnika
│   │   ├── rozgrywki/        # Główny moduł: Sparingi, Liga LALS, Turnieje, VolleyStation
│   │   ├── taktyka/          # Interaktywna tablica taktyczna z rysowaniem i systemem 5-1
│   │   ├── team/             # Kadra zespołu, profile zawodników i statystyki
│   │   ├── layout.tsx        # Główny layout aplikacji z bannerem trybu archiwalnego
│   │   ├── page.tsx          # Główny pulpit (Dashboard)
│   │   └── api/              # Trasy API (mecze, obecności, BLIK, uprawnienia, archiwa)
│   ├── components/           # Komponenty współdzielone (Navbar, ArchiveModeBanner, PWA)
│   ├── context/              # Konteksty React (AuthContext)
│   └── lib/                  # Baza danych (db.ts), typy (types.ts), parser VolleyStation, kontekst archiwum
└── package.json
```

---

## 🏆 Licencja & Prawa Autorskie
System stworzony na potrzeby klubu siatkarskiego **Angels ZTP**. Wszelkie prawa zastrzeżone.
