import {
  VolleyStationPlayerStat,
  VolleyStationTeamStats,
  LeagueMatchReport,
  MatchSetScore,
  VolleyStationMvp,
  VolleyStationScheduleMatch
} from './types';

// Map of Polish month names to month index (0-11)
const POLISH_MONTHS: Record<string, number> = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  września: 8,
  października: 9,
  listopada: 10,
  grudnia: 11
};

export function cleanTeamName(name: string): string {
  let cleaned = name.trim();
  // Strip duplicate leading character caused by copy-pasting from VolleyStation team logo
  // e.g. GGladiatorzy -> Gladiatorzy, AAngels -> Angels, KKoty -> Koty, CCoco -> Coco, VVolleyboars -> Volleyboars, AAfera -> Afera
  if (cleaned.length >= 2 && cleaned[0] === cleaned[1] && /^[A-ZĄĆĘŁŃÓŚŹŻ]/i.test(cleaned[0])) {
    cleaned = cleaned.substring(1);
  }
  // Also strip any rogue leading bracket characters
  cleaned = cleaned.replace(/^[\[\]\(\)\s]+/, '').replace(/[\[\]\(\)\s]+$/, '').trim();
  return cleaned;
}

export function parsePolishDate(dateStr: string): string | null {
  // e.g. "18 października 2026, Niedziela" or "4 października 2026"
  const match = dateStr.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/i);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = parseInt(match[3], 10);

  const monthIdx = POLISH_MONTHS[monthName];
  if (monthIdx === undefined) return null;

  const d = new Date(Date.UTC(year, monthIdx, day, 18, 0, 0));
  return d.toISOString();
}

/**
 * Parses schedule lines copied from VolleyStation, e.g.:
 * [Runda: 7Nr 1926GGladiatorzy BUD-WENT3:2AAngels ZTP](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/)
 * 18 października 2026, Niedziela
 */
export function parseVolleyStationSchedule(raw: string): VolleyStationScheduleMatch[] {
  const results: VolleyStationScheduleMatch[] = [];
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  let currentPendingDateIso: string | undefined = undefined;
  let currentPendingDateStr: string | undefined = undefined;

  // Scan lines forwards and backwards to correlate matches with date headers
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check if line contains a Polish date
    const parsedDate = parsePolishDate(line);
    if (parsedDate) {
      currentPendingDateIso = parsedDate;
      currentPendingDateStr = line;
      // Also back-propagate date to any recently matched items that didn't have a date
      for (let back = results.length - 1; back >= 0; back--) {
        if (!results[back].date) {
          results[back].date = parsedDate;
          results[back].dateStr = line;
        } else {
          break;
        }
      }
      continue;
    }

    // Match all markdown links in this line
    // Regex matches: [Runda: 7Nr 1926GGladiatorzy BUD-WENT3:2AAngels ZTP](https://...)
    const scheduleRegex = /\[Runda:\s*(\d+)\s*Nr\s*(\d+)(.*?)\s*(\d+)\s*:\s*(\d+)\s*(.*?)\]\((https?:\/\/[^\)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = scheduleRegex.exec(line)) !== null) {
      const round = parseInt(match[1], 10);
      const matchNumber = parseInt(match[2], 10);
      const homeRaw = match[3];
      const homeScore = parseInt(match[4], 10);
      const awayScore = parseInt(match[5], 10);
      const awayRaw = match[6];
      const url = match[7];

      // Extract matchId from url
      const urlMatch = url.match(/\/matches\/(\d+)/);
      const matchId = urlMatch ? urlMatch[1] : `vs_${matchNumber}`;

      results.push({
        round,
        matchNumber,
        homeTeam: cleanTeamName(homeRaw),
        awayTeam: cleanTeamName(awayRaw),
        homeSetsWon: homeScore,
        awaySetsWon: awayScore,
        url,
        matchId,
        date: currentPendingDateIso,
        dateStr: currentPendingDateStr
      });
    }
  }

  return results;
}

/**
 * Parses individual player tables and team totals from VolleyStation match report
 */
export function parseVolleyStation(raw: string): VolleyStationTeamStats[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const teams: VolleyStationTeamStats[] = [];
  let currentTeam: VolleyStationTeamStats | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line is a team header: e.g. [GGladiatorzy BUD-WENT](http...) or team name
    const teamMatch = line.match(/^\[(.*?)\](?:\((https?:\/\/[^\)]+)\))?$/);
    if (teamMatch && !line.includes('/players/')) {
      if (currentTeam) {
        teams.push(currentTeam);
      }
      currentTeam = {
        teamName: cleanTeamName(teamMatch[1]),
        teamUrl: teamMatch[2] || '',
        players: [],
        totals: { points: 0, attack: 0, block: 0, serve: 0, opponentErrors: 0 }
      };
      i++;
      continue;
    }

    // Skip table header lines
    if (['Nr', 'Zawodnik', 'ABS', 'Ata', 'Blk', 'Ser', 'Bł. przec.', 'B?. przec.', 'Bl. przec.'].includes(line)) {
      i++;
      continue;
    }

    // Check for 'R' / 'Razem' totals
    if (line === 'R' || line.toLowerCase() === 'razem') {
      let nextLine = lines[i + 1];
      if (nextLine && nextLine.toLowerCase() === 'razem') {
        i += 2;
      } else {
        i += 1;
      }

      const totalPoints = parseInt(lines[i++] || '0', 10);
      const totalAttack = parseInt(lines[i++] || '0', 10);
      const totalBlock = parseInt(lines[i++] || '0', 10);
      const totalServe = parseInt(lines[i++] || '0', 10);
      const opponentErrors = parseInt(lines[i++] || '0', 10);

      if (currentTeam) {
        currentTeam.totals = {
          points: isNaN(totalPoints) ? 0 : totalPoints,
          attack: isNaN(totalAttack) ? 0 : totalAttack,
          block: isNaN(totalBlock) ? 0 : totalBlock,
          serve: isNaN(totalServe) ? 0 : totalServe,
          opponentErrors: isNaN(opponentErrors) ? 0 : opponentErrors
        };
      }
      continue;
    }

    // Check for player row: line is a player shirt number (number between 1 and 99)
    if (/^\d{1,2}$/.test(line)) {
      const playerNumber = parseInt(line, 10);
      i++;
      if (i >= lines.length) break;

      const playerLine = lines[i];
      let playerName = '';
      let playerUrl = '';
      let absPoints = 0;

      const playerLinkMatch = playerLine.match(/\[(.*?)\](?:\((https?:\/\/[^\)]+)\))?(\d+)?/);
      if (playerLinkMatch) {
        playerName = playerLinkMatch[1].trim();
        playerUrl = playerLinkMatch[2] || '';
        if (playerLinkMatch[3]) {
          absPoints = parseInt(playerLinkMatch[3], 10);
        } else {
          i++;
          absPoints = parseInt(lines[i] || '0', 10);
        }
      } else {
        const plainMatch = playerLine.match(/^(.*?)(?:\s+(\d+))?$/);
        if (plainMatch) {
          playerName = plainMatch[1].trim();
          if (plainMatch[2]) {
            absPoints = parseInt(plainMatch[2], 10);
          } else {
            i++;
            absPoints = parseInt(lines[i] || '0', 10);
          }
        }
      }

      i++;
      const attack = parseInt(lines[i++] || '0', 10);
      const block = parseInt(lines[i++] || '0', 10);
      const serve = parseInt(lines[i++] || '0', 10);

      if (currentTeam) {
        currentTeam.players.push({
          number: playerNumber,
          name: playerName,
          url: playerUrl,
          points: isNaN(absPoints) ? 0 : absPoints,
          attack: isNaN(attack) ? 0 : attack,
          block: isNaN(block) ? 0 : block,
          serve: isNaN(serve) ? 0 : serve
        });
      }
      continue;
    }

    i++;
  }

  if (currentTeam) {
    teams.push(currentTeam);
  }

  return teams;
}

/**
 * Parses full VolleyStation match report including sets breakdown, MVP, duration, referee, spectators
 */
export function parseVolleyStationFullReport(raw: string, defaultDate?: string): LeagueMatchReport {
  const id = `vs_rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let duration: string | undefined = undefined;
  let spectators: number | undefined = undefined;
  let referee: string | undefined = undefined;
  let mvp: VolleyStationMvp | undefined = undefined;
  let sets: MatchSetScore[] = [];
  let homeSetsWon: number | undefined = undefined;
  let awaySetsWon: number | undefined = undefined;

  // 1. Duration
  const durMatch = raw.match(/Czas trwania\s*[\r\n]+([^\r\n]+)/i);
  if (durMatch) duration = durMatch[1].trim();

  // 2. Spectators
  const specMatch = raw.match(/Widzowie\s*[\r\n]+(\d+)/i);
  if (specMatch) spectators = parseInt(specMatch[1], 10);

  // 3. Referee
  const refMatch = raw.match(/Pierwszy sędzia:\s*[\r\n]+([^\r\n]+)/i);
  if (refMatch) referee = refMatch[1].trim();

  // 4. Sets breakdown from 'Wynik meczu'
  // e.g.:
  // Wynik meczu
  // [G](...)25\n25\n22\n21\n15\n3
  // [A](...)22\n21\n25\n25\n9\n2
  const wynikMatch = raw.match(
    /Wynik meczu\s*[\r\n]+\[(.*?)\](?:\(([^\)]+)\))?(\d+[\s\S]*?)\[(.*?)\](?:\(([^\)]+)\))?(\d+[\s\S]*?)(?:Czas trwania|MVP|Widzowie|Pierwszy|\[[A-Za-z])/i
  );
  if (wynikMatch) {
    const t1RawNumbers = (wynikMatch[3] || '').trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    const t2RawNumbers = (wynikMatch[6] || '').trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));

    if (t1RawNumbers.length > 1 && t2RawNumbers.length > 1) {
      homeSetsWon = t1RawNumbers[t1RawNumbers.length - 1];
      awaySetsWon = t2RawNumbers[t2RawNumbers.length - 1];

      const t1SetPoints = t1RawNumbers.slice(0, -1);
      const t2SetPoints = t2RawNumbers.slice(0, -1);

      const numSets = Math.min(t1SetPoints.length, t2SetPoints.length);
      for (let s = 0; s < numSets; s++) {
        sets.push({
          setNumber: s + 1,
          homeScore: t1SetPoints[s],
          awayScore: t2SetPoints[s]
        });
      }
    }
  }

  // 5. Parse Teams and Players
  const parsedTeams = parseVolleyStation(raw);
  const homeTeam = parsedTeams[0] || {
    teamName: 'Gospodarze',
    players: [],
    totals: { points: 0, attack: 0, block: 0, serve: 0, opponentErrors: 0 }
  };
  const awayTeam = parsedTeams[1] || {
    teamName: 'Goście',
    players: [],
    totals: { points: 0, attack: 0, block: 0, serve: 0, opponentErrors: 0 }
  };

  // 6. MVP parsing with team separation
  // e.g. MVP\n[G](...)[9 - Bogdan VoropaiGladiatorzy BUD-WENT](...)
  const mvpMatch = raw.match(/MVP[\s\S]*?\[(\d+)\s*-\s*([^\]]+?)\](?:\(([^\)]+)\))?/i);
  if (mvpMatch) {
    const nr = parseInt(mvpMatch[1], 10);
    let full = mvpMatch[2].trim();
    let mvpTeamName: string | undefined = undefined;

    // Separate player name from team name
    if (awayTeam.teamName && full.endsWith(awayTeam.teamName)) {
      full = full.slice(0, -awayTeam.teamName.length).trim();
      mvpTeamName = awayTeam.teamName;
    } else if (homeTeam.teamName && full.endsWith(homeTeam.teamName)) {
      full = full.slice(0, -homeTeam.teamName.length).trim();
      mvpTeamName = homeTeam.teamName;
    }

    mvp = {
      name: full,
      number: nr,
      teamName: mvpTeamName,
      url: mvpMatch[3] || ''
    };
  }

  // 7. Find VolleyStation URL if present
  let volleyStationUrl: string | undefined = undefined;
  const anyUrlMatch = raw.match(/https?:\/\/panel\.volleystation\.com\/[^\s\)\"\']+/i);
  if (anyUrlMatch) {
    volleyStationUrl = anyUrlMatch[0];
  }

  const scoreStr = (homeSetsWon !== undefined && awaySetsWon !== undefined)
    ? ` (${homeSetsWon}:${awaySetsWon})`
    : '';
  const matchTitle = `${homeTeam.teamName} vs ${awayTeam.teamName}${scoreStr}`;

  return {
    id,
    matchTitle,
    date: defaultDate || new Date().toISOString(),
    rawText: raw,
    homeTeam,
    awayTeam,
    duration,
    spectators,
    referee,
    mvp,
    sets,
    homeSetsWon,
    awaySetsWon,
    volleyStationUrl,
    createdAt: new Date().toISOString()
  };
}

/**
 * Splits raw text containing multiple match reports (e.g. separated by 'i inny mecz' or multiple 'Wynik meczu')
 */
export function parseVolleyStationMultiReport(raw: string, defaultDate?: string): LeagueMatchReport[] {
  // Check if input contains schedule
  if (raw.includes('[Runda:') && !raw.includes('Wynik meczu')) {
    return [];
  }

  // Split by 'i inny mecz' or by 'Wynik meczu'
  const sections = raw.split(/(?:i\s+inny\s+mecz|(?=Wynik meczu))/i)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.includes('Nr') && s.includes('Zawodnik'));

  if (sections.length <= 1) {
    return [parseVolleyStationFullReport(raw, defaultDate)];
  }

  return sections.map((sec, idx) => {
    // Generate dates or use default
    return parseVolleyStationFullReport(sec, defaultDate);
  });
}

export interface PlayerLeaderboardEntry {
  name: string;
  number?: number;
  team: string;
  url?: string;
  isAngels: boolean;
  matchesPlayed: number;
  totalPoints: number;
  totalAttack: number;
  totalBlock: number;
  totalServe: number;
  mvpCount: number;
}

export function computeLeaderboards(reports: LeagueMatchReport[]) {
  const playerMap = new Map<string, PlayerLeaderboardEntry>();

  reports.forEach(report => {
    // Tally MVP
    if (report.mvp && report.mvp.name) {
      const mvpKey = `${report.mvp.name}_${report.mvp.teamName || ''}`;
      // will increment below
    }

    [report.homeTeam, report.awayTeam].forEach(team => {
      if (!team || !team.players) return;
      const isAngels = team.teamName.toLowerCase().includes('angel');

      team.players.forEach(p => {
        const key = `${p.name}_${team.teamName}`;
        const existing = playerMap.get(key) || {
          name: p.name,
          number: p.number,
          team: team.teamName,
          url: p.url,
          isAngels,
          matchesPlayed: 0,
          totalPoints: 0,
          totalAttack: 0,
          totalBlock: 0,
          totalServe: 0,
          mvpCount: 0
        };

        existing.matchesPlayed += 1;
        existing.totalPoints += p.points || 0;
        existing.totalAttack += p.attack || 0;
        existing.totalBlock += p.block || 0;
        existing.totalServe += p.serve || 0;

        if (report.mvp && report.mvp.name && report.mvp.name.toLowerCase() === p.name.toLowerCase()) {
          existing.mvpCount += 1;
        }

        playerMap.set(key, existing);
      });
    });
  });

  const allPlayers = Array.from(playerMap.values());

  const topScorers = [...allPlayers].sort((a, b) => b.totalPoints - a.totalPoints);
  const topAttackers = [...allPlayers].sort((a, b) => b.totalAttack - a.totalAttack);
  const topBlockers = [...allPlayers].sort((a, b) => b.totalBlock - a.totalBlock);
  const topServers = [...allPlayers].sort((a, b) => b.totalServe - a.totalServe);
  const topMvps = [...allPlayers].filter(p => p.mvpCount > 0).sort((a, b) => b.mvpCount - a.mvpCount);

  // Angels ZTP only leaders
  const angelsPlayers = allPlayers.filter(p => p.isAngels);
  const angelsScorers = [...angelsPlayers].sort((a, b) => b.totalPoints - a.totalPoints);
  const angelsAttackers = [...angelsPlayers].sort((a, b) => b.totalAttack - a.totalAttack);
  const angelsBlockers = [...angelsPlayers].sort((a, b) => b.totalBlock - a.totalBlock);
  const angelsServers = [...angelsPlayers].sort((a, b) => b.totalServe - a.totalServe);

  return {
    topScorers: topScorers.slice(0, 15),
    topAttackers: topAttackers.slice(0, 15),
    topBlockers: topBlockers.slice(0, 15),
    topServers: topServers.slice(0, 15),
    topMvps: topMvps.slice(0, 10),
    angelsScorers: angelsScorers.slice(0, 10),
    angelsAttackers: angelsAttackers.slice(0, 10),
    angelsBlockers: angelsBlockers.slice(0, 10),
    angelsServers: angelsServers.slice(0, 10)
  };
}
