import {
  VolleyStationPlayerStat,
  VolleyStationTeamStats,
  LeagueMatchReport,
  MatchSetScore,
  VolleyStationMvp,
  VolleyStationScheduleMatch,
  LeagueTableTeam
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
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T18:00:00`;
}

export function normalizeTime(timeRaw: string): string {
  let cleaned = timeRaw.trim().toLowerCase();
  const isPm = cleaned.includes('po południu') || cleaned.includes('po poludniu') || cleaned.includes('pm');
  const isAm = cleaned.includes('rano') || cleaned.includes('przed południem') || cleaned.includes('am');

  const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return '18:00';

  let h = parseInt(timeMatch[1], 10);
  const m = timeMatch[2];

  if (isPm) {
    if (h < 12) h += 12;
  } else if (isAm) {
    if (h === 12) h = 0;
  }

  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Parses schedule lines copied from VolleyStation, e.g.:
 * [Runda: 7Nr 1926GGladiatorzy BUD-WENT3:2AAngels ZTP](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/)
 * [Runda: 11Nr 1972AAngels ZTP6:30 po południuCCoco Jumbo](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584360/)
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
          const mTime = results[back].timeStr || '18:00';
          results[back].date = `${parsedDate.slice(0, 10)}T${mTime}:00`;
          results[back].dateStr = line;
        } else {
          break;
        }
      }
      continue;
    }

    // Match all markdown links in this line
    const scheduleRegex = /\[Runda:\s*(\d+)\s*Nr\s*(\d+)(.*?)\]\((https?:\/\/[^\)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = scheduleRegex.exec(line)) !== null) {
      const round = parseInt(match[1], 10);
      const matchNumber = parseInt(match[2], 10);
      const content = match[3].trim();
      const url = match[4].trim();

      // Extract matchId from url
      const urlMatch = url.match(/\/matches\/(\d+)/);
      const matchId = urlMatch ? urlMatch[1] : `vs_${matchNumber}`;

      // Check if content has a finished score (e.g. 3:2, 3:0, 1:3) or a time (e.g. "6:30 po południu", "18:30")
      const scoreMatch = content.match(/^(.*?)\s*([0-3])\s*:\s*([0-3])\s*(.*?)$/);
      const timeMatch = content.match(/^(.*?)\s*(\d{1,2}:\d{2}(?:\s*(?:po południu|po poludniu|przed południem|rano|am|pm))?)\s*(.*?)$/i);

      let homeRaw = '';
      let awayRaw = '';
      let isFinished = false;
      let homeSetsWon: number | undefined = undefined;
      let awaySetsWon: number | undefined = undefined;
      let timeStr = '18:00';

      if (scoreMatch && !content.includes('po południu') && !content.includes(':00') && !content.includes(':30')) {
        homeRaw = scoreMatch[1];
        homeSetsWon = parseInt(scoreMatch[2], 10);
        awaySetsWon = parseInt(scoreMatch[3], 10);
        awayRaw = scoreMatch[4];
        isFinished = true;
      } else if (timeMatch) {
        homeRaw = timeMatch[1];
        timeStr = normalizeTime(timeMatch[2]);
        awayRaw = timeMatch[3];
        isFinished = false;
      } else {
        homeRaw = content;
        awayRaw = 'Przeciwnik';
      }

      let matchDateIso = currentPendingDateIso;
      if (currentPendingDateIso) {
        matchDateIso = `${currentPendingDateIso.slice(0, 10)}T${timeStr}:00`;
      }

      results.push({
        round,
        matchNumber,
        homeTeam: cleanTeamName(homeRaw),
        awayTeam: cleanTeamName(awayRaw),
        homeSetsWon,
        awaySetsWon,
        isFinished,
        timeStr,
        url,
        matchId,
        date: matchDateIso,
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

/**
 * Parses full VolleyStation standings/table copied from the website.
 * Supports:
 * - Multi-line cell-by-cell copy-paste (rank -> [Team](url) -> 16 numbers)
 * - Tab-separated row-by-row copy-paste from table or spreadsheet
 * - Standard space-delimited line format
 */
export function parseVolleyStationTable(raw: string): LeagueTableTeam[] {
  if (!raw || !raw.trim()) return [];

  const rawLines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const headerWords = new Set([
    'drużyna', 'druzyna', 'punkty', 'mecze', 'sety', 'stosunek', 'wynik',
    'rozegr.', 'rozegr', 'wygr.', 'wygr', 'przegr.', 'przegr',
    '3-0', '3-1', '3-2', '2-3', '1-3', '0-3', 'lp', 'poz', 'poz.', 'miejsce', 'bilans'
  ]);

  // Strategy 1: Multi-line cell stream (where each cell is its own line)
  const teams: LeagueTableTeam[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    // Skip table header lines
    if (headerWords.has(lower) || /^(3-[012]|2-3|[01]-3)$/.test(line)) {
      i++;
      continue;
    }

    // Check if line is a tab-separated or multi-space line (Strategy 2)
    const tabCols = line.split(/\t|\s{3,}/).map(c => c.trim()).filter(Boolean);
    if (tabCols.length >= 7) {
      // Possible single-line table row
      const firstIsNum = !isNaN(parseInt(tabCols[0], 10));
      const pos = firstIsNum ? parseInt(tabCols[0], 10) : (teams.length + 1);
      const teamRaw = firstIsNum ? tabCols[1] : tabCols[0];
      let tName = cleanTeamName(teamRaw);
      let tUrl = '';
      const mdMatch = teamRaw.match(/^\[(.*?)\](?:\((https?:\/\/[^\)]+)\))?$/);
      if (mdMatch) {
        tName = cleanTeamName(mdMatch[1]);
        tUrl = mdMatch[2] || '';
      }

      const restNumbers = (firstIsNum ? tabCols.slice(2) : tabCols.slice(1))
        .map(n => n.replace(',', '.'));

      const pts = parseFloat(restNumbers[0]) || 0;
      const matchesPlayed = parseInt(restNumbers[1], 10) || 0;
      const matchesWon = parseInt(restNumbers[2], 10) || 0;
      const matchesLost = parseInt(restNumbers[3], 10) || 0;
      const setsWon = parseInt(restNumbers[4], 10) || 0;
      const setsLost = parseInt(restNumbers[5], 10) || 0;
      const pointsWon = parseInt(restNumbers[6], 10) || 0;
      const pointsLost = parseInt(restNumbers[7], 10) || 0;
      const setRatio = restNumbers[8] ? parseFloat(restNumbers[8]) : undefined;
      const pointRatio = restNumbers[9] ? parseFloat(restNumbers[9]) : undefined;
      const w3_0 = restNumbers[10] ? parseInt(restNumbers[10], 10) : undefined;
      const w3_1 = restNumbers[11] ? parseInt(restNumbers[11], 10) : undefined;
      const w3_2 = restNumbers[12] ? parseInt(restNumbers[12], 10) : undefined;
      const p2_3 = restNumbers[13] ? parseInt(restNumbers[13], 10) : undefined;
      const p1_3 = restNumbers[14] ? parseInt(restNumbers[14], 10) : undefined;
      const p0_3 = restNumbers[15] ? parseInt(restNumbers[15], 10) : undefined;

      const form: ('W' | 'P')[] = [];
      for (let k = 0; k < matchesWon; k++) form.push('W');
      for (let k = 0; k < matchesLost; k++) form.push('P');

      if (tName) {
        teams.push({
          id: `team_${Date.now()}_${teams.length}`,
          position: pos,
          teamName: tName,
          teamUrl: tUrl || undefined,
          points: pts,
          matchesPlayed,
          matchesWon,
          matchesLost,
          setsWon,
          setsLost,
          setRatio,
          pointsWon,
          pointsLost,
          pointRatio,
          w3_0,
          w3_1,
          w3_2,
          p2_3,
          p1_3,
          p0_3,
          form: form.slice(0, 5)
        });
        i++;
        continue;
      }
    }

    // Check if line is a rank/position number, e.g. "1" or "1."
    const rankMatch = line.match(/^(\d+)[.)]?$/);
    if (rankMatch) {
      const position = parseInt(rankMatch[1], 10);
      const nextLine = rawLines[i + 1];
      if (nextLine) {
        let teamName = '';
        let teamUrl = '';

        const mdLinkMatch = nextLine.match(/^\[(.*?)\](?:\((https?:\/\/[^\)]+)\))?$/);
        if (mdLinkMatch) {
          teamName = cleanTeamName(mdLinkMatch[1]);
          teamUrl = mdLinkMatch[2] || '';
        } else if (!headerWords.has(nextLine.toLowerCase()) && isNaN(Number(nextLine))) {
          teamName = cleanTeamName(nextLine);
        }

        if (teamName) {
          i += 2;
          const numTokens: string[] = [];
          while (i < rawLines.length) {
            const token = rawLines[i];
            // If next rank number followed by a team name/link, stop collecting
            if (/^\d{1,2}$/.test(token)) {
              const peekNext = rawLines[i + 1];
              if (peekNext && (peekNext.includes('[') || (!headerWords.has(peekNext.toLowerCase()) && isNaN(Number(peekNext))))) {
                break;
              }
            }
            // Check if token is a valid numeric value
            if (/^-?\d+(?:[.,]\d+)?$/.test(token) || /^\d+[:\-]\d+$/.test(token)) {
              numTokens.push(token);
              i++;
              if (numTokens.length >= 16) break;
            } else {
              break;
            }
          }

          const points = parseFloat(numTokens[0]?.replace(',', '.') || '0') || 0;
          const matchesPlayed = parseInt(numTokens[1] || '0', 10) || 0;
          const matchesWon = parseInt(numTokens[2] || '0', 10) || 0;
          const matchesLost = parseInt(numTokens[3] || '0', 10) || 0;
          const setsWon = parseInt(numTokens[4] || '0', 10) || 0;
          const setsLost = parseInt(numTokens[5] || '0', 10) || 0;
          const pointsWon = parseInt(numTokens[6] || '0', 10) || 0;
          const pointsLost = parseInt(numTokens[7] || '0', 10) || 0;
          const setRatio = numTokens[8] ? parseFloat(numTokens[8].replace(',', '.')) : undefined;
          const pointRatio = numTokens[9] ? parseFloat(numTokens[9].replace(',', '.')) : undefined;
          const w3_0 = numTokens[10] !== undefined ? parseInt(numTokens[10], 10) : undefined;
          const w3_1 = numTokens[11] !== undefined ? parseInt(numTokens[11], 10) : undefined;
          const w3_2 = numTokens[12] !== undefined ? parseInt(numTokens[12], 10) : undefined;
          const p2_3 = numTokens[13] !== undefined ? parseInt(numTokens[13], 10) : undefined;
          const p1_3 = numTokens[14] !== undefined ? parseInt(numTokens[14], 10) : undefined;
          const p0_3 = numTokens[15] !== undefined ? parseInt(numTokens[15], 10) : undefined;

          const form: ('W' | 'P')[] = [];
          for (let k = 0; k < matchesWon; k++) form.push('W');
          for (let k = 0; k < matchesLost; k++) form.push('P');

          teams.push({
            id: `team_${Date.now()}_${teams.length}`,
            position,
            teamName,
            teamUrl: teamUrl || undefined,
            points,
            matchesPlayed,
            matchesWon,
            matchesLost,
            setsWon,
            setsLost,
            setRatio,
            pointsWon,
            pointsLost,
            pointRatio,
            w3_0,
            w3_1,
            w3_2,
            p2_3,
            p1_3,
            p0_3,
            form: form.slice(0, 5)
          });
          continue;
        }
      }
    }

    i++;
  }

  // Fallback: If no teams were parsed by Strategy 1 or 2, try legacy single-line regex
  if (teams.length === 0) {
    rawLines.forEach((line, idx) => {
      if (headerWords.has(line.toLowerCase())) return;
      const endStatsMatch = line.match(/(.*?)\s+(\d+)\s+(\d+)(?:\s+(\d+[:\-]\d+))?(?:\s+(\d+[:\-]\d+))?$/);
      if (endStatsMatch) {
        const lead = endStatsMatch[1].trim();
        const matches = parseInt(endStatsMatch[2], 10) || 0;
        const pts = parseInt(endStatsMatch[3], 10) || 0;
        const setsStr = endStatsMatch[4] || '';
        const ptsStr = endStatsMatch[5] || '';

        const posMatch = lead.match(/^(\d+)[.)\s]+(.*)$/);
        const pos = posMatch ? parseInt(posMatch[1], 10) : (teams.length + 1);
        const teamName = posMatch ? cleanTeamName(posMatch[2]) : cleanTeamName(lead);

        let setsWon = 0;
        let setsLost = 0;
        if (setsStr) {
          const [sw, sl] = setsStr.split(/[:\-]/).map(n => parseInt(n, 10) || 0);
          setsWon = sw || 0;
          setsLost = sl || 0;
        }

        let pointsWon = 0;
        let pointsLost = 0;
        if (ptsStr) {
          const [pw, pl] = ptsStr.split(/[:\-]/).map(n => parseInt(n, 10) || 0);
          pointsWon = pw || 0;
          pointsLost = pl || 0;
        }

        if (teamName) {
          teams.push({
            id: `team_${Date.now()}_${idx}`,
            position: pos,
            teamName,
            matchesPlayed: matches,
            points: pts,
            setsWon,
            setsLost,
            pointsWon,
            pointsLost,
            form: []
          });
        }
      }
    });
  }

  return teams;
}
