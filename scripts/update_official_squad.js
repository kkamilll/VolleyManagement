const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const standardPasswordHash = '$2a$08$ZQ0QeuDOvE/CoIgY3QZ30.VpGzRnF0wvq5r.4fC4xYezQE7mFNUwy';

const officialSquad = [
  {
    id: 'usr_kierownik',
    name: 'Łukasz Kremer',
    number: 17,
    position: 'Przyjmujący',
    role: 'KIEROWNIK',
    isCaptain: true,
    email: 'lukasz.kremer@angelsztp.pl',
    phone: '+48 506 666 777',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-01T10:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500843/',
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
    name: 'Hubert Obara',
    number: 12,
    position: 'Przyjmujący',
    role: 'TRENER',
    isCaptain: false,
    email: 'hubert.obara@angelsztp.pl',
    phone: '+48 602 345 678',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-01T10:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246308/',
    permissions: {
      canManageMatches: true,
      canManageEvents: true,
      canManageStats: true,
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
    name: 'Kamil Pujanek',
    number: 4,
    position: 'Rozgrywający',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'kamil.pujanek@angelsztp.pl',
    phone: '+48 502 222 333',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-05T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500846/',
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
    height: 197
  },
  {
    id: 'usr_krupa',
    name: 'Tomasz Krupa',
    number: 1,
    position: 'Przyjmujący',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'tomasz.krupa@angelsztp.pl',
    phone: '+48 501 111 222',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-05T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501166/',
    height: 191
  },
  {
    id: 'usr_zadlo',
    name: 'Tomasz Żądło',
    number: 5,
    position: 'Libero',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'tomasz.zadlo@angelsztp.pl',
    phone: '+48 501 555 777',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-05T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246310/',
    height: 182
  },
  {
    id: 'usr_graczyk',
    name: 'Piotr Graczyk',
    number: 7,
    position: 'Przyjmujący',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'piotr.graczyk@angelsztp.pl',
    phone: '+48 503 333 444',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-06T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246307/',
    height: 193
  },
  {
    id: 'usr_smigiel',
    name: 'Michał Śmigiel',
    number: 8,
    position: 'Środkowy',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'michal.smigiel@angelsztp.pl',
    phone: '+48 504 444 555',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-06T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500853/',
    height: 195
  },
  {
    id: 'usr_kruk',
    name: 'Dominik Kruk',
    number: 10,
    position: 'Środkowy',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'dominik.kruk@angelsztp.pl',
    phone: '+48 505 555 666',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-07T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2519064/',
    height: 198
  },
  {
    id: 'usr_kulupa',
    name: 'Paweł Kulupa',
    number: 11,
    position: 'Środkowy',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'pawel.kulupa@angelsztp.pl',
    phone: '+48 505 777 888',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-07T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500844/',
    height: 197
  },
  {
    id: 'usr_shetty',
    name: 'Vikhyath Shetty',
    number: 18,
    position: 'Rozgrywający',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'vikhyath.shetty@angelsztp.pl',
    phone: '+48 506 181 818',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-07T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500847/',
    height: 188
  },
  {
    id: 'usr_ordon',
    name: 'Karol Ordon',
    number: 28,
    position: 'Atakujący',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'karol.ordon@angelsztp.pl',
    phone: '+48 507 777 888',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-08T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2501155/',
    height: 196
  },
  {
    id: 'usr_noak',
    name: 'Maciej Noak',
    number: 47,
    position: 'Środkowy',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'maciej.noak@angelsztp.pl',
    phone: '+48 508 888 999',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-08T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2500845/',
    height: 194
  },
  {
    id: 'usr_suwalski',
    name: 'Stanisław Suwalski',
    number: 55,
    position: 'Środkowy',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'stanislaw.suwalski@angelsztp.pl',
    phone: '+48 509 111 222',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-09T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3246309/',
    height: 197
  },
  {
    id: 'usr_krol',
    name: 'Wit Król',
    number: 91,
    position: 'Atakujący',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'wit.krol@angelsztp.pl',
    phone: '+48 509 919 191',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-09T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/3262373/',
    height: 196
  },
  {
    id: 'usr_augustynek',
    name: 'Bartosz Augustynek',
    number: 97,
    position: 'Atakujący',
    role: 'ZAWODNIK',
    isCaptain: false,
    email: 'bartosz.augustynek@angelsztp.pl',
    phone: '+48 509 999 000',
    status: 'Aktywny',
    passwordHash: standardPasswordHash,
    createdAt: '2026-09-09T12:00:00Z',
    volleystationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/players/2524996/',
    height: 203
  }
];

db.users = officialSquad;

// ALSO UPDATE ROTATION DEFAULTS IN TACTICS IF ANY STORED IN DB
if (db.tactics && Array.isArray(db.tactics)) {
  db.tactics = db.tactics.map(tac => {
    if (tac.positions && Array.isArray(tac.positions)) {
      tac.positions = tac.positions.map(p => {
        if (p.roleCode === 'L') {
          return { ...p, name: 'Tomasz (L)', number: 5 };
        }
        if (p.roleCode === 'R' && (p.number === 28 || p.number === 12)) {
          return { ...p, name: 'Kamil (R)', number: 4 };
        }
        return p;
      });
    }
    return tac;
  });
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully updated Angels ZTP squad to ${officialSquad.length} official players!`);

