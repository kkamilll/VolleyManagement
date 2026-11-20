# 🏐 Angels ZTP — System Zarządzania Drużyną Siatkarską

Nowoczesna aplikacja webowa (otwierana bezpośrednio z linku na telefonie, tablecie i komputerze) stworzona dla drużyny siatkarskiej **Angels ZTP**, rywalizującej w Lubońskiej Amatorskiej Lidze Siatkówki (**LALS**).

Projekt łączy w jednym miejscu **centrum meczowe, statystyki VolleyStation, terminarz z frekwencją, interaktywną tablicę taktyczną, plany treningowe, galerię zdjęć, finanse (BLIK) oraz panel administracyjny z archiwum sezonów** — utrzymane w spójnej, klubowej identyfikacji wizualnej **Angels Navy & Gold**.

---

## ✨ Najważniejsze Możliwości

### 🏠 1. Pulpit Drużyny (`/`)
* **Stadionowa Karta Meczu Dnia (Matchday Hero):** Ciemnogranatowy baner najbliższego meczu z herbami obu drużyn, datą, halą, deklaracją obecności jednym kliknięciem (`Będę`, `Może`, `Nieobecny`) oraz bezpośrednim przejściem do taktyki.
* **Kolejne Terminy:** Zwięzły kalendarz nadchodzących wydarzeń wraz ze statusem obecności zawodnika.
* **Status Składek & Komunikaty Sztabu:** Przejrzysty wskaźnik stanu rozliczeń oraz przypięte ogłoszenia przedmeczowe.

### 🏆 2. Rozgrywki — Liga LALS, Sparingi i Turnieje (`/rozgrywki`)
* **Integracja z danymi VolleyStation:** Tabela ligowa, terminarz rund, wyniki setowe, protokoły meczowe i statystyki indywidualne (**ABS, Ata, Blk, Ser**).
* **Herby Drużyn i Rywali:** Dedykowany menedżer herbów (upload pliku z automatyczną kompresją lub link URL) wyświetlanych w tabeli, terminarzu, sparingach i na Pulpicie.
* **Zarządzanie Fazami Rozgrywek:** Tworzenie kolejnych etapów (np. Faza Zasadnicza / Faza Finałowa), import i edycja tabeli.
* **Sparingi & Turnieje:** Dedykowane zakładki z wynikami, generatorem wyjściowej szóstki oraz raportami na czat drużynowy.

### 🎯 3. Taktyka & Rozpiski (`/taktyka`)
* **Interaktywna Tablica Taktyczna:**
  * Płynne przesuwanie zawodników, piłki i rywali (Drag & Drop), rysowanie strzałek i schematów pisakiem.
  * Przełącznik fazy gry (**Przyjęcie, Obrona, Atak, Zagrywka**) oraz szybka zamiana **Libero (L) ⇄ Środkowy (Ś)** w II linii.
  * Tryb **Pionowy** (wygodny na telefon przy linii bocznej) i **Poziomy** (na laptopy i rzutniki) z automatycznym przeliczaniem pozycji.
* **Rozpiski Meczowe, Sparingi, Turnieje i Treningi:**
  * Wybór konkretnego spotkania w stylowym selektorze, dodawanie notatek i odpraw przedmeczowych, szybkich szkiców, wideo analiz rywala (YouTube) oraz zdjęć/PDF.

### 📅 4. Terminarz & Obecności (`/events`)
* Jednolity harmonogram meczów ligowych, sparingów, treningów i turniejów z podglądem frekwencji.
* Filtry typu i czasu wydarzeń, szybkie deklaracje obecności oraz wytyczne trenerskie pod każdą jednostką.

### 🏐 5. Treningi & Konspekty (`/trening`)
* Biblioteka ćwiczeń z opisami, punktami kluczowymi wykonania, linkami do materiałów wideo oraz dyskusją drużyny.

### 📸 6. Galeria Zdjęć & Fotorelacje (`/galeria`)
* Albumy i serie zdjęć z meczów ligowych, sparingów i turniejów z filtrowaniem kategorii i podglądem pełnoekranowym.

### 💳 7. Składki & Kasa Drużyny (`/fees`)
* Ewidencja składek zawodników z szybką płatnością BLIK, weryfikacją wpłat, możliwością cofnięcia statusu oraz rejestrem wpływów i wydatków klubowych.

### 👥 8. Kadra Drużyny (`/team`)
* Profile zawodników i sztabu szkoleniowego z numerami, pozycjami, statystykami, notatkami trenerskimi oraz filtrowaniem po pozycji.

### 🛡️ 9. Panel Administratora & Archiwum (`/admin`)
* Granularne uprawnienia użytkowników (zarządzanie meczami, finansami, taktyką, rolami).
* **Archiwum Sezonów:** Niezmienny zapis historycznych sezonów i generowanie raportu sezonu (`/admin/raport-sezonu`).
* **Kopie Zapasowe & Chmura:** Pobieranie/przywracanie backupu JSON oraz panel synchronizacji z MongoDB Atlas.

---

## 🎨 Wygląd i Ergonomia (Mobile-First Web)

* **Identyfikacja Angels Navy & Gold:** Głęboki granat ligowy (`#0f172a`), szlachetne złoto (`#f59e0b`) i czysta biel kart.
* **Sportowa typografia:** Fonty **`Outfit`** (nagłówki) oraz **`Plus Jakarta Sans`** (interfejs) + wyjustowany, równy skład opisów i odpraw (`.text-justified-clean`).
* **Wygoda na telefonie:** Powiększone cele dotykowe (40–44 px), symetryczne siatki przycisków i dolny pasek nawigacji mobilnej (`BottomNav`).

---

## ⚡ Stos Technologiczny

| Warstwa | Technologia |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Język** | [TypeScript](https://www.typescriptlang.org/) |
| **Stylowanie** | [Tailwind CSS](https://tailwindcss.com/) + Google Fonts (`Outfit`, `Plus Jakarta Sans`) |
| **Ikony** | [Lucide React](https://lucide.dev/) |
| **Baza danych** | Hybrydowa: lokalny JSON (`data/db.json`) + chmura **MongoDB Atlas** |
| **Narzędzia dodatkowe** | `bcryptjs`, `jsonwebtoken`, `xlsx`, `tesseract.js`, `canvas-confetti` |

---

## 🚀 Uruchomienie Lokalne

### Wymagania
* **Node.js** 18.x lub nowszy
* **npm**

### Kroki
```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera deweloperskiego
npm run dev
```

Aplikacja będzie dostępna pod adresem: **[http://localhost:3000](http://localhost:3000)**

### Budowanie wersji produkcyjnej
```bash
npm run build
npm run start
```

---

## ☁️ Baza Danych: Plik Lokalny vs MongoDB Atlas

* **Praca lokalna (`npm run dev`):** System korzysta z pliku `data/db.json` — działa od razu bez żadnej konfiguracji. Przed każdym zapisem tworzona jest automatyczna kopia `data/db.backup.json` oraz cykliczne migawki w `data/backups/`.
* **Publikacja w sieci (Vercel / Render / Railway):** Hostingi chmurowe resetują lokalne pliki przy każdym restarcie/deployu. Aby dane drużyny były trwałe i synchronizowane w czasie rzeczywistym na telefonach wszystkich zawodników, podepnij darmowy klaster **MongoDB Atlas (M0 Free)**:
  1. Załóż darmowy klaster na [mongodb.com/atlas](https://www.mongodb.com/atlas), utwórz użytkownika w *Database Access* i zezwól na dostęp (`0.0.0.0/0`) w *Network Access*.
  2. Skopiuj connection string (Drivers → Node.js) i dodaj zmienną środowiskową w `.env.local` lub w panelu hostingu:
     ```env
     MONGODB_URI=mongodb+srv://<uzytkownik>:<haslo>@<klaster>.mongodb.net/angels_ztp?retryWrites=true&w=majority
     ```
  3. Przy pierwszym uruchomieniu system samoczynnie wykryje bazę i zsynchronizuje dane.

---

## 🔐 Role i Uprawnienia w Systemie

Domyślne hasło startowe dla kont testowych: `haslo123`

| Rola | Przykładowe Konta | Zakres Uprawnień |
|---|---|---|
| **Kapitan & Kierownik / Admin** | `lukasz.kremer@angelsztp.pl`, `kamil.pujanek@angelsztp.pl` | Pełny dostęp: mecze ligowe, tabele LALS, herby, sparingi, finanse/BLIK, taktyka, kadra, panel `/admin` i archiwum sezonów |
| **Trener** | `hubert.obara@angelsztp.pl` | Tablica taktyczna, rozpiski meczowe i treningowe, akceptacja wniosków zawodników |
| **Zawodnik** | Konta zawodników z `/team` | Podgląd taktyki i terminarza, deklaracje obecności, opłacanie składek BLIK, galeria i statystyki |

---

## 🏆 Licencja

Projekt stworzony na wyłączny użytek drużyny siatkarskiej **Angels ZTP**. Wszelkie prawa zastrzeżone.
