import { MongoClient } from 'mongodb';
import fs from 'fs';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = 'mongodb+srv://antoss277_db_user:aH6fyowdNaxOydxR@cluster0.vqwi8j9.mongodb.net/angels_ztp?retryWrites=true&w=majority';
console.log('Łączenie z MongoDB Atlas (cluster0)...');

async function run() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    console.log('Połączono pomyślnie z klastrem MongoDB Atlas!');
    const db = client.db('angels_ztp');
    
    const raw = fs.readFileSync('./data/db.json', 'utf8');
    const localDb = JSON.parse(raw);

    // 1. Zapis do kolekcji app_state (główny stan aplikacji używany przez db.ts)
    await db.collection('app_state').updateOne(
      { _id: 'main' },
      { $set: { data: localDb, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    console.log('Zapisano app_state (main document)');

    // 2. Dodatkowo zapełniamy przejrzyste kolekcje widoczne w Atlas Data Explorer
    if (Array.isArray(localDb.users) && localDb.users.length > 0) {
      await db.collection('users').deleteMany({});
      await db.collection('users').insertMany(localDb.users.map(u => ({ ...u, _id: u.id })));
      console.log(`Zapisano ${localDb.users.length} użytkowników/zawodników w kolekcji 'users'`);
    }

    if (Array.isArray(localDb.events) && localDb.events.length > 0) {
      await db.collection('events').deleteMany({});
      await db.collection('events').insertMany(localDb.events.map(e => ({ ...e, _id: e.id })));
      console.log(`Zapisano ${localDb.events.length} wydarzeń w kolekcji 'events'`);
    }

    if (Array.isArray(localDb.matches) && localDb.matches.length > 0) {
      await db.collection('matches').deleteMany({});
      await db.collection('matches').insertMany(localDb.matches.map(m => ({ ...m, _id: m.id })));
      console.log(`Zapisano ${localDb.matches.length} meczów w kolekcji 'matches'`);
    }

    if (Array.isArray(localDb.fees) && localDb.fees.length > 0) {
      await db.collection('fees').deleteMany({});
      await db.collection('fees').insertMany(localDb.fees.map(f => ({ ...f, _id: f.id })));
      console.log(`Zapisano ${localDb.fees.length} składek w kolekcji 'fees'`);
    }

    if (Array.isArray(localDb.tacticalPlays) && localDb.tacticalPlays.length > 0) {
      await db.collection('tactics').deleteMany({});
      await db.collection('tactics').insertMany(localDb.tacticalPlays.map(t => ({ ...t, _id: t.id })));
      console.log(`Zapisano ${localDb.tacticalPlays.length} zagrywek w kolekcji 'tactics'`);
    }

    if (localDb.lalsTable && Array.isArray(localDb.lalsTable)) {
      await db.collection('lals_table').deleteMany({});
      await db.collection('lals_table').insertMany(localDb.lalsTable);
      console.log(`Zapisano ${localDb.lalsTable.length} wierszy tabeli LALS`);
    }

    console.log('SUKCES: Baza angels_ztp w MongoDB Atlas została w pełni zainicjalizowana!');
  } catch (err) {
    console.error('BŁĄD POŁĄCZENIA:', err.message);
  } finally {
    await client.close();
  }
}

run();
