# Angels ZTP - System Zarządzania Drużyną Siatkarską 🏐

Zaawansowana, nowoczesna aplikacja internetowa (PWA) dedykowana drużynie siatkarskiej **Angels ZTP** rywalizującej w Lubońskiej Amatorskiej Lidze Siatkówki (**LALS**). System łączy kompleksowe zarządzanie meczami ligowymi, statystykami VolleyStation, deklaracjami obecności na zbiórkach, finansami i składkami (BLIK), interaktywną tablicą taktyczną 5-1 (pionową/poziomą) oraz niezmiennym archiwum sezonów.

---

## ☁️ Baza Danych & Chmura (MongoDB) – Po co to jest?

Często pojawia się pytanie: **po co w ogóle w projekcie jest zakładka „Baza Danych & Chmura (MongoDB)”, skoro na komputerze wszystko zapisuje się w pliku `data/db.json`?**

Oto proste i konkretne wyjaśnienie:

### 1. Kiedy wystarcza zwykły plik lokalny (`data/db.json`)?
* **Działanie lokalne na komputerze**: Jeśli uruchamiasz aplikację komendą `npm run dev` na swoim laptopie/komputerze, baza danych w pliku `data/db.json` działa w 100% wystarczająco. Nie musisz nic konfigurować, nie potrzebujesz konta ani połączenia z internetem.

### 2. Dlaczego plik `db.json` NIE wystarcza, gdy wrzucisz stronę do sieci? (Problem hostingu)
* Gdy zechcesz udostępnić aplikację całej drużynie, aby każdy zawodnik mógł wejść na stronę ze swojego telefonu (np. na darmowym hostingu **Vercel**, **Netlify**, **Render** czy **Railway**), pojawia się problem:
  * Serwery w chmurze (tzw. *serverless*) **nie mają trwałego dysku twardego**.
  * Przy każdym restarcie serwera, uśpieniu lub wgraniu nowej wersji kodu (deploy), lokalny plik `data/db.json` **wraca do stanu początkowego** z repozytorium. Wszelkie nowe mecze, potwierdzenia obecności czy wpłacone składki mogłyby w ten sposób bezpowrotnie zniknąć!

### 3. Co daje MongoDB Atlas? (Rozwiązanie w 100% darmowe)
* **Trwałość danych w sieci**: Wszystkie mecze, głosy obecności, statystyki i finanse są bezpiecznie zapisywane w zewnętrznej chmurze. Restart hostingu nigdy nie skasuje danych.
* **Synchronizacja w czasie rzeczywistym**: Gdy kierownik doda mecz na laptopie, zawodnicy od razu widzą go w swoich telefonach.
* **Darmowy plan M0 (Free forever)**: MongoDB Atlas oferuje darmowy klaster 512 MB – dla drużyny siatkarskiej wystarczy to na wiele lat bez płacenia ani grosza.
* **Automatyczny import (Auto-seed)**: Gdy pierwszy raz podepniesz link `MONGODB_URI`, aplikacja sama automatycznie prześle wszystkie dotychczasowe dane z `db.json` do chmury!

> [!NOTE]
> **Podsumowując:**
> * Używasz programu **tylko na swoim komputerze**? &rarr; **Zignoruj MongoDB**. Zwykły plik `data/db.json` załatwia wszystko.
> * Wrzucasz stronę **do internetu dla całej drużyny na telefony**? &rarr; **Wepnij MongoDB Atlas** (poniżej instrukcja 3-minutowa), aby dane nie znikały.

---

### 🛠️ Jak podpiąć darmowe MongoDB Atlas (Krok po kroku):

1. Załóż darmowe konto na **[mongodb.com/atlas](https://www.mongodb.com/atlas)** i wybierz darmowy klaster **M0 (Free)**.
2. W menu **Database Access** stwórz użytkownika bazy i hasło (np. `angels_admin`).
3. W menu **Network Access** kliknij *Add IP Address* &rarr; wybierz **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Kliknij **Connect** &rarr; **Drivers (Node.js)** i skopiuj wygenerowany adres połączenia.
5. Wklej ten link do pliku `.env.local` na komputerze (lub w panelu Vercel w *Settings &rarr; Environment Variables*):
   ```env
   MONGODB_URI=mongodb+srv://twoj_uzytkownik:twoje_haslo@cluster0.xxx.mongodb.net/angels_ztp?retryWrites=true&w=majority
   ```
6. Gotowe! System sam automatycznie wykryje połączenie i zsynchronizuje dane. Stan synchronizacji i przyciski wymuszenia kopii znajdziesz w panelu `/admin` w zakładce **Baza Danych & Chmura (MongoDB)**.

---

## 🛡️ Kopie Zapasowe & Bezpieczeństwo Danych (Gwarancja braku utraty)

W aplikacji wdrożono wielopoziomowy system ochrony danych, dzięki któremu **nie ma ryzyka przypadkowej utraty meczów, punktów, taktyki czy rozliczeń**:

1. **Automatyczna kopia przed każdym zapisem (`data/db.backup.json`)**:
   * Zanim jakakolwiek operacja (dodanie wyniku, modyfikacja taktyki, wpłata składki) nadpisze plik `db.json`, system automatycznie zabezpiecza dotychczasowy stan w pliku lustrzanym `db.backup.json`.
2. **Cykliczne migawki na dysku (`data/backups/`)**:
   * Co 30 minut aktywnego korzystania tworzony jest datowany plik (np. `backup_2026-11-14_14-15_auto.json`). System przechowuje historię ostatnich 20 punktów przywracania.
3. **Autoodzyskiwanie przy awarii**:
   * Jeśli plik `db.json` kiedykolwiek zostałby uszkodzony lub pusty, serwer automatycznie wykrywa błąd i samoczynnie odzyskuje bazę z najświeższej kopii zapasowej.
4. **Pobieranie kopii zapasowej 1-kliknięciem (`/admin` -> Baza Danych)**:
   * W panelu administratora znajdziesz przycisk **`📥 Pobierz Backup (JSON)`**, który w każdej chwili zapisuje pełny plik bazy bezpośrednio na dysk Twojego komputera.
5. **Przywracanie stanu z pliku lub listy punktów**:
   * W każdej chwili możesz cofnąć stan bazy klikając **`Przywróć ten punkt`** na liście w `/admin` lub wgrywając pobrany wcześniej plik JSON przyciskiem **`📤 Przywróć z pliku`**.
6. **Lokalna historia w systemie Git**:
   * Wszystkie oficjalne dane są dodatkowo zabezpieczone w lokalnym repozytorium kodu.

---

## ⚡ Stos Technologiczny

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Język**: [TypeScript](https://www.typescriptlang.org/) (ścisłe statyczne typowanie)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) w dedykowanej estetyce **Athletic Light Mode** (czysty, kontrastowy, nowoczesny motyw sportowy z dynamicznymi akcentami)
- **Ikony**: [Lucide React](https://lucide.dev/)
- **Baza danych**: Hybrydowy magazyn – lokalny plik JSON (`data/db.json`) + automatyczne wsparcie dla darmowej chmury **MongoDB Atlas**.
- **PWA & Mobile**: Obsługa instalacji jako aplikacja natywna na telefonie (Web App Manifest, responsywny pasek nawigacji bez obcinania przycisków na tabletach i smartfonach).

---

## 🎯 Główne Moduły Aplikacji

### 1. 🏠 Nowy Pulpit Drużyny (`/`)
* **Mecz na szczycie (Match of the Day)**: Wyróżniony banner najbliższego meczu z odliczaniem i deklaracją obecności 1-kliknięciem (`Będę 🟢`, `Może 🟡`, `Nie 🔴`) oraz szybkim przejściem do założeń taktycznych.
* **Tabela LALS Faza I na żywo**: Pełna tabela 7 zespołów z wyróżnieniem strefy bezpośredniego awansu do Finałów (Top 3) oraz podświetleniem pozycji Angels ZTP.
* **Ostatni wynik & Terminarz spotkań**: Ostatnie mecze ligowe (w tym 3:0 z Volleyboars) oraz kolejne spotkania w terminarzu.
* **Liderzy punktowi zespołu**: Oficjalne statystyki punktowe zawodników Angels ZTP z ligi.
* **Status składek & Kadra**: Szybki podgląd stanu rozliczeń i nominalnych pozycji zespołu.

### 2. 🏆 Liga LALS & Rozgrywki (`/rozgrywki`)
* **Oficjalne dane VolleyStation**:
  * Pełny terminarz 21 spotkań ligowych rund 2–18.
  * Tabela Fazy I (7 drużyn, punkty, bilans setów i małych punktów, forma).
  * Ranking indywidualny ligi (76 sklasyfikowanych zawodników).
  * Protokoły meczowe z dokładnymi punktami zawodników (**ABS, Ata, Blk, Ser**).
* **Zarządzanie Fazami Ligi**:
  * Przycisk `[ + Nowa Tabela ]` umożliwiający utworzenie nowej fazy rozgrywek (np. Faza Finałowa) i wklejenie nowego zestawienia bez konfliktu z Fazą I.
  * Moduł meczów sparingowych i turniejów.

### 3. 🎨 Tablica Taktyczna 5-1 (`/taktyka`)
* **Orientacja Pionowa & Pozioma**:
  * `[ 📱 Pionowo ]` – idealne na smartfony i tablety przy linii bocznej boiska.
  * `[ 🖥️ Poziomo ]` – klasyczny widok panoramiczny na laptopy i rzutniki.
  * Inteligentna transformacja współrzędnych 1-do-1 między oboma trybami bez gubienia pozycji zawodników.
* **System 5-1**:
  * Domyślne oficjalne ustawienia dla rotacji **P1–P6** w fazach: **Przyjęcie**, **Obrona**, **Atak**, **Zagrywka**.
* **Płynny Drag & Drop**:
  * Przesuwanie zawodników ze składu, piłki i rywali w czasie rzeczywistym.
  * Narzędzia rysowania pisakiem, strzałki, kasowanie i zapisywanie schematów z przypisaniem do meczu.

### 4. 📅 Terminarz & Obecności (`/events`)
* Terminarz meczów ligowych z automatycznym wyliczaniem frekwencji.
* Deklaracje obecności zawodników przed każdym spotkaniem.
* Pełna responsywność na ekranach monitorów, tabletów i telefonów (brak uciekających przycisków).

### 5. 💳 Składki & Kasa Drużyny (`/fees`)
* **Zarządzanie i usuwanie składek**:
  * Możliwość zdefiniowania nowej składki klubowej.
  * Przycisk `[ Zarządzaj składkami ]` oraz ikony kosza `[ 🗑️ ]` do bezproblemowego usuwania błędnie wprowadzonych składek.
  * Przycisk cofnięcia `[ ↺ ]` w przypadku omyłkowego oznaczenia wpłaty zawodnika.
* **Płatność symulatorem BLIK** oraz generowanie potwierdzeń PDF.
* **Kasa drużyny**: Ewidencja wpływów i wydatków z możliwością usuwania wpisów.

### 6. 👥 Oficjalna Kadra Angels ZTP (`/team`)
15 oficjalnie zarejestrowanych siatkarzy zespołu:
* **#1 Tomasz Krupa** – Przyjmujący
* **#4 Kamil Pujanek** – Rozgrywający
* **#5 Tomasz Żądło** – Libero
* **#7 Piotr Graczyk** – Przyjmujący
* **#8 Michał Śmigiel** – Środkowy
* **#10 Dominik Kruk** – Środkowy
* **#11 Paweł Kulupa** – Środkowy
* **#12 Hubert Obara** – Przyjmujący (Trener)
* **#17 Łukasz Kremer** – Przyjmujący (Kapitan & Kierownik)
* **#18 Vikhyath Shetty** – Rozgrywający
* **#28 Karol Ordon** – Atakujący
* **#47 Maciej Noak** – Środkowy
* **#55 Stanisław Suwalski** – Środkowy
* **#91 Wit Król** – Atakujący
* **#97 Bartosz Augustynek** – Atakujący

### 7. 🛡️ Panel Administratora & Archiwum (`/admin`)
* Granularne uprawnienia per użytkownik (zarządzanie meczami, finansami, taktyką).
* Zarządzanie synchronizacją z chmurą MongoDB Atlas.
* Niezmienny mechanizm archiwizacji sezonów (zabezpieczenie historycznych wyników przed modyfikacją).

---

## 🚀 Uruchomienie Aplikacji

### Wymagania
* Node.js (wersja 18.x lub nowsza)
* npm / pnpm / yarn

### Start w trybie deweloperskim:
```bash
# Wejście do katalogu projektu:
cd VOLLEY

# Instalacja zależności (jeśli jeszcze nie zainstalowano):
npm install

# Start serwera:
npm run dev
```
Aplikacja uruchomi się pod adresem: **http://localhost:3000**

---

## 🔐 Logowanie do Systemu

Domyślne hasło dla kont zawodników: `haslo123`

| Rola / Zawodnik | Adres E-mail | Zakres Uprawnień |
|---|---|---|
| **Łukasz Kremer (#17)** | `lukasz.kremer@angelsztp.pl` / `kierownik@volley.pl` | **Kapitan & Kierownik (Pełne uprawnienia):** mecze ligowe, tabele LALS, sparingi, finanse/BLIK, taktyka, zarządzanie kadrą, admin |
| **Kamil Pujanek (#4)** | `kamil.pujanek@angelsztp.pl` / `kamil.pujanek@volley.pl` | **Administrator & Rozgrywający (Pełne uprawnienia):** identyczne najwyższe uprawnienia jak Kierownik (zarządzanie ligą, finansami, kadrą i panelem admina) |
| **Hubert Obara (#12)** | `hubert.obara@angelsztp.pl` / `trener@volley.pl` | **Trener (Sztab szkoleniowy):** tworzenie taktyki (P1-P6), rozpiski treningów i sparingów, akceptacja wniosków graczy i nadawanie im uprawnień edycji. *Brak dostępu do dodawania/edycji oficjalnych meczów ligowych i kasy drużyny.* |
| **Zawodnicy kadry (np. Tomasz Krupa #1, Piotr Graczyk #7...)** | Zgodnie z profilem w `/team` | **Zawodnik (Najmniejsze uprawnienia):** podgląd założeń taktycznych (tylko odczyt / brudnopis), wysyłanie wniosków i próśb o edycję do trenera, deklaracje obecności, opłacanie składek BLIK. |

---

## 🏆 Licencja
System stworzony na potrzeby drużyny siatkarskiej **Angels ZTP**. Wszelkie prawa zastrzeżone.
