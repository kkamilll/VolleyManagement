import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { AppDatabase, User, MatchResult, EventItem, Fee, FeePayment, LeagueMatchReport, TacticalPlay, ScoutingReport, SeasonArchive } from './types';
import { parseVolleyStation } from './volleystation-parser';
import { getMongoDb, isMongoConfigured } from './mongodb';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const SEED_VOLLEYSTATION_RAW = `[GGladiatorzy BUD-WENT](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237370-178/)
Nr
Zawodnik
ABS
Ata
Blk
Ser
Bł. przec.
1
[Igor Mianowany](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501168/)7
7
0
0
5
[Jakub Świerczyński](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501172/)9
9
0
0
9
[Bogdan Voropai](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501025/)19
17
1
1
14
[Michał Stelmaszyk](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246329/)18
16
1
1
21
[Wojciech Nowak](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246328/)4
4
0
0
24
[Cyprian Michalak](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2869864/)3
1
1
1
27
[Piotr Chlebowski](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3260472/)12
5
7
0
R
Razem
72
59
10
3
36
[AAngels ZTP](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/)
Nr
Zawodnik
ABS
Ata
Blk
Ser
Bł. przec.
1
[Tomasz Krupa](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501166/)5
4
0
1
4
[Kamil Pujanek](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500846/)3
0
3
0
8
[Michał Śmigiel](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500853/)10
7
2
1
17
[Łukasz Kremer](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500843/)19
17
1
1
28
[Karol Ordon](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501155/)3
2
1
0
47
[Maciek Noak](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500845/)8
5
2
1
97
[Bartosz Augustynek](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2524996/)6
4
2
0
R
Razem
54
39
11
4
48`;

function getInitialData(): AppDatabase {
  const defaultPasswordHash = bcrypt.hashSync('haslo123', 8);

  const users: User[] = [
    {
      id: 'usr_kierownik',
      email: 'kierownik@volley.pl',
      name: 'Marek Wiśniewski',
      role: 'KIEROWNIK',
      position: 'Zarząd',
      phone: '+48 601 234 567',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'usr_trener',
      email: 'trener@volley.pl',
      name: 'Tomasz Lewandowski',
      role: 'TRENER',
      position: 'Sztab trenerski',
      phone: '+48 602 345 678',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'usr_zawodnik_1',
      email: 'zawodnik@volley.pl',
      name: 'Jan Kowalski',
      role: 'ZAWODNIK',
      number: 7,
      position: 'Przyjmujący',
      height: 194,
      phone: '+48 501 111 222',
      status: 'Aktywny',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-05T12:00:00Z',
    },
    {
      id: 'usr_zawodnik_2',
      email: 'piotr@volley.pl',
      name: 'Piotr Zieliński',
      role: 'ZAWODNIK',
      number: 10,
      position: 'Rozgrywający',
      height: 188,
      phone: '+48 502 222 333',
      status: 'Aktywny',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-05T12:00:00Z',
    },
    {
      id: 'usr_zawodnik_3',
      email: 'michal@volley.pl',
      name: 'Michał Kaczmarek',
      role: 'ZAWODNIK',
      number: 4,
      position: 'Atakujący',
      height: 198,
      phone: '+48 503 333 444',
      status: 'Aktywny',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-06T12:00:00Z',
    },
    {
      id: 'usr_zawodnik_4',
      email: 'bartek@volley.pl',
      name: 'Bartosz Wójcik',
      role: 'ZAWODNIK',
      number: 1,
      position: 'Środkowy',
      height: 202,
      phone: '+48 504 444 555',
      status: 'Aktywny',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-06T12:00:00Z',
    },
    {
      id: 'usr_zawodnik_5',
      email: 'kamil@volley.pl',
      name: 'Kamil Mazur',
      role: 'ZAWODNIK',
      number: 13,
      position: 'Libero',
      height: 182,
      phone: '+48 505 555 666',
      status: 'Aktywny',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-07T12:00:00Z',
    },
    {
      id: 'usr_zawodnik_6',
      email: 'adam@volley.pl',
      name: 'Adam Nowak',
      role: 'ZAWODNIK',
      number: 9,
      position: 'Przyjmujący',
      height: 192,
      phone: '+48 506 666 777',
      status: 'Kontuzjowany',
      passwordHash: defaultPasswordHash,
      createdAt: '2026-09-07T12:00:00Z',
    }
  ];

  const matches: MatchResult[] = [
    {
      id: 'mat_1',
      opponent: 'Gladiatorzy BUD-WENT',
      date: '2026-10-28T18:30:00Z',
      location: 'Hala OSiR, ul. Sportowa 5',
      isHome: true,
      matchType: 'Mecz ligowy',
      sets: [
        { setNumber: 1, teamScore: 25, opponentScore: 21 },
        { setNumber: 2, teamScore: 23, opponentScore: 25 },
        { setNumber: 3, teamScore: 25, opponentScore: 18 },
        { setNumber: 4, teamScore: 25, opponentScore: 22 }
      ],
      teamSetsWon: 3,
      opponentSetsWon: 1,
      mvp: 'Bogdan Voropai (19 pkt)',
      notes: 'Świetna skuteczność w ataku (59 pkt) oraz 10 udanych bloków punktowych.',
      coachComments: 'Dobra koncentracja w końcówce 4. seta.',
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-10-28T21:00:00Z',
      reportId: 'rep_seed_1'
    },
    {
      id: 'mat_2',
      opponent: 'Angels ZTP',
      date: '2026-10-21T19:00:00Z',
      location: 'Hala Polonia, Częstochowa',
      isHome: false,
      matchType: 'Mecz ligowy',
      sets: [
        { setNumber: 1, teamScore: 20, opponentScore: 25 },
        { setNumber: 2, teamScore: 25, opponentScore: 19 },
        { setNumber: 3, teamScore: 25, opponentScore: 23 },
        { setNumber: 4, teamScore: 21, opponentScore: 25 },
        { setNumber: 5, teamScore: 15, opponentScore: 12 }
      ],
      teamSetsWon: 3,
      opponentSetsWon: 2,
      mvp: 'Michał Kaczmarek (Atakujący)',
      notes: 'Horror w tie-breaku wygrany po dwóch blokach Bartosza Wójcika!',
      coachComments: 'Brawa za walkę i niepoddawanie się przy stanie 1:2 w setach.',
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-10-21T22:15:00Z'
    },
    {
      id: 'mat_3',
      opponent: 'Sparta Warszawa',
      date: '2026-10-14T17:00:00Z',
      location: 'Hala OSiR, ul. Sportowa 5',
      isHome: true,
      matchType: 'Sparing',
      sets: [
        { setNumber: 1, teamScore: 25, opponentScore: 17 },
        { setNumber: 2, teamScore: 25, opponentScore: 20 },
        { setNumber: 3, teamScore: 25, opponentScore: 16 }
      ],
      teamSetsWon: 3,
      opponentSetsWon: 0,
      mvp: 'Piotr Zieliński (Rozgrywający)',
      notes: 'Dominacja na siatce, przetestowane różne warianty rozegrania ze środkowymi.',
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-10-14T19:30:00Z'
    }
  ];

  const events: EventItem[] = [
    {
      id: 'evt_1',
      title: 'Mecz Sparingowy przed rundą rewanżową',
      type: 'SPARING',
      date: '2026-11-12T19:00:00',
      location: 'Hala Sportowa OSiR, ul. Sportowa 5',
      opponent: 'Trefl Gdańsk II',
      description: 'Oficjalny sparing kontrolny. Zbiórka w szatni o godzinie 18:00, rozgrzewka startuje 18:20. Gramy 4 pełne sety bez względu na wynik.',
      costPerPerson: 0,
      attendees: [
        { userId: 'usr_zawodnik_1', userName: 'Jan Kowalski', userRole: 'ZAWODNIK', userNumber: 7, position: 'Przyjmujący', status: 'BEDE', updatedAt: '2026-11-01T12:00:00Z' },
        { userId: 'usr_zawodnik_2', userName: 'Piotr Zieliński', userRole: 'ZAWODNIK', userNumber: 10, position: 'Rozgrywający', status: 'BEDE', updatedAt: '2026-11-01T13:00:00Z' },
        { userId: 'usr_zawodnik_3', userName: 'Michał Kaczmarek', userRole: 'ZAWODNIK', userNumber: 4, position: 'Atakujący', status: 'BEDE', updatedAt: '2026-11-02T09:00:00Z' },
        { userId: 'usr_zawodnik_4', userName: 'Bartosz Wójcik', userRole: 'ZAWODNIK', userNumber: 1, position: 'Środkowy', status: 'NIEPEWNE', note: 'Kończę pracę o 18:30, dojadę na rozgrzewkę', updatedAt: '2026-11-02T10:00:00Z' },
        { userId: 'usr_zawodnik_5', userName: 'Kamil Mazur', userRole: 'ZAWODNIK', userNumber: 13, position: 'Libero', status: 'BEDE', updatedAt: '2026-11-02T11:00:00Z' },
        { userId: 'usr_zawodnik_6', userName: 'Adam Nowak', userRole: 'ZAWODNIK', userNumber: 9, position: 'Przyjmujący', status: 'NIE_BEDE', note: 'Rehabilitacja stawu skokowego', updatedAt: '2026-11-02T12:00:00Z' }
      ],
      lineup: {
        setter: 'Piotr Zieliński (#10)',
        opposite: 'Michał Kaczmarek (#4)',
        outsideHitters: ['Jan Kowalski (#7)', 'Wojciech Król (#11)'],
        middleBlockers: ['Bartosz Wójcik (#1)', 'Kacper Szymański (#8)'],
        libero: 'Kamil Mazur (#13)',
        reserves: ['Damian Lis (#5)', 'Artur Dąbrowski (#14)']
      },
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-01T10:00:00Z'
    },
    {
      id: 'evt_2',
      title: 'Ogólnopolski Turniej Siatkarski Niepodległości',
      type: 'TURNIEJ',
      date: '2026-11-21T09:00:00',
      endDate: '2026-11-21T18:00:00',
      location: 'Arena Ursynów, ul. Pileckiego 122, Warszawa',
      opponent: '8 zaproszonych drużyn (m.in. KPS Radom, AZS Politechnika, Volley Kraków)',
      description: 'Turniej jednodniowy z pucharami. Zależy na jaki turniej się zapiszemy, taki zagramy - ten ma formułę 2 grup po 4 zespoły z fazą pucharową.',
      costPerPerson: 50,
      attendees: [
        { userId: 'usr_zawodnik_1', userName: 'Jan Kowalski', userRole: 'ZAWODNIK', userNumber: 7, position: 'Przyjmujący', status: 'BEDE', updatedAt: '2026-11-02T14:00:00Z' },
        { userId: 'usr_zawodnik_2', userName: 'Piotr Zieliński', userRole: 'ZAWODNIK', userNumber: 10, position: 'Rozgrywający', status: 'BEDE', updatedAt: '2026-11-02T15:00:00Z' },
        { userId: 'usr_zawodnik_3', userName: 'Michał Kaczmarek', userRole: 'ZAWODNIK', userNumber: 4, position: 'Atakujący', status: 'BEDE', updatedAt: '2026-11-03T10:00:00Z' },
        { userId: 'usr_zawodnik_4', userName: 'Bartosz Wójcik', userRole: 'ZAWODNIK', userNumber: 1, position: 'Środkowy', status: 'BEDE', updatedAt: '2026-11-03T11:00:00Z' },
        { userId: 'usr_zawodnik_5', userName: 'Kamil Mazur', userRole: 'ZAWODNIK', userNumber: 13, position: 'Libero', status: 'BEDE', updatedAt: '2026-11-03T12:00:00Z' }
      ],
      tournamentMatches: [
        { id: 'tm_1', round: 'Faza grupowa - Mecz 1', teamA: 'VolleyTeam', teamB: 'KPS Radom', time: '09:30' },
        { id: 'tm_2', round: 'Faza grupowa - Mecz 2', teamA: 'VolleyTeam', teamB: 'Volley Kraków', time: '11:45' },
        { id: 'tm_3', round: 'Faza grupowa - Mecz 3', teamA: 'VolleyTeam', teamB: 'Siatkarz Wieluń', time: '14:00' },
        { id: 'tm_4', round: 'Półfinał A1 vs B2', teamA: 'TBD', teamB: 'TBD', time: '15:30' },
        { id: 'tm_5', round: 'Finał o 1. miejsce', teamA: 'TBD', teamB: 'TBD', time: '17:00' }
      ],
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdAt: '2026-11-02T09:00:00Z'
    }
  ];

  // Seed VolleyStation Report with the exact data the user provided!
  const parsedTeams = parseVolleyStation(SEED_VOLLEYSTATION_RAW);
  const leagueReports: LeagueMatchReport[] = [
    {
      id: 'rep_seed_1',
      matchTitle: `${parsedTeams[0]?.teamName || 'Gladiatorzy BUD-WENT'} vs ${parsedTeams[1]?.teamName || 'Angels ZTP'}`,
      date: '2026-11-02T19:30:00Z',
      rawText: SEED_VOLLEYSTATION_RAW,
      homeTeam: parsedTeams[0],
      awayTeam: parsedTeams[1],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-02T21:45:00Z',
      matchId: 'mat_1'
    }
  ];

  const announcements = [
    {
      id: 'ann_1',
      title: '🔥 Zmiana godziny czwartkowego treningu taktycznego',
      content: 'W najbliższy czwartek (06.11) trening przesuwamy z 19:00 na 20:15 z powodu sparingu juniorów. Skupimy się na przyjęciu zagrywki i rozegraniu z kontry. Obecność obowiązkowa dla całej kadry meczowej!',
      priority: 'PILNY' as const,
      category: 'TRENING' as const,
      isPinned: true,
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdByRole: 'TRENER' as const,
      createdAt: '2026-11-04T08:00:00Z',
      readBy: [
        { userId: 'usr_trener', userName: 'Tomasz Lewandowski', readAt: '2026-11-04T08:00:00Z' },
        { userId: 'usr_zawodnik_1', userName: 'Jan Kowalski', readAt: '2026-11-04T09:30:00Z' },
        { userId: 'usr_zawodnik_2', userName: 'Piotr Zieliński', readAt: '2026-11-04T10:15:00Z' }
      ]
    },
    {
      id: 'ann_2',
      title: '📋 Zbiórka i wyjazd busem na mecz z Gladiatorami BUD-WENT',
      content: 'Zbiórka pod Halą OSiR w sobotę o godzinie 15:45. Bus odjeżdża punktualnie o 16:00. Pamiętajcie o czarnych kompletach meczowych Angels ZTP oraz ważnych badaniach sportowych. Odprawa przedmeczowa w szatni o 18:00.',
      priority: 'WAZNY' as const,
      category: 'MECZ' as const,
      isPinned: false,
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdByRole: 'TRENER' as const,
      createdAt: '2026-11-03T16:00:00Z',
      readBy: [
        { userId: 'usr_trener', userName: 'Tomasz Lewandowski', readAt: '2026-11-03T16:00:00Z' },
        { userId: 'usr_zawodnik_1', userName: 'Jan Kowalski', readAt: '2026-11-03T17:00:00Z' }
      ]
    },
    {
      id: 'ann_3',
      title: '💳 Przypomnienie o składkach członkowskich za listopad',
      content: 'Bardzo prosimy o uregulowanie składek za listopad przez zakładkę Skarbiec Składek (dostępny szybki BLIK). Środki są przeznaczane na rezerwację hali i fizjoterapeutę.',
      priority: 'NORMALNY' as const,
      category: 'SPRAWY_KLUBOWE' as const,
      isPinned: false,
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdByRole: 'KIEROWNIK' as const,
      createdAt: '2026-11-01T12:00:00Z',
      readBy: [
        { userId: 'usr_kierownik', userName: 'Marek Wiśniewski', readAt: '2026-11-01T12:00:00Z' }
      ]
    }
  ];

  const polls = [
    {
      id: 'poll_1',
      question: 'W jaki dzień pasuje Wam dodatkowy trening motoryczny/siłownia przed ligą?',
      description: 'Chcemy dołożyć 1h motoryki tygodniowo pod okiem trenera przygotowania fizycznego.',
      options: [
        { id: 'opt_1', text: 'Wtorek 18:30 (przed treningiem na hali)', votes: ['usr_zawodnik_1', 'usr_zawodnik_2'] },
        { id: 'opt_2', text: 'Czwartek 17:30 (hala boczna)', votes: ['usr_zawodnik_3'] },
        { id: 'opt_3', text: 'Sobota 10:00 (poranny rozruch i prewencja kontuzji)', votes: ['usr_zawodnik_4', 'usr_zawodnik_5'] }
      ],
      allowMultiple: false,
      expiresAt: '2026-11-15T23:59:59Z',
      isActive: true,
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdByRole: 'TRENER' as const,
      createdAt: '2026-11-02T10:00:00Z'
    },
    {
      id: 'poll_2',
      question: 'Wybór motywu na drugi komplet strojów meczowych:',
      description: 'Głosowanie drużynowe na alternatywne koszulki wyjazdowe Angels ZTP.',
      options: [
        { id: 'opt_2_1', text: 'Głęboka czerń z krwistymi skrzydłami (Dark Obsidian & Ruby)', votes: ['usr_zawodnik_1', 'usr_zawodnik_3', 'usr_zawodnik_4'] },
        { id: 'opt_2_2', text: 'Ciemny antracyt ze złotą aureolą (Onyx & Imperial Gold)', votes: ['usr_zawodnik_2', 'usr_zawodnik_5'] }
      ],
      allowMultiple: false,
      expiresAt: '2026-11-12T20:00:00Z',
      isActive: true,
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdByRole: 'KIEROWNIK' as const,
      createdAt: '2026-11-01T15:00:00Z'
    }
  ];

  const fees: Fee[] = [
    {
      id: 'fee_1',
      title: 'Składka klubowa - Listopad 2026',
      amount: 120,
      dueDate: '2026-11-15',
      type: 'MIESIECZNA',
      description: 'Miesięczna składka na wynajem hali OSiR, obsługę trenerską oraz zakup napojów izotonicznych i taśm kinesio.',
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdAt: '2026-11-01T08:00:00Z'
    },
    {
      id: 'fee_2',
      title: 'Wpisowe na Ogólnopolski Turniej Niepodległości',
      amount: 50,
      dueDate: '2026-11-18',
      type: 'TURNIEJ',
      description: 'Część wpisowego przypadająca na zawodnika za start w turnieju w Warszawie (w cenie obiad i napoje).',
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdAt: '2026-11-02T10:00:00Z'
    },
    {
      id: 'fee_3',
      title: 'Nowe komplety meczowe Errea (dom/wyjazd)',
      amount: 160,
      dueDate: '2026-10-30',
      type: 'SPRZET',
      description: 'Zaliczka na nowe koszulki i spodenki z personalizowanym nazwiskiem i numerem.',
      createdById: 'usr_kierownik',
      createdByName: 'Marek Wiśniewski',
      createdAt: '2026-10-15T12:00:00Z'
    }
  ];

  const payments: FeePayment[] = [
    {
      id: 'pay_1',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_2',
      userName: 'Piotr Zieliński',
      amount: 120,
      status: 'OPLACONE',
      paidAt: '2026-11-02T16:20:00Z',
      paymentMethod: 'BLIK',
      transactionId: 'TXN-984210',
      verifiedByManager: true
    },
    {
      id: 'pay_2',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_3',
      userName: 'Michał Kaczmarek',
      amount: 120,
      status: 'OPLACONE',
      paidAt: '2026-11-03T11:15:00Z',
      paymentMethod: 'PRZELEW',
      transactionId: 'PRZ-20261103-551',
      verifiedByManager: true
    },
    {
      id: 'pay_3',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_1',
      userName: 'Jan Kowalski',
      amount: 120,
      status: 'OCZEKUJE',
      note: 'Termin do 15 listopada'
    },
    {
      id: 'pay_4',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_4',
      userName: 'Bartosz Wójcik',
      amount: 120,
      status: 'OCZEKUJE'
    },
    {
      id: 'pay_5',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_5',
      userName: 'Kamil Mazur',
      amount: 120,
      status: 'OCZEKUJE'
    },
    {
      id: 'pay_6',
      feeId: 'fee_1',
      userId: 'usr_zawodnik_6',
      userName: 'Adam Nowak',
      amount: 120,
      status: 'OCZEKUJE'
    },
    {
      id: 'pay_7',
      feeId: 'fee_2',
      userId: 'usr_zawodnik_1',
      userName: 'Jan Kowalski',
      amount: 50,
      status: 'OCZEKUJE'
    },
    {
      id: 'pay_8',
      feeId: 'fee_2',
      userId: 'usr_zawodnik_2',
      userName: 'Piotr Zieliński',
      amount: 50,
      status: 'OPLACONE',
      paidAt: '2026-11-03T18:00:00Z',
      paymentMethod: 'BLIK',
      transactionId: 'TXN-773199',
      verifiedByManager: true
    },
    {
      id: 'pay_9',
      feeId: 'fee_3',
      userId: 'usr_zawodnik_1',
      userName: 'Jan Kowalski',
      amount: 160,
      status: 'OPLACONE',
      paidAt: '2026-10-25T14:10:00Z',
      paymentMethod: 'BLIK',
      transactionId: 'TXN-551928',
      verifiedByManager: true
    },
    {
      id: 'pay_10',
      feeId: 'fee_3',
      userId: 'usr_zawodnik_2',
      userName: 'Piotr Zieliński',
      amount: 160,
      status: 'OPLACONE',
      paidAt: '2026-10-24T10:00:00Z',
      paymentMethod: 'KARTA',
      transactionId: 'CARD-449102',
      verifiedByManager: true
    },
    {
      id: 'pay_11',
      feeId: 'fee_3',
      userId: 'usr_zawodnik_4',
      userName: 'Bartosz Wójcik',
      amount: 160,
      status: 'ZALEGLE',
      note: 'Monit wysłany'
    }
  ];

  const tactics: TacticalPlay[] = [
    {
      id: 'tac_p1_receive',
      title: 'Rotacja P1: Przyjęcie w linii 3-osobowe + zbieg R',
      phase: 'PRZYJECIE',
      rotation: 'P1',
      scope: 'MECZ_LIGOWY',
      targetOpponent: 'Gladiatorzy BUD-WENT',
      matchId: 'mat_1',
      description: 'System 5-1. Rozgrywający (#28 Karol Ordon) w strefie 1 schowany za Przyjmującego (#8 Michał Śmigiel). Trójkąt przyjęcia tworzą: #97 Bartosz Augustynek (L), #8 Michał Śmigiel (P2) i #1 Tomasz Krupa (P1). Atakujący (#17 Łukasz Kremer) na lewym skrzydle (strefa 4).',
      courtPositions: [
        { id: 'pos_1', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 1, x: 82, y: 72, task: 'Zbieg pod siatkę między strefę 2 i 3 zaraz po uderzeniu zagrywki' },
        { id: 'pos_2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 74, y: 55, task: 'Przyjęcie skrótu i pasa bocznego strefy 1/2' },
        { id: 'pos_3', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 48, y: 22, task: 'Atak z 1. tempa (krótka A na wprost rozgrywającego)' },
        { id: 'pos_4', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 24, task: 'Atak ze skrzydła lewego (wysoka piłka na pojedynczy blok)' },
        { id: 'pos_5', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 26, y: 68, task: 'Dowodzenie linią przyjęcia, asekuracja strefy 5 i środka' },
        { id: 'pos_6', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 70, task: 'Główny pas przyjęcia strefy 6 oraz opcja ataku z pajpa' },
      ],
      directives: [
        'Rozgrywający startuje DOPIERO w momencie kontaktu zagrywającego z piłką (uniknięcie błędu ustawienia).',
        'Libero (#97) przejmuje 60% szerokości boiska przy mocnej zagrywce z wyskoku.',
        'Pierwsza opcja rozegrania przy dokładnym przyjęciu (do 1m od siatki) to szybki środek (#47 Maciek Noak).'
      ],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-04T10:00:00Z'
    },
    {
      id: 'tac_p1_defense',
      title: 'Rotacja P1: Obrona K2 i Podwójny Blok',
      phase: 'OBRONA',
      rotation: 'P1',
      scope: 'OGOLNA',
      description: 'Ustawienie defensywne po własnej zagrywce. Podwójny blok na lewym skrzydle rywala (Ś1 + R), obrona po prostej przez Libero.',
      courtPositions: [
        { id: 'pos_d1', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 78, y: 15, task: 'Blok prawy (zamyka prostą atakującemu rywala)' },
        { id: 'pos_d2', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 56, y: 15, task: 'Dostawienie bloku do skrzydła (podwójny blok)' },
        { id: 'pos_d3', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 20, task: 'Asekuracja kiwki i przygotowanie do kontrataku' },
        { id: 'pos_d4', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 1, x: 80, y: 75, task: 'Obrona mocnego ataku po prostej' },
        { id: 'pos_d5', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 80, task: 'Obrona ataku po głębokim skosie' },
        { id: 'pos_d6', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 5, x: 22, y: 70, task: 'Obrona ciasnego skosu oraz asekuracja bloku' }
      ],
      directives: [
        'Blok skacze z opóźnieniem 0.2s przy atakach z głębi siatki.',
        'Libero (#97) stoi 1 metr od linii końcowej w strefie 1, gotowy na obronę piłek po rękach bloku.'
      ],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-04T10:30:00Z'
    },
    {
      id: 'tac_p4_attack',
      title: 'Rotacja P4: Kombinacja Pajp + Atak ze strefy 1',
      phase: 'ATAK',
      rotation: 'P4',
      scope: 'MECZ_LIGOWY',
      targetOpponent: 'Gladiatorzy BUD-WENT',
      matchId: 'mat_1',
      description: 'Rozgrywający na siatce (strefa 4). Trzy opcje w ataku: skrzydło, krótka przesunięta B oraz pajp z 6. metra.',
      courtPositions: [
        { id: 'pos_a1', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 4, x: 25, y: 16, task: 'Rozegranie z wyskoku pod siatką (opcja kiwki lewą ręką)' },
        { id: 'pos_a2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 18, task: 'Krótka B przesunięta w prawo' },
        { id: 'pos_a3', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 2, x: 80, y: 22, task: 'Szybkie skrzydło ze strefy 2' },
        { id: 'pos_a4', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 55, task: 'Dynamiczne wejście na Pajp (atak z 6. metra)' },
        { id: 'pos_a5', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 82, y: 65, task: 'Atak z II linii ze strefy 1 (skos lub po linii)' },
        { id: 'pos_a6', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 20, y: 70, task: 'Asekuracja bloku pod siatką' }
      ],
      directives: [
        'Przy negatywnym przyjęciu bezwzględna piłka sytuacyjna na prawe skrzydło do Łukasza Kremera (#17).',
        'Pajp grany na metrowym pułapie nad siatką, ściąga uwagę środkowego rywala.'
      ],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-04T11:00:00Z'
    },
    {
      id: 'tac_turniej_p3',
      title: 'Plan Turniejowy: Przyspieszona gra do 2 wygranych setów (P3)',
      phase: 'ATAK',
      rotation: 'P3',
      scope: 'TURNIEJ',
      eventId: 'evt_2',
      description: 'Taktyka na turniej: skrócone sety do 21 pkt, maksymalne ryzyko zagrywką i gra szybkim skrzydłem bez długich wymian.',
      courtPositions: [
        { id: 'pos_t1', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 66, y: 18, task: 'Szybkie tempo na skrzydła' },
        { id: 'pos_t2', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Krótka' },
        { id: 'pos_t3', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 82, y: 20, task: 'Atak strefa 2' },
        { id: 'pos_t4', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 20, task: 'Atak strefa 4' },
        { id: 'pos_t5', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 55, task: 'Pajp' },
        { id: 'pos_t6', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Asekuracja' }
      ],
      directives: [
        'W turnieju gramy krótsze sety – zero błędów własnych na zagrywce w końcówce.',
        'Wysokie tempo rozegrania na skrzydła, by zmęczyć blok rywali w kolejnych meczach dnia.'
      ],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-04T11:15:00Z'
    },
    {
      id: 'tac_sparing_p2',
      title: 'Plan na Sparing: Test wariantu obrony i asekuracji kiwek (P2)',
      phase: 'OBRONA',
      rotation: 'P2',
      scope: 'SPARING',
      eventId: 'evt_1',
      description: 'Założenie sparingowe: testujemy asekurację kiwek środkowego w strefie 3 i podwójny blok prawy.',
      courtPositions: [
        { id: 'pos_s1', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 6, x: 50, y: 78, task: 'Obrona środka' },
        { id: 'pos_s2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 75, task: 'Obrona po prostej' },
        { id: 'pos_s3', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Blok środkowy' },
        { id: 'pos_s4', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
        { id: 'pos_s5', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona skosu' },
        { id: 'pos_s6', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 16, task: 'Blok lewy' }
      ],
      directives: [
        'W sparingu nie ryzykujemy kontuzji – blok bez wciskania rąk pod taśmę.',
        'Sprawdzamy komunikację i wywołanie piłki między Libero a Przyjmującym.'
      ],
      createdById: 'usr_trener',
      createdByName: 'Tomasz Lewandowski',
      createdAt: '2026-11-04T11:30:00Z'
    }
  ];

  const scoutingReports: ScoutingReport[] = [
    {
      id: 'scout_bud_went',
      opponentTeam: 'Gladiatorzy BUD-WENT',
      matchDate: '2026-11-07',
      threatLevel: 'WYSOKI',
      keyPlayers: [
        {
          name: 'Bogdan Voropai',
          number: 9,
          position: 'Przyjmujący / Lider',
          threatNote: 'Główny punktujący (19 pkt w meczu: 17 atak, 1 blok, 1 as). Bije po ciasnym skosie i ma bardzo wysoki wyskok.',
          targetDirective: 'Podwójny blok zacieśniony do środka boiska. Zagrywka float celowana prosto w jego lewe ramię, aby uniemożliwić mu dynamiczne podejście do ataku.'
        },
        {
          name: 'Michał Stelmaszyk',
          number: 14,
          position: 'Atakujący',
          threatNote: '18 punktów (16 atak, 1 blok, 1 as). Bardzo groźny z piłek sytuacyjnych na lewym skrzydle.',
          targetDirective: 'Zostawiać mu wąską prostą (pokrywa Libero), zamykać blokiem kierunek po przekątnej.'
        },
        {
          name: 'Piotr Chlebowski',
          number: 27,
          position: 'Środkowy',
          threatNote: 'Aż 7 bloków punktowych w ostatnim meczu! Znakomicie czyta grę rozgrywającego.',
          targetDirective: 'Unikać czytelnych wystaw środkiem. Grać przyspieszone skrzydła i pajp z drugiej linii, by go rozciągnąć.'
        },
        {
          name: 'Igor Mianowany',
          number: 1,
          position: 'Przyjmujący',
          threatNote: '7 punktów w ataku, 0 asów. Mniej pewny w defensywie.',
          targetDirective: 'Główny cel zagrywki! Szukać go skrótem w strefę 4/5 przed linię 3. metra.'
        }
      ],
      serveTargetZones: [1, 5],
      blockingDirective: 'Blok opcjonalny: priorytet zablokowania Voropaia (#9) i Stelmaszyka (#14). Przeciwko Chlebowskiemu skaczemy wyłącznie w tempo bez wyprzedzania.',
      coachNotes: 'Klucz do zwycięstwa: odrzucić rywala od siatki agresywnym serwisem w strefy 1 i 5. Gdy Gladiatorzy grają z piłki sytuacyjnej, ich skuteczność drastycznie spada poniżej 35%.',
      createdAt: '2026-11-04T12:00:00Z'
    }
  ];

  return { users, matches, events, leagueReports, fees, payments, announcements, polls, tactics, scoutingReports };
}

let inMemoryCache: AppDatabase | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 seconds cache

export function readDatabase(): AppDatabase {
  if (inMemoryCache) {
    return inMemoryCache;
  }
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch {}
    inMemoryCache = initial;
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw) as AppDatabase;

    if (!db.users) db.users = [];
    if (!db.matches) db.matches = [];
    if (!db.events) db.events = [];
    if (!db.leagueReports) db.leagueReports = [];
    if (!db.fees) db.fees = [];
    if (!db.payments) db.payments = [];
    if (!db.announcements) db.announcements = [];
    if (!db.polls) db.polls = [];
    if (!db.tactics) db.tactics = [];
    if (!db.scoutingReports) db.scoutingReports = [];
    if (!db.treasuryExpenses) db.treasuryExpenses = [];
    if (!db.seasonsArchive) db.seasonsArchive = [];

    inMemoryCache = db;
    return db;
  } catch (err) {
    console.error('Error reading db.json, returning empty db:', err);
    return {
      users: [],
      matches: [],
      events: [],
      leagueReports: [],
      fees: [],
      payments: [],
      announcements: [],
      polls: [],
      tactics: [],
      scoutingReports: [],
      treasuryExpenses: [],
      seasonsArchive: []
    };
  }
}

export function writeDatabase(data: AppDatabase): void {
  inMemoryCache = data;
  lastCacheFetchTime = Date.now();
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
  if (isMongoConfigured()) {
    writeDatabaseAsync(data).catch(e => console.error('[MongoDB Atlas] Sync error on writeDatabase:', e));
  }
}

export async function readDatabaseAsync(): Promise<AppDatabase> {
  if (isMongoConfigured()) {
    try {
      const now = Date.now();
      if (inMemoryCache && (now - lastCacheFetchTime < CACHE_TTL_MS)) {
        return inMemoryCache;
      }
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        const appStateCol = mongoDb.collection('app_state');
        const doc = await appStateCol.findOne({ _id: 'main' as any });
        if (doc && doc.data) {
          inMemoryCache = doc.data as AppDatabase;
          lastCacheFetchTime = now;
          return inMemoryCache;
        } else {
          // Empty MongoDB -> Auto-seed from db.json!
          const localDb = readDatabase();
          await appStateCol.updateOne(
            { _id: 'main' as any },
            { $set: { data: localDb, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
          inMemoryCache = localDb;
          lastCacheFetchTime = now;
          console.log('⚡ [MongoDB Atlas] Pomyślnie zainicjowano bazę w MongoDB Atlas z lokalnych danych db.json!');
          return inMemoryCache;
        }
      }
    } catch (err) {
      console.error('[MongoDB Atlas] Błąd odczytu z Atlasa, używam lokalnego pliku db.json:', err);
    }
  }

  const local = readDatabase();
  inMemoryCache = local;
  return local;
}

export async function writeDatabaseAsync(data: AppDatabase): Promise<void> {
  inMemoryCache = data;
  lastCacheFetchTime = Date.now();

  if (isMongoConfigured()) {
    try {
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        const appStateCol = mongoDb.collection('app_state');
        await appStateCol.updateOne(
          { _id: 'main' as any },
          { $set: { data, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('[MongoDB Atlas] Błąd zapisu do MongoDB Atlas:', err);
    }
  }

  // Also write to local db.json if filesystem is available
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

export function archiveSeason(seasonName: string, archivedBy: { id: string; name: string }): SeasonArchive {
  const db = readDatabase();
  if (!db.seasonsArchive) db.seasonsArchive = [];

  const totalMatches = db.matches.length;
  const matchesWon = db.matches.filter(m => m.teamSetsWon > m.opponentSetsWon).length;
  const matchesLost = totalMatches - matchesWon;
  const totalEvents = db.events.length;
  const trainingsCount = db.events.filter(e => e.type === 'TRENING').length;
  const sparringsCount = db.events.filter(e => e.type === 'SPARING').length;
  const totalFeesCollected = db.payments
    .filter(p => p.status === 'OPLACONE')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPlayers = db.users.filter(u => u.role === 'ZAWODNIK').length;

  const completedEvents = db.events.filter(e => e.isCompleted || e.status === 'ZAKONCZONY' || new Date(e.date).getTime() < Date.now());
  let avgAttendance = 0;
  if (completedEvents.length > 0 && totalPlayers > 0) {
    const totalAttendances = completedEvents.reduce((acc, ev) => {
      const declYes = ev.attendees?.filter(a => a.status === 'BEDE' && (a.userRole === 'ZAWODNIK' || a.userNumber)).length || 0;
      const count = (ev.actualAttendees && ev.actualAttendees.length > 0) ? ev.actualAttendees.length : declYes;
      return acc + count;
    }, 0);
    avgAttendance = Math.round((totalAttendances / (completedEvents.length * totalPlayers)) * 100);
  }

  // Calculate top performers
  const topScorerUser = [...db.users]
    .filter(u => u.stats?.totalPoints)
    .sort((a, b) => (b.stats?.totalPoints || 0) - (a.stats?.totalPoints || 0))[0];
  const mvpUser = [...db.users]
    .filter(u => u.stats?.mvpCount)
    .sort((a, b) => (b.stats?.mvpCount || 0) - (a.stats?.mvpCount || 0))[0];

  const totalPointsScored = db.users.reduce((sum, u) => sum + (u.stats?.totalPoints || 0), 0);

  const archiveRecord: SeasonArchive = {
    id: `season_${Date.now()}`,
    name: seasonName.trim(),
    archivedAt: new Date().toISOString(),
    archivedById: archivedBy.id,
    archivedByName: archivedBy.name,
    summary: {
      totalMatches,
      matchesWon,
      matchesLost,
      totalEvents,
      trainingsCount,
      sparringsCount,
      totalFeesCollected,
      totalPlayers,
      averageAttendance: avgAttendance,
      leagueStanding: '1. Miejsce w LALS',
      totalPointsScored,
      mvpLeader: mvpUser ? `${mvpUser.name} (${mvpUser.stats?.mvpCount || 0} MVP)` : undefined,
      topScorer: topScorerUser ? `${topScorerUser.name} (${topScorerUser.stats?.totalPoints || 0} pkt)` : undefined
    },
    snapshot: {
      matches: JSON.parse(JSON.stringify(db.matches || [])),
      events: JSON.parse(JSON.stringify(db.events || [])),
      leagueReports: JSON.parse(JSON.stringify(db.leagueReports || [])),
      fees: JSON.parse(JSON.stringify(db.fees || [])),
      payments: JSON.parse(JSON.stringify(db.payments || [])),
      treasuryExpenses: JSON.parse(JSON.stringify(db.treasuryExpenses || [])),
      leagueTable: db.leagueTable ? JSON.parse(JSON.stringify(db.leagueTable)) : undefined,
      scoutingReports: db.scoutingReports ? JSON.parse(JSON.stringify(db.scoutingReports)) : undefined,
      tactics: db.tactics ? JSON.parse(JSON.stringify(db.tactics)) : [],
      tacticalMaterials: db.tacticalMaterials ? JSON.parse(JSON.stringify(db.tacticalMaterials)) : [],
      leaguePhotos: db.leaguePhotos ? JSON.parse(JSON.stringify(db.leaguePhotos)) : [],
      announcements: db.announcements ? JSON.parse(JSON.stringify(db.announcements)) : [],
      polls: db.polls ? JSON.parse(JSON.stringify(db.polls)) : [],
      users: JSON.parse(JSON.stringify(db.users || [])),
      rosterSnapshot: db.users.map(u => ({
        id: u.id,
        name: u.name,
        number: u.number,
        position: u.position,
        stats: u.stats ? { ...u.stats } : undefined
      }))
    }
  };

  db.seasonsArchive.push(archiveRecord);

  // Reset active season arrays for a clean slate
  db.matches = [];
  db.events = [];
  db.fees = [];
  db.payments = [];
  db.leagueReports = [];
  db.treasuryExpenses = [];

  // Reset seasonal player stats counters, preserving accounts, credentials, roles and profiles
  db.users = db.users.map(u => ({
    ...u,
    stats: u.stats ? {
      ...u.stats,
      matchesPlayed: 0,
      sparringsPlayed: 0,
      tournamentsPlayed: 0,
      totalPoints: 0,
      attackPoints: 0,
      blockPoints: 0,
      acePoints: 0,
      mvpCount: 0,
      attendanceRate: 0
    } : undefined
  }));

  writeDatabase(db);
  return archiveRecord;
}

export function getSeasonArchives(): SeasonArchive[] {
  const db = readDatabase();
  return (db.seasonsArchive || []).sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
}

export function getSeasonArchiveById(id: string): SeasonArchive | undefined {
  const db = readDatabase();
  return (db.seasonsArchive || []).find(s => s.id === id);
}

export function restoreSeasonArchive(archiveId: string): boolean {
  const db = readDatabase();
  const archive = (db.seasonsArchive || []).find(s => s.id === archiveId);
  if (!archive) return false;

  db.matches = JSON.parse(JSON.stringify(archive.snapshot.matches || []));
  db.events = JSON.parse(JSON.stringify(archive.snapshot.events || []));
  db.leagueReports = JSON.parse(JSON.stringify(archive.snapshot.leagueReports || []));
  db.fees = JSON.parse(JSON.stringify(archive.snapshot.fees || []));
  db.payments = JSON.parse(JSON.stringify(archive.snapshot.payments || []));
  db.treasuryExpenses = JSON.parse(JSON.stringify(archive.snapshot.treasuryExpenses || []));

  if (archive.snapshot.leagueTable) {
    db.leagueTable = JSON.parse(JSON.stringify(archive.snapshot.leagueTable));
  }
  if (archive.snapshot.tactics && archive.snapshot.tactics.length > 0) {
    db.tactics = JSON.parse(JSON.stringify(archive.snapshot.tactics));
  }

  // Restore user stats
  if (archive.snapshot.rosterSnapshot) {
    archive.snapshot.rosterSnapshot.forEach(r => {
      const u = db.users.find(x => x.id === r.id);
      if (u && r.stats) u.stats = { ...r.stats };
    });
  }

  writeDatabase(db);
  return true;
}

export function deleteSeasonArchive(archiveId: string): boolean {
  const db = readDatabase();
  if (!db.seasonsArchive) return false;
  const initialLen = db.seasonsArchive.length;
  db.seasonsArchive = db.seasonsArchive.filter(s => s.id !== archiveId);
  if (db.seasonsArchive.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

export function getEffectiveDatabase(archiveId?: string | null): AppDatabase {
  const db = readDatabase();
  if (!archiveId || archiveId === 'current') {
    return db;
  }

  const archive = (db.seasonsArchive || []).find(s => s.id === archiveId);
  if (!archive) {
    return db;
  }

  const snap = archive.snapshot;
  return {
    ...db,
    matches: snap.matches || [],
    events: snap.events || [],
    leagueReports: snap.leagueReports || [],
    fees: snap.fees || [],
    payments: snap.payments || [],
    treasuryExpenses: snap.treasuryExpenses || [],
    leagueTable: snap.leagueTable || db.leagueTable || [],
    scoutingReports: snap.scoutingReports || db.scoutingReports || [],
    tactics: snap.tactics || db.tactics || [],
    tacticalMaterials: snap.tacticalMaterials || db.tacticalMaterials || [],
    leaguePhotos: snap.leaguePhotos || db.leaguePhotos || [],
    announcements: snap.announcements || db.announcements || [],
    polls: snap.polls || db.polls || [],
    users: snap.users || snap.rosterSnapshot?.map(r => {
      const live = db.users.find(u => u.id === r.id);
      return {
        ...(live || { id: r.id, email: '', role: 'ZAWODNIK' as const, createdAt: new Date().toISOString() }),
        name: r.name,
        number: r.number,
        position: r.position,
        stats: r.stats || live?.stats
      };
    }) || db.users
  };
}

export async function getEffectiveDatabaseAsync(archiveId?: string | null): Promise<AppDatabase> {
  const db = await readDatabaseAsync();
  if (!archiveId || archiveId === 'current') {
    return db;
  }

  const archive = (db.seasonsArchive || []).find(s => s.id === archiveId);
  if (!archive) {
    return db;
  }

  const snap = archive.snapshot;
  return {
    ...db,
    matches: snap.matches || [],
    events: snap.events || [],
    leagueReports: snap.leagueReports || [],
    fees: snap.fees || [],
    payments: snap.payments || [],
    treasuryExpenses: snap.treasuryExpenses || [],
    leagueTable: snap.leagueTable || db.leagueTable || [],
    scoutingReports: snap.scoutingReports || db.scoutingReports || [],
    tactics: snap.tactics || db.tactics || [],
    tacticalMaterials: snap.tacticalMaterials || db.tacticalMaterials || [],
    leaguePhotos: snap.leaguePhotos || db.leaguePhotos || [],
    announcements: snap.announcements || db.announcements || [],
    polls: snap.polls || db.polls || [],
    users: snap.users || snap.rosterSnapshot?.map(r => {
      const live = db.users.find(u => u.id === r.id);
      return {
        ...(live || { id: r.id, email: '', role: 'ZAWODNIK' as const, createdAt: new Date().toISOString() }),
        name: r.name,
        number: r.number,
        position: r.position,
        stats: r.stats || live?.stats
      };
    }) || db.users
  };
}

export function getActiveSeasonIdFromRequest(req?: any): string | null {
  if (!req) return null;
  // 1. URL search params: ?seasonId=...
  if (req.nextUrl?.searchParams) {
    const val = req.nextUrl.searchParams.get('seasonId');
    if (val && val !== 'current') return val;
  }
  // 2. Custom header: x-season-id
  if (req.headers?.get) {
    const headerVal = req.headers.get('x-season-id');
    if (headerVal && headerVal !== 'current') return headerVal;
  }
  // 3. Cookies: active_season_id
  if (req.cookies?.get) {
    const cookieObj = req.cookies.get('active_season_id');
    const cookieVal = typeof cookieObj === 'string' ? cookieObj : cookieObj?.value;
    if (cookieVal && cookieVal !== 'current') return cookieVal;
  }
  return null;
}
