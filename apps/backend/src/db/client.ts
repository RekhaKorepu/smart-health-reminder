import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI is not set. Please check your .env file.");
}

export const mongoClient = new MongoClient(uri);

export async function connectClient(): Promise<MongoClient> {
  await mongoClient.connect();
  return mongoClient;
}

export async function closeClient(): Promise<void> {
  await mongoClient.close();
}
