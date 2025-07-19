import { type Database, DatabaseEvent } from "@/database/database";
import { IndexedDb } from "@/database/indexedDb";

let database: Database;

export async function useDatabase(): Promise<Database> {
  if (database) return database;

  if (window.indexedDB) database = new IndexedDb();
  else throw new Error("Unknown database");

  await database.open();

  return database;
}

export { type Database, DatabaseEvent };
