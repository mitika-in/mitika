import type { DatabaseEvent } from "@/database/databaseEvent";
import { type Mark, type Note, type Item, type Book } from "@/models";

export abstract class Database extends EventTarget {
  abstract open(): Promise<void>;
  abstract close(): Promise<void>;

  abstract putMark(mark: Mark): Promise<void>;
  abstract getMark(id: string): Promise<Mark>;
  abstract getMarks(parentId: string | null): Promise<Mark[]>;
  abstract delMark(mark: Mark): Promise<void>;

  abstract putNote(note: Note): Promise<void>;
  abstract getNote(id: string): Promise<Note>;
  abstract getNotes(parentId: string | null): Promise<Note[]>;
  abstract delNote(note: Note): Promise<void>;

  abstract putItem(item: Item): Promise<void>;
  abstract getItem(id: string): Promise<Item>;
  abstract getItems(parentId: string | null): Promise<Item[]>;
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
