import { type Object, ObjectType, type Item, type Book } from "@/models";

export enum DatabaseEvent {
  Books = "books",
  Items = "items",
  Objects = "objects",
  Annotations = "annotations",
  Marks = "marks",
  Notes = "notes",
}

export abstract class Database extends EventTarget {
  abstract open(): Promise<void>;
  abstract close(): Promise<void>;

  abstract putObject(object: Object): Promise<void>;
  abstract getObject(id: string): Promise<Object>;
  abstract getObjects(itemId: string | null, type: ObjectType | null): Promise<Object[]>;
  abstract delObject(mark: Object): Promise<void>;

  abstract putItem(item: Item): Promise<void>;
  abstract getItem(id: string): Promise<Item>;
  abstract getItems(bookId: string | null): Promise<Item[]>;
  abstract delItem(item: Item): Promise<void>;
  abstract updateItems(
    parentId: string,
    newItems: Item[],
    oldItems: Item[],
    delItems: Item[],
  ): Promise<void>;

  abstract putBook(book: Book): Promise<void>;
  abstract getBook(id: string): Promise<Book>;
  abstract getBooks(): Promise<Book[]>;
  abstract delBook(book: Book): Promise<void>;

  abstract getProperty(key: string, fallback: any): Promise<any>;
  abstract setProperty(key: string, value: any): Promise<void>;

  emit(name: DatabaseEvent, detail: any) {
    const event = new CustomEvent(name, { detail: detail });
    this.dispatchEvent(event);
  }
}
