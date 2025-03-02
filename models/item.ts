import { type File } from "@/models/file";
import { type Position } from "@/models/position";

export enum ItemType {
  Audiobook,
  Ebook,
}

export interface Item {
  id: string;
  type: ItemType;
  parentId: string;
  order: number;
  name: string;
  file: File;
  position: Position;
  openingFirstTime: boolean;
}
