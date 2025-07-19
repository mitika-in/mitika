export enum ItemType {
  Audiobook,
  Ebook,
}

export interface File {
  name: string;
  type: `${string}/${string}`;
  source: string;
}

export interface Position {
  value: number;
}

export interface Item {
  id: string;
  type: ItemType;
  bookId: string;
  order: number;
  name: string;
  file: File;
  position: Position;
  openingFirstTime: boolean;
}
