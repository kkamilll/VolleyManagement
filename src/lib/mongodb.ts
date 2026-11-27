import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'volleyhub';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastFailureAt: number | undefined;
}

const RETRY_COOLDOWN_MS = 60 * 1000;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().startsWith('mongodb'));
}

async function connectMongo(): Promise<MongoClient | null> {
  if (!isMongoConfigured() || !uri) return null;

  // If connection failed recently, wait for cooldown before retrying to avoid log spam
  if (global._mongoLastFailureAt && Date.now() - global._mongoLastFailureAt < RETRY_COOLDOWN_MS) {
    return null;
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined;
      global._mongoLastFailureAt = Date.now();
      console.warn(
        '[MongoDB] Brak połączenia z Atlas (używam lokalnej bazy data/db.json):',
        err?.message || err
      );
      throw err;
    });
  }

  try {
    const connected = await global._mongoClientPromise;
    global._mongoLastFailureAt = undefined;
    return connected;
  } catch {
    return null;
  }
}

export async function getMongoClient(): Promise<MongoClient | null> {
  return connectMongo();
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(dbName);
}

export default connectMongo;

