const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. UPDATE LEAGUE TABLE & PHASES
const leagueTable = [
  {
    id: 't_glad',
    position: 1,
    teamName: 'Gladiatorzy BUD-WENT',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237370-178/',
    points: 8,
    matchesPlayed: 3,
    matchesWon: 3,
    matchesLost: 0,
    setsWon: 9,
    setsLost: 2,
    setRatio: 4.5,
    pointsWon: 258,
    pointsLost: 218,
    pointRatio: 1.1835,
    w3_0: 2,
    w3_1: 0,
    w3_2: 1,
    p2_3: 0,
    p1_3: 0,
    p0_3: 0,
    form: ['W', 'W', 'W']
  },
  {
    id: 't_angels',
    position: 2,
    teamName: 'Angels ZTP',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/',
    points: 7,
    matchesPlayed: 3,
    matchesWon: 2,
    matchesLost: 1,
    setsWon: 8,
    setsLost: 3,
    setRatio: 2.6667,
    pointsWon: 252,
    pointsLost: 227,
    pointRatio: 1.1101,
    w3_0: 2,
    w3_1: 0,
    w3_2: 0,
    p2_3: 1,
    p1_3: 0,
    p0_3: 0,
    form: ['W', 'P', 'W']
  },
  {
    id: 't_afera',
    position: 3,
    teamName: 'Afera Volley',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237344-34/',
    points: 6,
    matchesPlayed: 3,
    matchesWon: 2,
    matchesLost: 1,
    setsWon: 6,
    setsLost: 3,
    setRatio: 2.0,
    pointsWon: 214,
    pointsLost: 172,
    pointRatio: 1.2442,
    w3_0: 2,
    w3_1: 0,
    w3_2: 0,
    p2_3: 0,
    p1_3: 0,
    p0_3: 1,
    form: ['P', 'W', 'W']
  },
  {
    id: 't_coco',
    position: 4,
    teamName: 'Coco Jumbo',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237363-177/',
    points: 6,
    matchesPlayed: 3,
    matchesWon: 2,
    matchesLost: 1,
    setsWon: 6,
    setsLost: 4,
    setRatio: 1.5,
    pointsWon: 224,
    pointsLost: 216,
    pointRatio: 1.037,
    w3_0: 1,
    w3_1: 1,
    w3_2: 0,
    p2_3: 0,
    p1_3: 0,
    p0_3: 1,
    form: ['W', 'W', 'P']
  },
  {
    id: 't_boars',
    position: 5,
    teamName: 'Volleyboars',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237367-63/',
    points: 6,
    matchesPlayed: 4,
    matchesWon: 2,
    matchesLost: 2,
    setsWon: 6,
    setsLost: 7,
    setRatio: 0.8571,
    pointsWon: 303,
    pointsLost: 293,
    pointRatio: 1.0341,
    w3_0: 1,
    w3_1: 1,
    w3_2: 0,
    p2_3: 0,
    p1_3: 0,
    p0_3: 2,
    form: ['W', 'P', 'W', 'P']
  },
  {
    id: 't_koty',
    position: 6,
    teamName: 'Koty Broniszewice',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2311843-225/',
    points: 3,
    matchesPlayed: 4,
    matchesWon: 1,
    matchesLost: 3,
    setsWon: 3,
    setsLost: 9,
    setRatio: 0.3333,
    pointsWon: 247,
    pointsLost: 290,
    pointRatio: 0.8517,
    w3_0: 1,
    w3_1: 0,
    w3_2: 0,
    p2_3: 0,
    p1_3: 0,
    p0_3: 3,
    form: ['P', 'P', 'P', 'W']
  },
  {
    id: 't_czelendz',
    position: 7,
    teamName: 'Czelendż',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237346-129/',
    points: 0,
    matchesPlayed: 4,
    matchesWon: 0,
    matchesLost: 4,
    setsWon: 2,
    setsLost: 12,
    setRatio: 0.1667,
    pointsWon: 270,
    pointsLost: 352,
    pointRatio: 0.767,
    w3_0: 0,
    w3_1: 0,
    w3_2: 0,
    p2_3: 0,
    p1_3: 2,
    p0_3: 2,
    form: ['P', 'P', 'P', 'P']
  }
];

db.leagueTable = leagueTable;
db.activeLeaguePhaseId = 'faza_1';
db.leaguePhases = [
  {
    id: 'faza_1',
    name: 'Faza I: Grupa Eliminacyjna (Top 3 awans)',
    shortName: 'Faza I',
    groupName: 'Grupa z udziałem Angels ZTP (7 zespołów)',
    isActive: true,
    advancementSpots: 3,
    advancementTargetName: 'Awans do Grupy Finałowej (Top 3)',
    teamsCount: 7,
    table: leagueTable
  }
];

// 2. UPDATE FULL LEAGUE SCHEDULE (21 MATCHES)
db.leagueSchedule = [
  // 15 listopada 2026, Niedziela (Runda 11)
  {
    round: 11,
    matchNumber: 1971,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Czelendż',
    timeStr: '17:00',
    date: '2026-11-15T17:00:00',
    dateStr: '15 listopada 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584359/'
  },
  {
    round: 11,
    matchNumber: 1972,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Coco Jumbo',
    timeStr: '18:30',
    date: '2026-11-15T18:30:00',
    dateStr: '15 listopada 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584360/'
  },
  {
    round: 11,
    matchNumber: 1973,
    homeTeam: 'Afera Volley',
    awayTeam: 'Volleyboars',
    timeStr: '20:00',
    date: '2026-11-15T20:00:00',
    dateStr: '15 listopada 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584361/'
  },

  // 29 listopada 2026, Niedziela (Runda 13)
  {
    round: 13,
    matchNumber: 1996,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Afera Volley',
    timeStr: '12:30',
    date: '2026-11-29T12:30:00',
    dateStr: '29 listopada 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584384/'
  },
  {
    round: 13,
    matchNumber: 1997,
    homeTeam: 'Czelendż',
    awayTeam: 'Angels ZTP',
    timeStr: '17:00',
    date: '2026-11-29T17:00:00',
    dateStr: '29 listopada 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584385/'
  },

  // 13 grudnia 2026, Niedziela (Runda 16)
  {
    round: 16,
    matchNumber: 2036,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Volleyboars',
    timeStr: '12:30',
    date: '2026-12-13T12:30:00',
    dateStr: '13 grudnia 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584428/'
  },
  {
    round: 16,
    matchNumber: 2037,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Afera Volley',
    timeStr: '15:30',
    date: '2026-12-13T15:30:00',
    dateStr: '13 grudnia 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584423/'
  },
  {
    round: 16,
    matchNumber: 2035,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Coco Jumbo',
    timeStr: '17:00',
    date: '2026-12-13T17:00:00',
    dateStr: '13 grudnia 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584422/'
  },

  // 20 grudnia 2026, Niedziela (Runda 18)
  {
    round: 18,
    matchNumber: 2057,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Gladiatorzy BUD-WENT',
    timeStr: '18:30',
    date: '2026-12-20T18:30:00',
    dateStr: '20 grudnia 2026, Niedziela',
    isFinished: false,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584443/'
  },

  // 8 listopada 2026, Niedziela (Runda 9 - Rozegrane)
  {
    round: 9,
    matchNumber: 1949,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Gladiatorzy BUD-WENT',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '12:30',
    date: '2026-11-08T12:30:00',
    dateStr: '8 listopada 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584337/'
  },
  {
    round: 9,
    matchNumber: 1950,
    homeTeam: 'Czelendż',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '15:00',
    date: '2026-11-08T15:00:00',
    dateStr: '8 listopada 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584338/'
  },
  {
    round: 9,
    matchNumber: 1948,
    homeTeam: 'Volleyboars',
    awayTeam: 'Angels ZTP',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '17:00',
    date: '2026-11-08T17:00:00',
    dateStr: '8 listopada 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584336/'
  },

  // 31 października 2026, Sobota (Runda 7 - Rozegrane)
  {
    round: 7,
    matchNumber: 1926,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Angels ZTP',
    homeSetsWon: 3,
    awaySetsWon: 2,
    timeStr: '17:00',
    date: '2026-10-31T17:00:00',
    dateStr: '31 października 2026, Sobota',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/'
  },
  {
    round: 7,
    matchNumber: 1925,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Afera Volley',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '18:30',
    date: '2026-10-31T18:30:00',
    dateStr: '31 października 2026, Sobota',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583846/'
  },
  {
    round: 7,
    matchNumber: 1924,
    homeTeam: 'Czelendż',
    awayTeam: 'Volleyboars',
    homeSetsWon: 1,
    awaySetsWon: 3,
    timeStr: '20:00',
    date: '2026-10-31T20:00:00',
    dateStr: '31 października 2026, Sobota',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583847/'
  },

  // 18 października 2026, Niedziela (Runda 5 - Rozegrane)
  {
    round: 5,
    matchNumber: 1889,
    homeTeam: 'Volleyboars',
    awayTeam: 'Coco Jumbo',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '17:00',
    date: '2026-10-18T17:00:00',
    dateStr: '18 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583848/'
  },
  {
    round: 5,
    matchNumber: 1887,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 3,
    awaySetsWon: 0,
    timeStr: '18:30',
    date: '2026-10-18T18:30:00',
    dateStr: '18 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583849/'
  },
  {
    round: 5,
    matchNumber: 1888,
    homeTeam: 'Afera Volley',
    awayTeam: 'Czelendż',
    homeSetsWon: 3,
    awaySetsWon: 0,
    timeStr: '20:00',
    date: '2026-10-18T20:00:00',
    dateStr: '18 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583850/'
  },

  // 4 października 2026, Niedziela (Runda 2 - Rozegrane)
  {
    round: 2,
    matchNumber: 1850,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Czelendż',
    homeSetsWon: 3,
    awaySetsWon: 1,
    timeStr: '17:00',
    date: '2026-10-04T17:00:00',
    dateStr: '4 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583851/'
  },
  {
    round: 2,
    matchNumber: 1848,
    homeTeam: 'Afera Volley',
    awayTeam: 'Gladiatorzy BUD-WENT',
    homeSetsWon: 0,
    awaySetsWon: 3,
    timeStr: '18:30',
    date: '2026-10-04T18:30:00',
    dateStr: '4 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583852/'
  },
  {
    round: 2,
    matchNumber: 1849,
    homeTeam: 'Volleyboars',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 3,
    awaySetsWon: 0,
    timeStr: '20:00',
    date: '2026-10-04T20:00:00',
    dateStr: '4 października 2026, Niedziela',
    isFinished: true,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583853/'
  }
];

// 3. UPDATE LEAGUE REPORTS & ANGELS MATCHES
const match1887Report = {
  id: 'rep_vs_2583849',
  matchTitle: 'Angels ZTP vs Koty Broniszewice (3:0)',
  date: '2026-10-18T18:30:00.000Z',
  round: 5,
  matchNumber: 1887,
  volleyStationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583849/',
  duration: '0g 52m',
  spectators: 2,
  referee: 'Frąckowiak Mariusz',
  mvp: {
    name: 'Michał Śmigiel',
    number: 8,
    teamName: 'Angels ZTP',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500853/'
  },
  homeSetsWon: 3,
  awaySetsWon: 0,
  sets: [
    { setNumber: 1, homeScore: 25, awayScore: 22 },
    { setNumber: 2, homeScore: 25, awayScore: 17 },
    { setNumber: 3, homeScore: 25, awayScore: 20 }
  ],
  homeTeam: {
    teamName: 'Angels ZTP',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/',
    players: [
      { number: 4, name: 'Kamil Pujanek', points: 1, attack: 0, block: 0, serve: 1 },
      { number: 7, name: 'Piotr Graczyk', points: 9, attack: 7, block: 1, serve: 1 },
      { number: 8, name: 'Michał Śmigiel', points: 6, attack: 3, block: 3, serve: 0 },
      { number: 10, name: 'Dominik Kruk', points: 3, attack: 0, block: 1, serve: 2 },
      { number: 12, name: 'Hubert Obara', points: 1, attack: 1, block: 0, serve: 0 },
      { number: 17, name: 'Łukasz Kremer', points: 7, attack: 7, block: 0, serve: 0 },
      { number: 28, name: 'Karol Ordon', points: 1, attack: 1, block: 0, serve: 0 },
      { number: 55, name: 'Stanisław Suwalski', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 97, name: 'Bartosz Augustynek', points: 5, attack: 4, block: 1, serve: 0 }
    ],
    totals: { points: 33, attack: 23, block: 6, serve: 4, opponentErrors: 42 }
  },
  awayTeam: {
    teamName: 'Koty Broniszewice',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2311843-225/',
    players: [
      { number: 9, name: 'Paweł Robaszyński', points: 2, attack: 1, block: 0, serve: 1 },
      { number: 11, name: 'Mikołaj Glinkowski', points: 6, attack: 3, block: 0, serve: 3 },
      { number: 13, name: 'Cezary Glinkowski', points: 4, attack: 2, block: 0, serve: 2 },
      { number: 16, name: 'Jakub Filipowicz', points: 2, attack: 2, block: 0, serve: 0 },
      { number: 47, name: 'Oliwier Małecki', points: 6, attack: 4, block: 2, serve: 0 },
      { number: 69, name: 'Paweł Abramowicz', points: 8, attack: 6, block: 2, serve: 0 }
    ],
    totals: { points: 28, attack: 18, block: 4, serve: 6, opponentErrors: 31 }
  },
  createdAt: '2026-10-18T20:00:00.000Z',
  matchId: 'mat_lals_1887'
};

const match1926Report = {
  id: 'rep_vs_2583864',
  matchTitle: 'Gladiatorzy BUD-WENT vs Angels ZTP (3:2)',
  date: '2026-10-31T17:00:00.000Z',
  round: 7,
  matchNumber: 1926,
  volleyStationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/',
  duration: '1g 27m',
  spectators: 25,
  referee: 'Karinskiy Ivan',
  mvp: {
    name: 'Bogdan Voropai',
    number: 9,
    teamName: 'Gladiatorzy BUD-WENT',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501025/'
  },
  homeSetsWon: 3,
  awaySetsWon: 2,
  sets: [
    { setNumber: 1, homeScore: 25, awayScore: 22 },
    { setNumber: 2, homeScore: 25, awayScore: 21 },
    { setNumber: 3, homeScore: 22, awayScore: 25 },
    { setNumber: 4, homeScore: 21, awayScore: 25 },
    { setNumber: 5, homeScore: 15, awayScore: 9 }
  ],
  homeTeam: {
    teamName: 'Gladiatorzy BUD-WENT',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237370-178/',
    players: [
      { number: 1, name: 'Igor Mianowany', points: 7, attack: 7, block: 0, serve: 0 },
      { number: 5, name: 'Jakub Świerczyński', points: 9, attack: 9, block: 0, serve: 0 },
      { number: 9, name: 'Bogdan Voropai', points: 19, attack: 17, block: 1, serve: 1 },
      { number: 14, name: 'Michał Stelmaszyk', points: 18, attack: 16, block: 1, serve: 1 },
      { number: 21, name: 'Wojciech Nowak', points: 4, attack: 4, block: 0, serve: 0 },
      { number: 24, name: 'Cyprian Michalak', points: 3, attack: 1, block: 1, serve: 1 },
      { number: 27, name: 'Piotr Chlebowski', points: 12, attack: 5, block: 7, serve: 0 }
    ],
    totals: { points: 72, attack: 59, block: 10, serve: 3, opponentErrors: 36 }
  },
  awayTeam: {
    teamName: 'Angels ZTP',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/',
    players: [
      { number: 1, name: 'Tomasz Krupa', points: 5, attack: 4, block: 0, serve: 1 },
      { number: 4, name: 'Kamil Pujanek', points: 3, attack: 0, block: 3, serve: 0 },
      { number: 8, name: 'Michał Śmigiel', points: 10, attack: 7, block: 2, serve: 1 },
      { number: 17, name: 'Łukasz Kremer', points: 19, attack: 17, block: 1, serve: 1 },
      { number: 28, name: 'Karol Ordon', points: 3, attack: 2, block: 1, serve: 0 },
      { number: 47, name: 'Maciek Noak', points: 8, attack: 5, block: 2, serve: 1 },
      { number: 97, name: 'Bartosz Augustynek', points: 6, attack: 4, block: 2, serve: 0 }
    ],
    totals: { points: 54, attack: 39, block: 11, serve: 4, opponentErrors: 48 }
  },
  createdAt: '2026-10-31T19:00:00.000Z',
  matchId: 'mat_lals_1926'
};

const match1948Report = {
  id: 'rep_vs_2584336',
  matchTitle: 'Volleyboars vs Angels ZTP (0:3)',
  date: '2026-11-08T17:00:00.000Z',
  round: 9,
  matchNumber: 1948,
  volleyStationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584336/',
  duration: '0g 56m',
  spectators: 2,
  referee: 'Grocholewski Marcin',
  mvp: {
    name: 'Hubert Obara',
    number: 12,
    teamName: 'Angels ZTP',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246308/'
  },
  homeSetsWon: 0,
  awaySetsWon: 3,
  sets: [
    { setNumber: 1, homeScore: 23, awayScore: 25 },
    { setNumber: 2, homeScore: 15, awayScore: 25 },
    { setNumber: 3, homeScore: 22, awayScore: 25 }
  ],
  homeTeam: {
    teamName: 'Volleyboars',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237367-63/',
    players: [
      { number: 1, name: 'Michał Bobrowicz', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 3, name: 'Damian Gralak', points: 5, attack: 4, block: 1, serve: 0 },
      { number: 4, name: 'Wojtek Rymarski', points: 20, attack: 14, block: 2, serve: 4 },
      { number: 6, name: 'Wojciech Jarmużek', points: 2, attack: 1, block: 1, serve: 0 },
      { number: 8, name: 'Jędrzej Radzioch', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 13, name: 'Dobromił Charlęża', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 16, name: 'Mikołaj Nowak', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 25, name: 'Jakub Zacharczyk', points: 1, attack: 1, block: 0, serve: 0 },
      { number: 30, name: 'Michał Maliński', points: 5, attack: 4, block: 1, serve: 0 },
      { number: 64, name: 'Daniel Dębski', points: 0, attack: 0, block: 0, serve: 0 }
    ],
    totals: { points: 33, attack: 24, block: 5, serve: 4, opponentErrors: 27 }
  },
  awayTeam: {
    teamName: 'Angels ZTP',
    teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/',
    players: [
      { number: 4, name: 'Kamil Pujanek', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 7, name: 'Piotr Graczyk', points: 3, attack: 3, block: 0, serve: 0 },
      { number: 10, name: 'Dominik Kruk', points: 7, attack: 5, block: 2, serve: 0 },
      { number: 12, name: 'Hubert Obara', points: 8, attack: 7, block: 1, serve: 0 },
      { number: 15, name: 'Wit Król', points: 11, attack: 10, block: 1, serve: 0 },
      { number: 17, name: 'Łukasz Kremer', points: 7, attack: 7, block: 0, serve: 0 },
      { number: 28, name: 'Karol Ordon', points: 0, attack: 0, block: 0, serve: 0 },
      { number: 55, name: 'Stanisław Suwalski', points: 2, attack: 1, block: 1, serve: 0 },
      { number: 97, name: 'Bartosz Augustynek', points: 3, attack: 3, block: 0, serve: 0 }
    ],
    totals: { points: 41, attack: 36, block: 5, serve: 0, opponentErrors: 34 }
  },
  createdAt: '2026-11-08T19:00:00.000Z',
  matchId: 'mat_lals_1948'
};

db.leagueReports = [match1948Report, match1926Report, match1887Report];

// 4. UPDATE ANGELS MATCHES
db.matches = [
  {
    id: 'mat_lals_1948',
    opponent: 'Volleyboars',
    date: '2026-11-08T17:00:00.000Z',
    location: 'Hala OSiR, Luboń',
    isHome: false,
    matchType: 'Mecz ligowy',
    competition: 'Lubońska Amatorska Liga Siatkówki (LALS)',
    matchNumber: 1948,
    round: 9,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584336/',
    sets: [
      { setNumber: 1, teamScore: 25, opponentScore: 23 },
      { setNumber: 2, teamScore: 25, opponentScore: 15 },
      { setNumber: 3, teamScore: 25, opponentScore: 22 }
    ],
    teamSetsWon: 3,
    opponentSetsWon: 0,
    mvp: 'Hubert Obara',
    notes: 'Runda 9 LALS: Przekonujące zwycięstwo 3:0 na wyjeździe z Volleyboars.',
    leaguePhaseId: 'faza_1',
    leaguePhaseName: 'Faza I (Eliminacje)',
    createdById: 'usr_kierownik',
    createdByName: 'Łukasz Kremer',
    createdAt: '2026-11-08T19:00:00.000Z'
  },
  {
    id: 'mat_lals_1926',
    opponent: 'Gladiatorzy BUD-WENT',
    date: '2026-10-31T17:00:00.000Z',
    location: 'Hala OSiR, Luboń',
    isHome: false,
    matchType: 'Mecz ligowy',
    competition: 'Lubońska Amatorska Liga Siatkówki (LALS)',
    matchNumber: 1926,
    round: 7,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/',
    sets: [
      { setNumber: 1, teamScore: 22, opponentScore: 25 },
      { setNumber: 2, teamScore: 21, opponentScore: 25 },
      { setNumber: 3, teamScore: 25, opponentScore: 22 },
      { setNumber: 4, teamScore: 25, opponentScore: 21 },
      { setNumber: 5, teamScore: 9, opponentScore: 15 }
    ],
    teamSetsWon: 2,
    opponentSetsWon: 3,
    notes: 'Runda 7 LALS: Zacięty mecz walki z liderem Gladiatorami (2:3, zdobyty cenny punkt ligowy).',
    leaguePhaseId: 'faza_1',
    leaguePhaseName: 'Faza I (Eliminacje)',
    createdById: 'usr_kierownik',
    createdByName: 'Łukasz Kremer',
    createdAt: '2026-10-31T19:00:00.000Z'
  },
  {
    id: 'mat_lals_1887',
    opponent: 'Koty Broniszewice',
    date: '2026-10-18T18:30:00.000Z',
    location: 'Hala OSiR, Luboń',
    isHome: true,
    matchType: 'Mecz ligowy',
    competition: 'Lubońska Amatorska Liga Siatkówki (LALS)',
    matchNumber: 1887,
    round: 5,
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583849/',
    sets: [
      { setNumber: 1, teamScore: 25, opponentScore: 22 },
      { setNumber: 2, teamScore: 25, opponentScore: 17 },
      { setNumber: 3, teamScore: 25, opponentScore: 20 }
    ],
    teamSetsWon: 3,
    opponentSetsWon: 0,
    mvp: 'Michał Śmigiel',
    notes: 'Runda 5 LALS: Inauguracyjne pewne zwycięstwo Angels 3:0 przed własną publicznością.',
    leaguePhaseId: 'faza_1',
    leaguePhaseName: 'Faza I (Eliminacje)',
    createdById: 'usr_kierownik',
    createdByName: 'Łukasz Kremer',
    createdAt: '2026-10-18T20:00:00.000Z'
  }
];

// 5. UPDATE CLEAN EVENTS (Removing dummy "d vs ffdsf" and "asddas")
db.events = [
  {
    id: 'evt_lals_1972',
    title: 'Mecz LALS (R11): Angels ZTP vs Coco Jumbo',
    date: '2026-11-15T18:30:00.000Z',
    type: 'MECZ',
    location: 'Hala OSiR, ul. Kołłątaja 2, Luboń',
    description: '11. kolejka LALS. Kluczowy mecz o umocnienie 2. miejsca w tabeli i bezpośredni awans do Grupy Finałowej.',
    opponent: 'Coco Jumbo',
    status: 'PLANOWANE',
    attendees: []
  },
  {
    id: 'evt_lals_1997',
    title: 'Mecz LALS (R13): Czelendż vs Angels ZTP',
    date: '2026-11-29T17:00:00.000Z',
    type: 'MECZ',
    location: 'Hala OSiR, ul. Kołłątaja 2, Luboń',
    description: '13. kolejka LALS z zespołem Czelendż.',
    opponent: 'Czelendż',
    status: 'PLANOWANE',
    attendees: []
  },
  {
    id: 'evt_lals_2037',
    title: 'Mecz LALS (R16): Angels ZTP vs Afera Volley',
    date: '2026-12-13T15:30:00.000Z',
    type: 'MECZ',
    location: 'Hala OSiR, ul. Kołłątaja 2, Luboń',
    description: '16. kolejka LALS. Hit kolejki z wiceliderem Afera Volley.',
    opponent: 'Afera Volley',
    status: 'PLANOWANE',
    attendees: []
  },
  {
    id: 'evt_turniej_1',
    title: 'Ogólnopolski Turniej Niepodległości',
    date: '2026-11-21T09:00:00.000Z',
    type: 'TURNIEJ',
    location: 'Hala Sportowa POSiR, Poznań',
    description: 'Turniej z udziałem 8 zaproszonych zespołów ligowych.',
    opponent: '8 zaproszonych drużyn',
    status: 'PLANOWANE',
    attendees: []
  },
  {
    id: 'evt_training_weekly',
    title: 'Trening taktyczny: Przyjęcie & Zagrywka kierunkowa',
    date: '2026-11-19T19:30:00.000Z',
    type: 'TRENING',
    location: 'Hala Sportowa SP 2, Luboń',
    description: 'Odprawa taktyczna przed meczem z Czelendżem. Praca nad rotacjami P1-P6 i kontratakiem.',
    status: 'PLANOWANE',
    attendees: []
  }
];

// 6. UPDATE USERS (ANGELS ZTP REAL SQUAD)
const angelsSquad = [
  {
    id: 'usr_kierownik',
    email: 'lukasz.kremer@volley.pl',
    name: 'Łukasz Kremer',
    role: 'KIEROWNIK',
    number: 17,
    position: 'Przyjmujący',
    phone: '+48 506 666 777',
    isCaptain: true,
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-01T10:00:00Z',
    permissions: {
      canManageMatches: true,
      canManageEvents: true,
      canManageStats: true,
      canManageTactics: true,
      canManageFees: true,
      canPostAnnouncements: true,
      canCreatePolls: true,
      isAdmin: true
    },
    height: 198
  },
  {
    id: 'usr_trener',
    email: 'trener@volley.pl',
    name: 'Hubert Obara',
    role: 'TRENER',
    number: 12,
    position: 'Przyjmujący',
    phone: '+48 602 345 678',
    isCaptain: false,
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-01T10:00:00Z',
    permissions: {
      canManageMatches: false,
      canManageEvents: true,
      canManageStats: false,
      canManageTactics: true,
      canManageFees: false,
      canPostAnnouncements: true,
      canCreatePolls: true,
      isAdmin: false
    },
    height: 192
  },
  {
    id: 'usr_pujanek',
    email: 'kamil.pujanek@angelsztp.pl',
    name: 'Kamil Pujanek',
    role: 'KIEROWNIK',
    number: 4,
    position: 'Rozgrywający',
    height: 197,
    phone: '+48 502 222 333',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-05T12:00:00Z',
    isCaptain: true,
    permissions: {
      canManageMatches: true,
      canManageEvents: true,
      canManageStats: true,
      canManageTactics: true,
      canManageFees: true,
      canPostAnnouncements: true,
      canCreatePolls: true,
      isAdmin: true
    }
  },
  {
    id: 'usr_krupa',
    email: 'tomasz.krupa@volley.pl',
    name: 'Tomasz Krupa',
    role: 'ZAWODNIK',
    number: 1,
    position: 'Przyjmujący',
    height: 191,
    phone: '+48 501 111 222',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-05T12:00:00Z',
    isCaptain: false
  },
  {
    id: 'usr_graczyk',
    email: 'piotr.graczyk@volley.pl',
    name: 'Piotr Graczyk',
    role: 'ZAWODNIK',
    number: 7,
    position: 'Przyjmujący',
    height: 193,
    phone: '+48 503 333 444',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-06T12:00:00Z'
  },
  {
    id: 'usr_smigiel',
    email: 'michal.smigiel@volley.pl',
    name: 'Michał Śmigiel',
    role: 'ZAWODNIK',
    number: 8,
    position: 'Środkowy',
    height: 195,
    phone: '+48 504 444 555',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-06T12:00:00Z'
  },
  {
    id: 'usr_kruk',
    email: 'dominik.kruk@volley.pl',
    name: 'Dominik Kruk',
    role: 'ZAWODNIK',
    number: 10,
    position: 'Środkowy',
    height: 198,
    phone: '+48 505 555 666',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-07T12:00:00Z'
  },
  {
    id: 'usr_krol',
    email: 'wit.krol@volley.pl',
    name: 'Wit Król',
    role: 'ZAWODNIK',
    number: 15,
    position: 'Atakujący',
    height: 196,
    phone: '+48 506 777 888',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-07T12:00:00Z'
  },
  {
    id: 'usr_ordon',
    email: 'karol.ordon@volley.pl',
    name: 'Karol Ordon',
    role: 'ZAWODNIK',
    number: 28,
    position: 'Atakujący',
    height: 196,
    phone: '+48 507 777 888',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-08T12:00:00Z'
  },
  {
    id: 'usr_noak',
    email: 'maciej.noak@volley.pl',
    name: 'Maciej Noak',
    role: 'ZAWODNIK',
    number: 47,
    position: 'Środkowy',
    height: 194,
    phone: '+48 508 888 999',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-08T12:00:00Z'
  },
  {
    id: 'usr_suwalski',
    email: 'stanislaw.suwalski@volley.pl',
    name: 'Stanisław Suwalski',
    role: 'ZAWODNIK',
    number: 55,
    position: 'Środkowy',
    height: 197,
    phone: '+48 509 111 222',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-09T12:00:00Z'
  },
  {
    id: 'usr_augustynek',
    email: 'bartosz.augustynek@volley.pl',
    name: 'Bartosz Augustynek',
    role: 'ZAWODNIK',
    number: 97,
    position: 'Atakujący',
    height: 203,
    phone: '+48 509 999 000',
    status: 'Aktywny',
    passwordHash: '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy',
    createdAt: '2026-09-09T12:00:00Z'
  }
];

db.users = angelsSquad;

// 7. STORE OFFICIAL VOLLEYSTATION PLAYERS RANKING
db.officialRanking = [
  { rank: 1, name: 'Wojtek Rymarski', position: 'przyjmujący', team: 'VOL', points: 52, attack: 37, block: 6, serve: 9 },
  { rank: 2, name: 'Michał Stelmaszyk', position: 'atakujący', team: 'GLA', points: 46, attack: 39, block: 5, serve: 2 },
  { rank: 3, name: 'Michał Maliński', position: 'przyjmujący', team: 'VOL', points: 37, attack: 29, block: 6, serve: 2 },
  { rank: 4, name: 'Dominik Olejnik', position: 'przyjmujący', team: 'COC', points: 37, attack: 26, block: 4, serve: 7 },
  { rank: 5, name: 'Łukasz Kremer', position: 'przyjmujący', team: 'ANG', points: 33, attack: 31, block: 1, serve: 1 },
  { rank: 6, name: 'Kamil Kowalski', position: 'atakujący', team: 'CZE', points: 29, attack: 25, block: 1, serve: 3 },
  { rank: 7, name: 'Jakub Świerczyński', position: 'przyjmujący', team: 'GLA', points: 27, attack: 26, block: 1, serve: 0 },
  { rank: 8, name: 'Mateusz Kicerman', position: 'atakujący', team: 'COC', points: 27, attack: 22, block: 4, serve: 1 },
  { rank: 9, name: 'Paweł Abramowicz', position: 'środkowy', team: 'KOT', points: 27, attack: 20, block: 5, serve: 2 },
  { rank: 10, name: 'Paweł Królikowski', position: 'przyjmujący', team: 'CZE', points: 27, attack: 24, block: 2, serve: 1 },
  { rank: 11, name: 'Szymon Arend', position: 'przyjmujący', team: 'AFE', points: 24, attack: 19, block: 1, serve: 4 },
  { rank: 12, name: 'Damian Gralak', position: 'przyjmujący', team: 'VOL', points: 23, attack: 16, block: 1, serve: 6 },
  { rank: 13, name: 'Bogdan Voropai', position: 'przyjmujący', team: 'GLA', points: 22, attack: 19, block: 1, serve: 2 },
  { rank: 14, name: 'Sebastian Augustynek', position: 'środkowy', team: 'COC', points: 21, attack: 11, block: 9, serve: 1 },
  { rank: 15, name: 'Mikołaj Glinkowski', position: 'przyjmujący', team: 'KOT', points: 21, attack: 17, block: 1, serve: 3 },
  { rank: 16, name: 'Mateusz Ceglarski', position: 'atakujący', team: 'VOL', points: 17, attack: 15, block: 1, serve: 1 },
  { rank: 17, name: 'Piotr Szyszka', position: 'atakujący', team: 'AFE', points: 17, attack: 16, block: 0, serve: 1 },
  { rank: 18, name: 'Wojciech Drożdż', position: 'środkowy', team: 'CZE', points: 17, attack: 16, block: 0, serve: 1 },
  { rank: 19, name: 'Krzysztof Zieliński', position: 'atakujący', team: 'CZE', points: 17, attack: 15, block: 1, serve: 1 },
  { rank: 20, name: 'Michał Śmigiel', position: 'środkowy', team: 'ANG', points: 16, attack: 10, block: 5, serve: 1 },
  { rank: 21, name: 'Adam Król', position: 'przyjmujący', team: 'AFE', points: 16, attack: 12, block: 1, serve: 3 },
  { rank: 22, name: 'Franciszek Paterka', position: 'środkowy', team: 'KOT', points: 15, attack: 10, block: 3, serve: 2 },
  { rank: 23, name: 'Łukasz Gliździński', position: 'przyjmujący', team: 'CZE', points: 15, attack: 14, block: 0, serve: 1 },
  { rank: 24, name: 'Igor Mianowany', position: 'środkowy', team: 'GLA', points: 14, attack: 11, block: 1, serve: 2 },
  { rank: 25, name: 'Bartosz Augustynek', position: 'atakujący', team: 'ANG', points: 14, attack: 11, block: 3, serve: 0 },
  { rank: 26, name: 'Jan Klimczak', position: 'przyjmujący', team: 'COC', points: 14, attack: 10, block: 1, serve: 3 },
  { rank: 27, name: 'Cezary Glinkowski', position: 'przyjmujący', team: 'KOT', points: 14, attack: 9, block: 3, serve: 2 },
  { rank: 28, name: 'Wojciech Jarmużek', position: 'środkowy', team: 'VOL', points: 13, attack: 8, block: 2, serve: 3 },
  { rank: 29, name: 'Eryk Nowaczyk', position: 'atakujący', team: 'KOT', points: 13, attack: 9, block: 2, serve: 2 },
  { rank: 30, name: 'Jakub Filipowicz', position: 'przyjmujący', team: 'KOT', points: 13, attack: 13, block: 0, serve: 0 },
  { rank: 31, name: 'Piotr Chlebowski', position: 'środkowy', team: 'GLA', points: 12, attack: 5, block: 7, serve: 0 },
  { rank: 32, name: 'Jakub Makowski', position: 'rozgrywający', team: 'COC', points: 12, attack: 4, block: 3, serve: 5 },
  { rank: 33, name: 'Oliwier Małecki', position: 'przyjmujący', team: 'KOT', points: 12, attack: 10, block: 2, serve: 0 },
  { rank: 34, name: 'Michał Szymański', position: 'przyjmujący', team: 'AFE', points: 12, attack: 6, block: 2, serve: 4 },
  { rank: 35, name: 'Piotr Graczyk', position: 'przyjmujący', team: 'ANG', points: 12, attack: 10, block: 1, serve: 1 },
  { rank: 36, name: 'Hubert Mądrzejewski', position: 'środkowy', team: 'AFE', points: 11, attack: 7, block: 3, serve: 1 },
  { rank: 37, name: 'Aleksander Waszkiel', position: 'przyjmujący', team: 'CZE', points: 11, attack: 9, block: 0, serve: 2 },
  { rank: 38, name: 'Wit Król', position: 'atakujący', team: 'ANG', points: 11, attack: 10, block: 1, serve: 0 },
  { rank: 39, name: 'Seweryn Wasilewski', position: 'środkowy', team: 'AFE', points: 10, attack: 5, block: 4, serve: 1 },
  { rank: 40, name: 'Cezary Włodarczyk', position: 'atakujący', team: 'AFE', points: 10, attack: 9, block: 0, serve: 1 },
  { rank: 41, name: 'Mateusz Filipiak-Gimiński', position: 'przyjmujący', team: 'GLA', points: 10, attack: 9, block: 0, serve: 1 },
  { rank: 42, name: 'Dominik Kruk', position: 'środkowy', team: 'ANG', points: 10, attack: 5, block: 3, serve: 2 },
  { rank: 43, name: 'Jakub Zacharczyk', position: 'rozgrywający', team: 'VOL', points: 9, attack: 4, block: 1, serve: 4 },
  { rank: 44, name: 'Hubert Obara', position: 'przyjmujący', team: 'ANG', points: 9, attack: 8, block: 1, serve: 0 },
  { rank: 45, name: 'Maciek Noak', position: 'środkowy', team: 'ANG', points: 8, attack: 5, block: 2, serve: 1 },
  { rank: 46, name: 'Bartłomiej Dekiert', position: 'środkowy', team: 'COC', points: 8, attack: 2, block: 5, serve: 1 },
  { rank: 47, name: 'Dawid Urbanowski', position: 'rozgrywający', team: 'AFE', points: 8, attack: 4, block: 2, serve: 2 },
  { rank: 48, name: 'Michał Kłosowski', position: 'środkowy', team: 'AFE', points: 7, attack: 2, block: 2, serve: 3 },
  { rank: 49, name: 'Wojciech Pakuła', position: 'rozgrywający', team: 'AFE', points: 6, attack: 2, block: 0, serve: 4 },
  { rank: 50, name: 'Cyprian Michalak', position: 'rozgrywający', team: 'GLA', points: 5, attack: 3, block: 1, serve: 1 },
  { rank: 51, name: 'Tomasz Krupa', position: 'przyjmujący', team: 'ANG', points: 5, attack: 4, block: 0, serve: 1 },
  { rank: 52, name: 'Jędrzej Radzioch', position: 'środkowy', team: 'VOL', points: 5, attack: 4, block: 1, serve: 0 },
  { rank: 53, name: 'Nikodem Szyminczak', position: 'przyjmujący', team: 'AFE', points: 5, attack: 4, block: 0, serve: 1 },
  { rank: 54, name: 'Jan Kaczmarek', position: 'środkowy', team: 'GLA', points: 5, attack: 1, block: 4, serve: 0 },
  { rank: 55, name: 'Wojciech Nowak', position: 'atakujący', team: 'GLA', points: 4, attack: 4, block: 0, serve: 0 },
  { rank: 56, name: 'Kamil Pujanek', position: 'rozgrywający', team: 'ANG', points: 4, attack: 0, block: 3, serve: 1 },
  { rank: 57, name: 'Karol Ordon', position: 'atakujący', team: 'ANG', points: 4, attack: 3, block: 1, serve: 0 },
  { rank: 58, name: 'Michał Bobrowicz', position: 'przyjmujący', team: 'VOL', points: 4, attack: 3, block: 1, serve: 0 },
  { rank: 59, name: 'Paweł Robaszyński', position: 'rozgrywający', team: 'KOT', points: 4, attack: 2, block: 0, serve: 2 },
  { rank: 60, name: 'Wiktor Ignaszak', position: 'środkowy', team: 'AFE', points: 4, attack: 2, block: 2, serve: 0 },
  { rank: 61, name: 'Marcin Skrzypczak', position: 'środkowy', team: 'KOT', points: 4, attack: 3, block: 1, serve: 0 },
  { rank: 62, name: 'Michał Garstka', position: 'środkowy', team: 'GLA', points: 3, attack: 1, block: 1, serve: 1 },
  { rank: 63, name: 'Daniel Sady', position: 'rozgrywający', team: 'GLA', points: 3, attack: 1, block: 2, serve: 0 },
  { rank: 64, name: 'Kornelia Ziętkiewicz', position: 'libero', team: 'VOL', points: 2, attack: 2, block: 0, serve: 0 },
  { rank: 65, name: 'Mikołaj Nowak', position: 'przyjmujący', team: 'VOL', points: 2, attack: 2, block: 0, serve: 0 },
  { rank: 66, name: 'Szymon Stanisławski', position: 'rozgrywający', team: 'KOT', points: 2, attack: 1, block: 0, serve: 1 },
  { rank: 67, name: 'Marcin Leśniewski', position: 'rozgrywający', team: 'CZE', points: 2, attack: 2, block: 0, serve: 0 },
  { rank: 68, name: 'Stanisław Suwalski', position: 'środkowy', team: 'ANG', points: 2, attack: 1, block: 1, serve: 0 },
  { rank: 69, name: 'Olga Puto', position: 'rozgrywający', team: 'CZE', points: 2, attack: 1, block: 0, serve: 1 },
  { rank: 70, name: 'Dobromił Charlęża', position: 'środkowy', team: 'VOL', points: 1, attack: 0, block: 1, serve: 0 },
  { rank: 71, name: 'Jakub Stegenta', position: 'przyjmujący', team: 'GLA', points: 1, attack: 1, block: 0, serve: 0 },
  { rank: 72, name: 'Patryk Wojtkowiak', position: 'libero', team: 'COC', points: 1, attack: 1, block: 0, serve: 0 },
  { rank: 73, name: 'Jakub Wytykowski', position: 'atakujący', team: 'VOL', points: 0, attack: 0, block: 0, serve: 0 },
  { rank: 74, name: 'Daniel Dębski', position: 'rozgrywający', team: 'VOL', points: 0, attack: 0, block: 0, serve: 0 },
  { rank: 75, name: 'Krzysztof Kaźmierczak', position: 'środkowy', team: 'VOL', points: 0, attack: 0, block: 0, serve: 0 },
  { rank: 76, name: 'Grzegorz Wiśniewski', position: 'rozgrywający', team: 'CZE', points: 0, attack: 0, block: 0, serve: 0 }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Database successfully populated with official VolleyStation LALS data!');

