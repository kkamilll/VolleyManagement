const fs = require('fs');
const path = require('path');

const raw = `Zawodnik	Pozycja	Drużyna	Punkty	Akcje
ABS	Ata	Blk	Ser	%Druż	Wygr.	Rozegr.	%Wygr.	%Rozegr.
1	Wojtek Rymarski	przyjmujący	VOL	52	37	6	9	31%	266	518	51%	86%
2	Michał Stelmaszyk	atakujący	GLA	46	39	5	2	30%	250	454	55%	95%
3	Michał Maliński	przyjmujący	VOL	37	29	6	2	22%	240	485	49%	81%
4	Dominik Olejnik	przyjmujący	COC	37	26	4	7	30%	224	440	51%	100%
5	Łukasz Kremer	przyjmujący	ANG	33	31	1	1	25%	188	361	52%	75%
6	Kamil Kowalski	atakujący	CZE	29	25	1	3	24%	227	504	45%	81%
7	Jakub Świerczyński	przyjmujący	GLA	27	26	1	0	17%	258	476	54%	100%
8	Mateusz Kicerman	atakujący	COC	27	22	4	1	22%	224	440	51%	100%
9	Paweł Abramowicz	środkowy	KOT	27	20	5	2	21%	213	459	46%	85%
10	Paweł Królikowski	przyjmujący	CZE	27	24	2	1	22%	270	622	43%	100%
11	Szymon Arend	przyjmujący	AFE	24	19	1	4	18%	163	300	54%	77%
12	Damian Gralak	przyjmujący	VOL	23	16	1	6	13%	170	341	50%	57%
13	Bogdan Voropai	przyjmujący	GLA	22	19	1	2	14%	180	330	55%	69%
14	Sebastian Augustynek	środkowy	COC	21	11	9	1	17%	128	256	50%	58%
15	Mikołaj Glinkowski	przyjmujący	KOT	21	17	1	3	16%	221	487	45%	90%
16	Mateusz Ceglarski	atakujący	VOL	17	15	1	1	10%	133	258	52%	43%
17	Piotr Szyszka	atakujący	AFE	17	16	0	1	13%	105	197	53%	51%
18	Wojciech Drożdż	środkowy	CZE	17	16	0	1	14%	120	292	41%	46%
19	Krzysztof Zieliński	atakujący	CZE	17	15	1	1	14%	185	433	43%	69%
20	Michał Śmigiel	środkowy	ANG	16	10	5	1	12%	91	183	50%	38%
21	Adam Król	przyjmujący	AFE	16	12	1	3	12%	151	250	60%	64%
22	Franciszek Paterka	środkowy	KOT	15	10	3	2	12%	79	179	44%	33%
23	Łukasz Gliździński	przyjmujący	CZE	15	14	0	1	12%	213	493	43%	79%
24	Igor Mianowany	środkowy	GLA	14	11	1	2	9%	147	280	53%	58%
25	Bartosz Augustynek	atakujący	ANG	14	11	3	0	10%	120	236	51%	49%
26	Jan Klimczak	przyjmujący	COC	14	10	1	3	11%	224	440	51%	100%
27	Cezary Glinkowski	przyjmujący	KOT	14	9	3	2	11%	155	354	44%	65%
28	Wojciech Jarmużek	środkowy	VOL	13	8	2	3	7%	135	276	49%	46%
29	Eryk Nowaczyk	atakujący	KOT	13	9	2	2	10%	54	122	44%	22%
30	Jakub Filipowicz	przyjmujący	KOT	13	13	0	0	10%	163	354	46%	65%
31	Piotr Chlebowski	środkowy	GLA	12	5	7	0	7%	59	121	49%	25%
32	Jakub Makowski	rozgrywający	COC	12	4	3	5	10%	224	440	51%	100%
33	Oliwier Małecki	przyjmujący	KOT	12	10	2	0	9%	121	270	45%	50%
34	Michał Szymański	przyjmujący	AFE	12	6	2	4	9%	77	140	55%	36%
35	Piotr Graczyk	przyjmujący	ANG	12	10	1	1	9%	114	207	55%	43%
36	Hubert Mądrzejewski	środkowy	AFE	11	7	3	1	8%	85	167	51%	43%
37	Aleksander Waszkiel	przyjmujący	CZE	11	9	0	2	9%	85	189	45%	30%
38	Wit Król	atakujący	ANG	11	10	1	0	8%	50	88	57%	18%
39	Seweryn Wasilewski	środkowy	AFE	10	5	4	1	7%	101	186	54%	48%
40	Cezary Włodarczyk	atakujący	AFE	10	9	0	1	7%	99	172	58%	44%
41	Mateusz Filipiak-Gimiński	przyjmujący	GLA	10	9	0	1	6%	77	142	54%	29%
42	Dominik Kruk	środkowy	ANG	10	5	3	2	7%	98	176	56%	36%
43	Jakub Zacharczyk	rozgrywający	VOL	9	4	1	4	5%	269	527	51%	88%
44	Hubert Obara	przyjmujący	ANG	9	8	1	0	7%	100	180	56%	37%
45	Maciek Noak	środkowy	ANG	8	5	2	1	6%	56	116	48%	24%
46	Bartłomiej Dekiert	środkowy	COC	8	2	5	1	6%	130	255	51%	57%
47	Dawid Urbanowski	rozgrywający	AFE	8	4	2	2	6%	71	130	55%	33%
48	Michał Kłosowski	środkowy	AFE	7	2	2	3	5%	31	57	54%	14%
49	Wojciech Pakuła	rozgrywający	AFE	6	2	0	4	4%	152	271	56%	70%
50	Cyprian Michalak	rozgrywający	GLA	5	3	1	1	3%	183	349	52%	73%
51	Tomasz Krupa	przyjmujący	ANG	5	4	0	1	3%	102	210	49%	43%
52	Jędrzej Radzioch	środkowy	VOL	5	4	1	0	3%	137	250	55%	41%
53	Nikodem Szyminczak	przyjmujący	AFE	5	4	0	1	3%	38	84	45%	21%
54	Jan Kaczmarek	środkowy	GLA	5	1	4	0	3%	42	71	59%	14%
55	Wojciech Nowak	atakujący	GLA	4	4	0	0	2%	8	22	36%	4%
56	Kamil Pujanek	rozgrywający	ANG	4	0	3	1	3%	202	391	52%	81%
57	Karol Ordon	atakujący	ANG	4	3	1	0	3%	132	243	54%	50%
58	Michał Bobrowicz	przyjmujący	VOL	4	3	1	0	2%	85	151	56%	25%
59	Paweł Robaszyński	rozgrywający	KOT	4	2	0	2	3%	180	400	45%	74%
60	Wiktor Ignaszak	środkowy	AFE	4	2	2	0	3%	25	38	66%	9%
61	Marcin Skrzypczak	środkowy	KOT	4	3	1	0	3%	37	69	54%	12%
62	Michał Garstka	środkowy	GLA	3	1	1	1	1%	44	81	54%	17%
63	Daniel Sady	rozgrywający	GLA	3	1	2	0	1%	75	127	59%	26%
64	Kornelia Ziętkiewicz	libero	VOL	2	2	0	0	1%	0	0	-	0%
65	Mikołaj Nowak	przyjmujący	VOL	2	2	0	0	1%	38	71	54%	11%
66	Szymon Stanisławski	rozgrywający	KOT	2	1	0	1	1%	88	180	49%	33%
67	Marcin Leśniewski	rozgrywający	CZE	2	2	0	0	1%	222	516	43%	82%
68	Stanisław Suwalski	środkowy	ANG	2	1	1	0	1%	40	77	52%	16%
69	Olga Puto	rozgrywający	CZE	2	1	0	1	1%	85	189	45%	30%
70	Dobromił Charlęża	środkowy	VOL	1	0	1	0	0%	42	97	43%	16%
71	Jakub Stegenta	przyjmujący	GLA	1	1	0	0	0%	3	8	38%	1%
72	Patryk Wojtkowiak	libero	COC	1	1	0	0	0%	0	0	-	0%
73	Jakub Wytykowski	atakujący	VOL	0	0	0	0	0%	19	44	43%	7%
74	Daniel Dębski	rozgrywający	VOL	0	0	0	0	0%	23	54	43%	9%
75	Krzysztof Kaźmierczak	środkowy	VOL	0	0	0	0	0%	0	1	0%	0%
76	Grzegorz Wiśniewski	rozgrywający	CZE	0	0	0	0	0%	173	389	44%	62%`;

const teamMap = {
  'VOL': 'Volleyboars',
  'GLA': 'Gladiatorzy BUD-WENT',
  'COC': 'Coco Jumbo',
  'ANG': 'Angels ZTP',
  'CZE': 'Czelendż',
  'KOT': 'Koty Broniszewice',
  'AFE': 'Afera Volley'
};

const angelsNumberMap = {
  'Tomasz Krupa': 1,
  'Kamil Pujanek': 4,
  'Tomasz Żądło': 5,
  'Piotr Graczyk': 7,
  'Michał Śmigiel': 8,
  'Dominik Kruk': 10,
  'Paweł Kulupa': 11,
  'Hubert Obara': 12,
  'Łukasz Kremer': 17,
  'Vikhyath Shetty': 18,
  'Karol Ordon': 28,
  'Maciej Noak': 47,
  'Maciek Noak': 47,
  'Stanisław Suwalski': 55,
  'Wit Król': 91,
  'Bartosz Augustynek': 97
};

const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
const parsed = [];

for (const line of lines) {
  const parts = line.split('\t').map(p => p.trim());
  if (parts.length < 8) continue;
  const rank = parseInt(parts[0], 10);
  if (isNaN(rank)) continue;

  const name = parts[1];
  const position = parts[2];
  const teamCode = parts[3];
  const totalPoints = parseInt(parts[4], 10) || 0;
  const attack = parseInt(parts[5], 10) || 0;
  const block = parseInt(parts[6], 10) || 0;
  const serve = parseInt(parts[7], 10) || 0;
  const teamPointsPercent = parts[8] || '0%';
  const ralliesWon = parseInt(parts[9], 10) || 0;
  const ralliesPlayed = parseInt(parts[10], 10) || 0;
  const ralliesWonPercent = parts[11] || '-';
  const ralliesPlayedPercent = parts[12] || '-';

  const fullTeamName = teamMap[teamCode] || teamCode;
  const isAngels = teamCode === 'ANG' || fullTeamName.toLowerCase().includes('angel');
  const number = isAngels ? angelsNumberMap[name] : undefined;

  parsed.push({
    rank,
    name,
    number,
    position,
    teamCode,
    team: fullTeamName,
    isAngels,
    totalPoints,
    totalAttack: attack,
    totalBlock: block,
    totalServe: serve,
    teamPointsPercent,
    ralliesWon,
    ralliesPlayed,
    ralliesWonPercent,
    ralliesPlayedPercent
  });
}

console.log('Successfully parsed', parsed.length, 'players from official VolleyStation ranking.');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const backupPath = path.join(__dirname, '..', 'data', 'db.backup.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Store full league player rankings in db
db.leaguePlayerRankings = parsed;

// 2. Update stats for each Angels ZTP player in db.users
const angelsPlayers = parsed.filter(p => p.isAngels);

db.users = db.users.map(u => {
  const matching = angelsPlayers.find(p => 
    p.name.toLowerCase() === u.name.toLowerCase() ||
    (u.name.includes('Noak') && p.name.includes('Noak')) ||
    (u.number && p.number === u.number)
  );

  if (matching) {
    u.stats = {
      ...(u.stats || {}),
      totalPoints: matching.totalPoints,
      attackPoints: matching.totalAttack,
      blockPoints: matching.totalBlock,
      servePoints: matching.totalServe,
      acePoints: matching.totalServe,
      matchesPlayed: u.stats?.matchesPlayed || 3
    };
  }
  return u;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf8');
}

console.log('Updated db.json and db.backup.json with official leaguePlayerRankings and synchronized Angels player stats!');

