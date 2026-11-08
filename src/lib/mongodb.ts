import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'angels_ztp';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().startsWith('mongodb'));
}

if (isMongoConfigured() && uri) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured() || !clientPromise) return null;
  try {
    return await clientPromise;
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err);
    return null;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(dbName);
}

export default clientPromise;

