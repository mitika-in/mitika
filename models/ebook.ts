import { ColorScheme } from "@/models/colorScheme";
import { type File } from "@/models/file";
import { type Item, ItemType } from "@/models/item";
import { type Position } from "@/models/position";

export interface EbookColor {
  background: number;
  foreground: number;
}

export enum EbookLayout {
  Single,
  DualStart,
  DualEnd,
}

export interface EbookPosition extends Position {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Ebook extends Item {
  color: EbookColor;
  flip: boolean;
  layout: EbookLayout;
  position: EbookPosition;
  rotate: number;
  scale: number;
}

export function createEbook(parentId: string, name: string, file: File): Ebook {
  return {
    id: window.crypto.randomUUID(),
    type: ItemType.Ebook,
    parentId,
    name,
    file,
    order: 1,
    position: { id: "", name: "1", x: 0, y: 0 },
    openingFirstTime: true,
    color: ColorScheme.Original,
    flip: false,
    layout: EbookLayout.DualStart,
    rotate: 0,
    scale: 1,
  };
}
