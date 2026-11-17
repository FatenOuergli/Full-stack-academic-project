import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';

// Each test file gets its own throw-away in-memory MongoDB.
let mongod;

export async function startTestDb() {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri('patisserie-test'));
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function clearTestDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

export async function stopTestDb() {
  await disconnectDB();
  await mongod?.stop();
}
