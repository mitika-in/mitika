import { Database, DatabaseEvent } from "@/database/database";
import { useLogger } from "@/logging";
import { type Object, ObjectType, type Item, type Book } from "@/models";

const { f, debug } = useLogger("indexedDb");

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

  const objects = database.createObjectStore("objects", storeOptions);
  objects.createIndex("parentIndex", "itemId", indexOptions);

  const items = database.createObjectStore("items", storeOptions);
  items.createIndex("parentIndex", "bookId", indexOptions);

  database.createObjectStore("books", storeOptions);

  database.createObjectStore("settings");
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

export class IndexedDb extends Database {
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

  private async put<T extends { id: string }>(obj: T, storeName: string) {
    debug(f`Puting ${obj} to ${storeName}`);
    const transaction = this.database!.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(obj);
    await promisifyTransaction(transaction);
  }

  private async get<T>(id: string, storeName: string): Promise<T> {
    debug(f`Getting id: ${id} from ${storeName}`);
    const transaction = this.database!.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const req = store.get(id!);
    await promisifyTransaction(transaction);
    if (req.result == null) throw new Error(`${storeName}.${id} not found`);
    return req.result;
  }

  private async getAll<T>(storeName: string, parentId: string | null = null): Promise<T[]> {
    debug(f`Getting all ${storeName} of parentId: ${parentId}`);
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

  private async del<T extends { id: string }>(obj: T, storeName: string) {
    debug(f`Deleting ${obj} from ${storeName}`);
    const transaction = this.database!.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.delete(obj.id!);
    await promisifyTransaction(transaction);
  }

  async putObject(object: Object) {
    await this.put(object, "objects");

    if (object.type == ObjectType.Mark) this.emit(DatabaseEvent.Marks, null);
    else if (object.type == ObjectType.Note) this.emit(DatabaseEvent.Notes, null);
    else this.emit(DatabaseEvent.Objects, null);
  }

  async getObject(id: string): Promise<Object> {
    return this.get(id, "objects");
  }

  async getObjects(itemId: string | null, type: ObjectType | null): Promise<Object[]> {
    const objects: Object[] = await this.getAll("objects", itemId);
    return objects
      .filter((o) => (type != null ? o.type == type : true))
      .sort((a, b) => a.position.value - b.position.value);
  }

  async delObject(object: Object) {
    await this.del(object, "objects");

    if (object.type == ObjectType.Mark) this.emit(DatabaseEvent.Marks, null);
    else if (object.type == ObjectType.Note) this.emit(DatabaseEvent.Notes, null);
    else this.emit(DatabaseEvent.Objects, null);
  }

  async putItem(item: Item) {
    await this.put(item, "items");

    this.emit(DatabaseEvent.Items, null);
  }

  async getItem(id: string): Promise<Item> {
    return this.get(id, "items");
  }

  async getItems(bookId: string | null): Promise<Item[]> {
    const items: Item[] = await this.getAll("items", bookId);
    return items.sort((a, b) => a.order - b.order);
  }

  async delItem(item: Item) {
    debug(f`Deleting ${item} from items`);
    const transaction = this.database!.transaction(["objects", "items"], "readwrite");

    const objects = transaction.objectStore("objects");
    const index = objects.index("parentIndex");
    const req = index.openKeyCursor(item.id);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        objects.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    const items = transaction.objectStore("items");
    items.delete(item.id!);
    await promisifyTransaction(transaction);

    this.emit(DatabaseEvent.Items, null);
  }

  async updateItems(parentId: string, newItems: Item[], oldItems: Item[], delItems: Item[]) {
    debug(f`Updating items of parentId: ${parentId}`);
    debug(f`  newItems: ${newItems}`);
    debug(f`  oldItems: ${oldItems}`);
    debug(f`  delItems: ${delItems}`);
    const transaction = this.database!.transaction(["objects", "items"], "readwrite");

    const items = transaction.objectStore("items");
    const setDelItems = new Set(delItems.map((item) => item.id!));
    const index = items.index("parentIndex");
    const req = index.openKeyCursor(parentId);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (setDelItems.has(cursor.primaryKey as string)) {
          const objects = transaction.objectStore("objects");
          const index = objects.index("parentIndex");
          const req = index.openKeyCursor(cursor.primaryKey);
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              objects.delete(cursor.primaryKey);
              cursor.continue();
            }
          };
          items.delete(cursor.primaryKey);
        }
        cursor.continue();
      }
    };

    for (const item of [...oldItems, ...newItems]) {
      items.put(item);
    }

    await promisifyTransaction(transaction);

    this.emit(DatabaseEvent.Items, null);
  }

  async putBook(book: Book) {
    await this.put(book, "books");

    this.emit(DatabaseEvent.Books, null);
  }

  async getBook(id: string): Promise<Book> {
    return await this.get(id, "books");
  }

  async getBooks(): Promise<Book[]> {
    return this.getAll("books");
  }

  async delBook(book: Book) {
    debug(f`Deleting ${book} from books`);
    const transaction = this.database!.transaction(["objects", "items", "books"], "readwrite");

    const items = transaction.objectStore("items");
    const index = items.index("parentIndex");
    const req = index.openKeyCursor(book.id);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const objects = transaction.objectStore("objects");
        const index = objects.index("parentIndex");
        const req = index.openKeyCursor(cursor.primaryKey);
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            objects.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        items.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    const books = transaction.objectStore("books");
    books.delete(book.id!);
    await promisifyTransaction(transaction);

    this.emit(DatabaseEvent.Books, null);
  }

  async getProperty(key: string, fallback: any): Promise<any> {
    debug(`Getting key: ${key}`);
    const transaction = this.database!.transaction("settings", "readonly");
    const store = transaction.objectStore("settings");
    const req = store.get(key);
    await promisifyTransaction(transaction);
    if (req.result != null) return req.result;
    return fallback;
  }

  async setProperty(key: string, value: any): Promise<void> {
    debug(f`Setting key: ${key} to value: ${value}`);
    const transaction = this.database!.transaction("settings", "readwrite");
    const store = transaction.objectStore("settings");
    store.put(value, key);
    await promisifyTransaction(transaction);
  }
}
