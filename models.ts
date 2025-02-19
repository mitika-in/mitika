function uuid(): string {
  return window.crypto.randomUUID();
}

export interface Mark {
  id: string;
  parentId: string;
  name: string;
  description: string;
  position: number;
}

export function createMark(
  parentId: string,
  name: string,
  description: string,
  position: number,
): Mark {
  return { id: uuid(), parentId, name, description, position };
}

export interface Note {
  id: string;
  parentId: string;
  name: string;
  description: string;
  position: number;
  options: object;
}

export function createNote(
  parentId: string,
  name: string,
  description: string,
  position: number,
  options: object,
): Note {
  return { id: uuid(), parentId, name, description, position, options };
}

export enum ItemType {
  AUDIOBOOK,
  EBOOK,
}

export interface File {
  id: string;
  name: string;
  type: string;
  storage: string;
}

export interface Item {
  id: string;
  type: ItemType;
  parentId: string;
  name: string;
  file: File;
  length: number;
  position: number;
  openingFirstTime: boolean;
}

export interface Audiobook extends Item {
  volume: number;
  rate: number;
}

export function createAudiobook(parentId: string, name: string, file: File): Audiobook {
  return {
    id: uuid(),
    type: ItemType.AUDIOBOOK,
    parentId,
    name,
    file,
    length: 1,
    position: 0,
    openingFirstTime: true,
    volume: 1,
    rate: 1,
  };
}

export enum PageLayout {
  SINGLE,
  DUAL_START,
  DUAL_END,
}

export interface Ebook extends Item {
  scale: number;
  layout: PageLayout;
  black: number;
  white: number;
}

export function createEbook(parentId: string, name: string, file: File): Ebook {
  return {
    id: uuid(),
    type: ItemType.EBOOK,
    parentId,
    name,
    file,
    length: 1,
    position: 1,
    openingFirstTime: true,
    scale: 1,
    layout: PageLayout.DUAL_START,
    black: 0x000000,
    white: 0xffffff,
  };
}

export interface Book {
  id: string;
  name: string;
  authors: string[];
  lastAudiobookId: number | null;
  lastEbookId: number | null;
  lastOpened: Date;
  tags: string[];
}

export function createBook(name: string): Book {
  return {
    id: uuid(),
    name,
    authors: [],
    lastAudiobookId: null,
    lastEbookId: null,
    lastOpened: new Date(),
    tags: [],
  };
}
