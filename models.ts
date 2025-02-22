function uuid(): string {
  return window.crypto.randomUUID();
}

export interface Position {}

export interface Mark {
  id: string;
  parentId: string;
  name: string;
  description: string;
  position: Position;
}

export function createMark(
  parentId: string,
  name: string,
  description: string,
  position: string,
): Mark {
  return { id: uuid(), parentId, name, description, position };
}

export interface Note {
  id: string;
  parentId: string;
  name: string;
  description: string;
  position: Position;
}

export function createNote(
  parentId: string,
  name: string,
  description: string,
  position: string,
): Note {
  return { id: uuid(), parentId, name, description, position };
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
  position: Position;
  openingFirstTime: boolean;
}

export interface AudiobookPosition extends Position {
  id: number;
}

export interface Audiobook extends Item {
  length: number;
  position: AudiobookPosition;
  rate: number;
  volume: number;
}

export function createAudiobook(parentId: string, name: string, file: File): Audiobook {
  return {
    id: uuid(),
    type: ItemType.AUDIOBOOK,
    parentId,
    name,
    file,
    length: 1,
    position: { id: 0 },
    openingFirstTime: true,
    volume: 1,
    rate: 1,
  };
}

export interface EbookColor {
  foreground: number;
  background: number;
}

export enum EbookLayout {
  SINGLE,
  DUAL_START,
  DUAL_END,
}

export interface EbookPosition extends Position {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Ebook extends Item {
  color: EbookColor;
  layout: EbookLayout;
  position: EbookPosition;
  rotation: number;
  scale: number;
}

export function createEbook(parentId: string, name: string, file: File): Ebook {
  return {
    id: uuid(),
    type: ItemType.EBOOK,
    parentId,
    name,
    file,
    position: { id: "", name: "1", x: 0, y: 0 },
    openingFirstTime: true,
    color: { foreground: 0x000, background: 0xfff },
    layout: EbookLayout.DUAL_START,
    rotation: 0,
    scale: 1,
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
