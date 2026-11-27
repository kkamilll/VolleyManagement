export type Role = 'KIEROWNIK' | 'TRENER' | 'ZAWODNIK';

export type PlayerPosition =
  | 'Przyjmujący'
  | 'Atakujący'
  | 'Rozgrywający'
  | 'Środkowy'
  | 'Libero'
  | 'Sztab trenerski'
  | 'Zarząd';

export interface UserPermissions {
  canManageMatches?: boolean; // dodawanie/edycja meczów ligowych
  canManageEvents?: boolean; // sparingi, turnieje, ustalanie szóstki
  canManageStats?: boolean; // import i edycja statystyk VolleyStation
  canManageTactics?: boolean; // tablica taktyczna, playbook i scouting
  canManageFees?: boolean; // skarbiec składek, zatwierdzanie wpłat
  canPostAnnouncements?: boolean; // publikowanie komunikatów
  canCreatePolls?: boolean; // tworzenie ankiet
  isAdmin?: boolean; // dostęp do centrum administracyjnego
}

export interface PlayerStats {
  matchesPlayed?: number;
  sparringsPlayed?: number;
  tournamentsPlayed?: number;
  totalPoints?: number;
  attackPoints?: number;
  blockPoints?: number;
  acePoints?: number;
  mvpCount?: number;
  attendanceRate?: number; // %
  attackRating?: number; // 0-100
  defenseRating?: number; // 0-100
  serveRating?: number; // 0-100
  settingRating?: number; // 0-100
  receptionRating?: number; // 0-100
  blockRating?: number; // 0-100
  badges?: string[];
  coachNotes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isCaptain?: boolean;
  number?: number;
  position?: PlayerPosition;
  height?: number; // cm
  phone?: string;
  avatar?: string;
  status?: 'Aktywny' | 'Kontuzjowany' | 'Nieobecny';
  stats?: PlayerStats;
  passwordHash?: string;
  createdAt: string;
  permissions?: UserPermissions;
}

export interface LiveScore {
  currentSet: number;
  teamCurrentScore: number;
  opponentCurrentScore: number;
  teamSetsWon: number;
  opponentSetsWon: number;
  finishedSets: VolleyballSet[];
  isServingTeam: boolean; // czy Angels ZTP serwują
  isLive: boolean;
  updatedAt: string;
}

export interface VolleyballSet {
  setNumber: number;
  teamScore: number;
  opponentScore: number;
}

export interface MatchResult {
  id: string;
  opponent: string;
  opponentLogo?: string;
  date: string;
  location: string;
  isHome: boolean;
  matchType: 'Mecz ligowy' | 'Sparing' | 'Turniej';
  sets: VolleyballSet[];
  teamSetsWon: number;
  opponentSetsWon: number;
  mvp?: string;
  notes?: string;
  coachComments?: string;
  bestAction?: string;
  socialDraft?: string;
  liveScore?: LiveScore;
  createdById: string;
  createdByName: string;
  createdAt: string;
  reportId?: string; // ID of the linked VolleyStation report
  round?: number;
  matchNumber?: number;
  url?: string;
  eventId?: string;
  leaguePhaseId?: string; // ID fazy ligowej (np. 'faza_1' lub 'faza_2')
  leaguePhaseName?: string; // Nazwa fazy ligowej (np. 'Faza I: Grupa Eliminacyjna' lub 'Faza II: Grupa Finałowa')
}

export type EventType = 'MECZ' | 'SPARING' | 'TURNIEJ' | 'TRENING';
export type AttendanceStatus = 'BEDE' | 'NIE_BEDE' | 'NIEPEWNE';

export interface AttendanceRecord {
  userId: string;
  userName: string;
  userRole: Role;
  userNumber?: number;
  position?: PlayerPosition;
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
}

export interface StartingLineup {
  setter?: string;
  opposite?: string;
  outsideHitters?: string[];
  middleBlockers?: string[];
  libero?: string;
  reserves?: string[];
}

export type TournamentPhase =
  | 'FAZA_GRUPOWA'
  | '1_16_FINALU'
  | '1_8_FINALU'
  | '1_4_FINALU'
  | '1_2_FINALU'
  | 'O_3_MIEJSCE'
  | 'FINAL'
  | 'INNA';

export interface TournamentMatch {
  id: string;
  phase?: TournamentPhase | string;
  round: string;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  scoreA?: number;
  scoreB?: number;
  setScores?: string; // np. "21:18, 19:21, 15:11"
  time?: string;
  isFinished?: boolean;
  notes?: string;
}

export interface EventResult {
  teamSetsWon: number;
  opponentSetsWon: number;
  sets: VolleyballSet[];
  mvp?: string;
  notes?: string;
  tournamentRank?: string;
}

export type EventStatus = 'ANKIETA' | 'WERYFIKACJA' | 'ZAKONCZONY';

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  status?: EventStatus;
  date: string;
  endDate?: string;
  location: string;
  locationUrl?: string; // Link do pinezki Google Maps
  opponent?: string;
  opponentLogo?: string;
  description: string;
  costPerPerson?: number;
  linkedFeeId?: string;
  attendees: AttendanceRecord[];
  actualAttendees?: string[]; // IDs of users who actually attended
  isCompleted?: boolean;
  result?: EventResult;
  lineup?: StartingLineup;
  tournamentMatches?: TournamentMatch[];
  liveScore?: LiveScore;
  bestAction?: string;
  socialDraft?: string;
  coachPostMatchNote?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

// VolleyStation League Stats Types
export interface VolleyStationPlayerStat {
  number: number;
  name: string;
  url?: string;
  points: number; // ABS
  attack: number; // Ata
  block: number;  // Blk
  serve: number;  // Ser
}

export interface VolleyStationTeamStats {
  teamName: string;
  teamUrl?: string;
  players: VolleyStationPlayerStat[];
  totals: {
    points: number;
    attack: number;
    block: number;
    serve: number;
    opponentErrors?: number;
  };
}

export interface MatchSetScore {
  setNumber: number;
  homeScore: number;
  awayScore: number;
  duration?: string;
}

export interface VolleyStationMvp {
  name: string;
  number?: number;
  teamName?: string;
  url?: string;
}

export interface VolleyStationScheduleMatch {
  round: number;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeSetsWon?: number;
  awaySetsWon?: number;
  isFinished?: boolean;
  timeStr?: string;
  url: string;
  matchId?: string;
  date?: string;
  dateStr?: string;
}

export interface LeagueMatchReport {
  id: string;
  matchTitle: string;
  date: string;
  rawText: string;
  homeTeam: VolleyStationTeamStats;
  awayTeam: VolleyStationTeamStats;
  round?: number;
  matchNumber?: number;
  volleyStationUrl?: string;
  duration?: string;
  mvp?: VolleyStationMvp;
  spectators?: number;
  referee?: string;
  sets?: MatchSetScore[];
  homeSetsWon?: number;
  awaySetsWon?: number;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  matchId?: string; // ID of the linked MatchResult
  leaguePhaseId?: string; // ID fazy ligowej (np. 'faza_1' lub 'faza_2')
  leaguePhaseName?: string; // Nazwa fazy ligowej
}

export type AnnouncementPriority = 'NORMALNY' | 'WAZNY' | 'PILNY';
export type AnnouncementCategory = 'OGOLNE' | 'TRENING' | 'MECZ' | 'SPRAWY_KLUBOWE';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  isPinned?: boolean;
  link?: string;
  createdById: string;
  createdByName: string;
  createdByRole: Role;
  createdAt: string;
  readBy: {
    userId: string;
    userName: string;
    readAt: string;
  }[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // userIds of voters
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  allowMultiple?: boolean;
  expiresAt?: string;
  isActive: boolean;
  createdById: string;
  createdByName: string;
  createdByRole: Role;
  createdAt: string;
}

export type FeeType = 'MIESIECZNA' | 'TURNIEJ' | 'SPRZET' | 'INNA';
export type PaymentStatus = 'OPLACONE' | 'OCZEKUJE' | 'ZALEGLE';
export type PaymentMethod = 'BLIK' | 'PRZELEW' | 'KARTA' | 'GOTOWKA';

export interface Fee {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: FeeType;
  description: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeePayment {
  id: string;
  feeId: string;
  userId: string;
  userName: string;
  amount: number;
  baseAmount?: number;
  overpayment?: number;
  splitTarget?: string;
  status: PaymentStatus;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  verifiedByManager?: boolean;
  note?: string;
}

export type TransactionType = 'EXPENSE' | 'INCOME';

export interface TreasuryExpense {
  id: string;
  type?: TransactionType; // 'EXPENSE' (default) or 'INCOME'
  title: string;
  amount: number;
  date: string;
  category: 'HALA' | 'SEDZIOWIE' | 'SPRZET' | 'TURNIEJ' | 'WODA_ODZYWKI' | 'SPONSOR' | 'DAROWIZNA' | 'NAGRODA' | 'SKLADKI' | 'INNE' | string;
  description?: string;
  createdByName: string;
}

export interface LeagueTableTeam {
  id: string;
  position: number;
  teamName: string;
  teamUrl?: string;
  logo?: string;
  matchesPlayed: number;
  matchesWon?: number;
  matchesLost?: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setRatio?: number | string;
  pointsWon: number;
  pointsLost: number;
  pointRatio?: number | string;
  w3_0?: number;
  w3_1?: number;
  w3_2?: number;
  p2_3?: number;
  p1_3?: number;
  p0_3?: number;
  form: ('W' | 'P')[];
}

export interface LeaguePhase {
  id: string; // np. 'faza_1', 'faza_2'
  name: string; // np. 'Faza I: Grupa Eliminacyjna (Top 3 awans)'
  shortName: string; // np. 'Faza I'
  groupName?: string; // np. 'Grupa Angels ZTP'
  isActive: boolean; // czy to aktywna faza
  advancementSpots: number; // np. 3 (3 drużyny z grupy wychodzą dalej)
  advancementTargetName: string; // np. 'Awans do Grupy Finałowej (Top 3)'
  teamsCount: number; // np. 7
  table: LeagueTableTeam[]; // tabela 7 zespołów tej fazy
  createdAt?: string;
}

export interface LeaguePhoto {
  id: string;
  url: string;
  title: string;
  matchName?: string;
  category?: 'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE';
  eventId?: string;
  matchId?: string;
  date: string;
  uploadedBy?: string;
  caption?: string;
  seriesId?: string;
  seriesTitle?: string;
}

export interface TacticalMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'IMAGE' | 'VIDEO';
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  scope: 'MECZ_LIGOWY' | 'SPARING' | 'TURNIEJ' | 'TRENING' | 'OGOLNE';
  eventId?: string;
  matchId?: string;
  opponentName?: string;
  description?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
}

export type RotationCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export type TacticalPhase = 'PRZYJECIE' | 'OBRONA' | 'ATAK' | 'ZAGRYWKA';
export type PlayerRoleCode = 'R' | 'A' | 'P1' | 'P2' | 'Ś1' | 'Ś2' | 'L' | 'B1' | 'B2' | 'B3' | 'O1' | 'O2' | 'O5' | 'O6' | string;

export interface CourtPlayerPosition {
  id: string; // unikalny id na planszy
  playerId?: string;
  name: string;
  number?: number;
  roleCode: PlayerRoleCode;
  zone: 1 | 2 | 3 | 4 | 5 | 6; // strefa nominalna
  x: number; // procentowa pozycja szerokości boiska (0 - 100)
  y: number; // procentowa pozycja głębokości boiska (0 - 100)
  task?: string; // konkretne zadanie
}

export type TacticScope = 'TRENING' | 'MECZ_LIGOWY' | 'TURNIEJ' | 'SPARING' | 'OGOLNA';

export type TacticalPostStatus = 'OCZEKUJE' | 'ZAAKCEPTOWANY' | 'ODRZUCONY';

export interface TacticalPost {
  id: string;
  tacticId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorNumber?: number;
  content: string;
  status: TacticalPostStatus;
  coachComment?: string;
  createdAt: string;
}

export interface TacticalPlay {
  id: string;
  title: string;
  phase: TacticalPhase;
  rotation: RotationCode;
  scope: TacticScope;
  targetOpponent?: string;
  matchId?: string;
  eventId?: string;
  description: string;
  courtPositions: CourtPlayerPosition[];
  directives: string[];
  drawingData?: string; // Canvas drawings data (arrows, paths, markers)
  tacticalNotes?: string;
  isVisibleToPlayers?: boolean; // Domyślnie true; false = ukryta przed zawodnikami (tylko sztab)
  posts?: TacticalPost[]; // posty i dyskusja zawodników
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScoutingKeyPlayer {
  name: string;
  number?: number;
  position: string;
  threatNote: string;
  targetDirective: string;
}

export interface ScoutingReport {
  id: string;
  opponentTeam: string;
  matchDate?: string;
  threatLevel: 'WYSOKI' | 'SREDNI' | 'NISKI';
  keyPlayers: ScoutingKeyPlayer[];
  serveTargetZones: number[]; // np. [1, 5]
  blockingDirective: string;
  coachNotes: string;
  createdAt: string;
}

export interface SeasonArchiveSummary {
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  totalEvents: number;
  trainingsCount: number;
  sparringsCount: number;
  totalFeesCollected: number;
  totalPlayers: number;
  averageAttendance: number;
  leagueStanding?: string;
  totalPointsScored?: number;
  mvpLeader?: string;
  topScorer?: string;
}

export interface SeasonArchive {
  id: string; // e.g. "season_2025_2026_1"
  name: string; // e.g. "Sezon 2025/2026 Jesień"
  archivedAt: string;
  archivedById: string;
  archivedByName: string;
  summary: SeasonArchiveSummary;
  snapshot: {
    matches: MatchResult[];
    events: EventItem[];
    leagueReports: LeagueMatchReport[];
    fees: Fee[];
    payments: FeePayment[];
    treasuryExpenses?: TreasuryExpense[];
    leagueTable?: LeagueTableTeam[];
    leaguePhases?: LeaguePhase[];
    activeLeaguePhaseId?: string;
    scoutingReports?: ScoutingReport[];
    tactics?: TacticalPlay[];
    tacticalMaterials?: TacticalMaterial[];
    leaguePhotos?: LeaguePhoto[];
    announcements?: Announcement[];
    polls?: Poll[];
    users?: User[];
    teamCrests?: Record<string, string>;
    rosterSnapshot: {
      id: string;
      name: string;
      number?: number;
      position?: PlayerPosition;
      stats?: PlayerStats;
    }[];
  };
}

export interface TrainingExercise {
  id: string;
  title: string;
  category: 'ROZGRZEWKA' | 'TECHNIKA' | 'TAKTYKA' | 'MOTORYKA' | 'GRA' | 'INNE';
  durationMinutes: number;
  description: string;
  keyPoints?: string[];
  courtDrawing?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface TrainingConclusion {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  type: 'PLUS' | 'MINUS' | 'UWAGA' | 'INDYWIDUALNA';
  targetPlayerId?: string;
  targetPlayerName?: string;
  content: string;
  createdAt: string;
}

export interface TrainingComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  eventId?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  durationMinutes: number;
  mainGoal: string;
  secondaryGoals?: string[];
  intensity: 'NISKA' | 'SREDNIA' | 'WYSOKA' | 'MECZOWA';
  equipmentNeeded?: string;
  exercises: TrainingExercise[];
  conclusions: TrainingConclusion[];
  comments?: TrainingComment[];
  coachNotes?: string;
  videoUrls?: string[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppDatabase {
  users: User[];
  matches: MatchResult[];
  events: EventItem[];
  leagueReports: LeagueMatchReport[];
  fees: Fee[];
  payments: FeePayment[];
  announcements?: Announcement[];
  polls?: Poll[];
  tactics?: TacticalPlay[];
  trainingPlans?: TrainingPlan[];
  scoutingReports?: ScoutingReport[];
  leagueTable?: LeagueTableTeam[];
  leaguePhases?: LeaguePhase[];
  activeLeaguePhaseId?: string;
  leagueSchedule?: VolleyStationScheduleMatch[];
  leaguePhotos?: LeaguePhoto[];
  leaguePlayerRankings?: any[];
  teamCrests?: Record<string, string>;
  tacticalMaterials?: TacticalMaterial[];
  treasuryExpenses?: TreasuryExpense[];
  seasonsArchive?: SeasonArchive[];
}
