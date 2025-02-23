import { useLogger } from "@/logging";
import { ItemType, type Mark, type Note, type Item, type Book } from "@/models";

const { f, debug } = useLogger("database");

const DATABSE_NAME = "main";
const DATABASE_VERSION = 1;

async function promisifyTransaction(transaction: IDBTransaction) {
  await new Promise((resolve, reject) => {
    transaction.onabort = () => {
      reject(new Error("Transaction aborted"));
    };
    transaction.onerror = () => {
      const msg = transaction.error ? transaction.error.message : "Unknown error";
      reject(new Error(msg));
    };
    transaction.oncomplete = () => {
      resolve(null);
    };
  });
}

function setupDatabase(database: IDBDatabase) {
  const storeOptions = { keyPath: "id" };
  const indexOptions = { unique: false, multiEntry: false };

  const marks = database.createObjectStore("marks", storeOptions);
  marks.createIndex("parentIndex", "parentId", indexOptions);

  const notes = database.createObjectStore("notes", storeOptions);
  notes.createIndex("parentIndex", "parentId", indexOptions);

  const items = database.createObjectStore("items", storeOptions);
  items.createIndex("parentIndex", "parentId", indexOptions);

  database.createObjectStore("books", storeOptions);
}

/* upgradeN means upgrade from vN-1 to vN. */

function upgrade2(database: IDBDatabase) {
  throw new Error("Upgrading to future version");
}

const upgradations: Record<string, (database: IDBDatabase) => void> = {
  v2: upgrade2,
};

function upgrade(database: IDBDatabase, oldVersion: number) {
  if (oldVersion == 0) {
    debug("Setting up database");
    setupDatabase(database);
    return;
  }

  for (let version = oldVersion + 1; version <= DATABASE_VERSION; version++) {
    debug(f`Upgrading to v${version}`);
    upgradations[`v${version}`](database);
  }
}

export class Database {
  private database: IDBDatabase | null = null;

  async open() {
    debug(f`Opening database v${DATABASE_VERSION}`);

    if (this.database != null) {
      throw new Error("Database already open");
    }

    const request = window.indexedDB.open(DATABSE_NAME, DATABASE_VERSION);
    await new Promise((resolve, reject) => {
      request.onblocked = () => {
        reject(new Error("Database opening is blocked"));
      };
      request.onerror = () => {
        reject(new Error(request.error?.message));
      };
      request.onupgradeneeded = (event) => {
        debug(f`Upgrade needed from ${event.oldVersion}`);
        this.database = request.result;
        upgrade(this.database, event.oldVersion);
      };
      request.onsuccess = () => {
        this.database = request.result;
        resolve(null);
      };
    });
  }

  async close() {
    debug(f`Closing database`);

    this.database!.close();
    this.database = null;
  }

  private async upsert<T extends { id: string }>(obj: T, storeName: string): Promise<T> {
    const transaction = this.database!.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(obj);
    await promisifyTransaction(transaction);
    return obj;
  }

  private async add<T extends { id: string }>(obj: T, storeName: string): Promise<T> {
    debug(f`Adding ${obj} to ${storeName}`);

    return this.upsert(obj, storeName);
  }

  private async get<T>(id: string, storeName: string): Promise<T> {
    debug(f`Getting id=${id} from ${storeName}`);

    const transaction = this.database!.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const req = store.get(id!);
    await promisifyTransaction(transaction);
    if (req.result == null) throw new Error(`${storeName}.${id} not found`);
    return req.result;
  }

  private async getAll<T>(storeName: string, parentId: string | null = null): Promise<T[]> {
    debug(f`Getting all parentId=${parentId} from ${storeName}`);

    const transaction = this.database!.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    let req;
    if (parentId == null) {
      req = store.getAll();
    } else {
      const index = store.index("parentIndex");
      req = index.getAll(parentId);
    }
    await promisifyTransaction(transaction);
    return req.result;
  }

  private async put<T extends { id: string }>(obj: T, storeName: string): Promise<T> {
    debug(f`Putting ${obj} to ${storeName}`);

    return this.upsert(obj, storeName);
  }

  private async del<T extends { id: string }>(obj: T, storeName: string) {
    debug(f`Deleting ${obj} from ${storeName}`);

    const transaction = this.database!.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.delete(obj.id!);
    await promisifyTransaction(transaction);
  }

  async addMark(mark: Mark): Promise<Mark> {
    return this.add(mark, "marks");
  }

  async getMark(id: string): Promise<Mark> {
    return this.get(id, "marks");
  }

  async getMarks(parentId: string): Promise<Mark[]> {
    return await this.getAll("marks", parentId);
  }

  async putMark(mark: Mark): Promise<Mark> {
    return this.put(mark, "marks");
  }

  async delMark(mark: Mark) {
    await this.del(mark, "marks");
  }

  async addNote(note: Note): Promise<Note> {
    return this.add(note, "notes");
  }

  async getNote(id: string): Promise<Note> {
    return this.get(id, "notes");
  }

  async getNotes(parentId: string): Promise<Note[]> {
    return this.getAll("notes", parentId);
  }

  async putNote(note: Note): Promise<Note> {
    return this.put(note, "notes");
  }

  async delNote(note: Note) {
    await this.del(note, "notes");
  }

  async addItem(item: Item): Promise<Item> {
    return this.add(item, "items");
  }

  async getItem(id: string): Promise<Item> {
    return this.get(id, "items");
  }

  async getItems(parentId: string, type: ItemType | null): Promise<Item[]> {
    debug(f`Getting all parentId=${parentId} and type=${type} from items`);

    const items: Item[] = await this.getAll("items", parentId);
    return items
      .filter((item) => type == null || item.type == type)
      .sort((a, b) => a.order - b.order);
  }

  async putItem(item: Item): Promise<Item> {
    return this.put(item, "items");
  }

  async delItem(item: Item) {
    debug(f`Deleting ${item} from items`);

    const transaction = this.database!.transaction(["marks", "notes", "items"], "readwrite");
    for (const storeName of ["marks", "notes"]) {
      const store = transaction.objectStore(storeName);
      const index = store.index("parentIndex");
      const req = index.openKeyCursor(item.id);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    }
    const store = transaction.objectStore("items");
    store.delete(item.id!);
    await promisifyTransaction(transaction);
  }

  async updateItems(parentId: string, newItems: Item[], oldItems: Item[], delItems: Item[]) {
    debug(f`Updating items of parentId=${parentId}`);
    debug(f`  newItems=${newItems}`);
    debug(f`  oldItems=${oldItems}`);
    debug(f`  delItems=${delItems}`);

    const transaction = this.database!.transaction(["marks", "notes", "items"], "readwrite");
    const items = transaction.objectStore("items");

    const setDelItems = new Set(delItems.map((item) => item.id!));
    const index = items.index("parentIndex");
    const req = index.openKeyCursor(parentId);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (setDelItems.has(cursor.primaryKey as string)) {
          for (const storeName of ["marks", "notes"]) {
            const store = transaction.objectStore(storeName);
            const index = store.index("parentIndex");
            const req = index.openKeyCursor(cursor.primaryKey);
            req.onsuccess = () => {
              const cursor = req.result;
              if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
              }
            };
          }
          items.delete(cursor.primaryKey);
        }
        cursor.continue();
      }
    };

    for (const item of [...oldItems, ...newItems]) {
      items.put(item);
    }

    await promisifyTransaction(transaction);
  }

  async addBook(book: Book): Promise<Book> {
    return this.add(book, "books");
  }

  async getBook(id: string): Promise<Book> {
    return await this.get(id, "books");
  }

  async getBooks(): Promise<Book[]> {
    return this.getAll("books");
  }

  async putBook(book: Book): Promise<Book> {
    return this.put(book, "books");
  }

  async delBook(book: Book) {
    debug(f`Deleting ${book} from books`);

    const transaction = this.database!.transaction(
      ["marks", "notes", "items", "books"],
      "readwrite",
    );
    const items = transaction.objectStore("items");
    const index = items.index("parentIndex");
    const req = index.openKeyCursor(book.id);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        for (const storeName of ["marks", "notes"]) {
          const store = transaction.objectStore(storeName);
          const index = store.index("parentIndex");
          const req = index.openKeyCursor(cursor.primaryKey);
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              store.delete(cursor.primaryKey);
              cursor.continue();
            }
          };
        }
        items.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    const books = transaction.objectStore("books");
    books.delete(book.id!);
    await promisifyTransaction(transaction);
  }
}

let database: Database;

export async function useDatabase(): Promise<Database> {
  if (database == null) {
    database = new Database();
    await database.open();
  }
  return database;
}
