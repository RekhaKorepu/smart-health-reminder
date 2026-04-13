import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not set.");

let connected = false;
export const client = new MongoClient(uri);

export async function getDb() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db(process.env.DB_NAME ?? "smart_health");
}
