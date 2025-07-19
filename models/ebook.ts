import { type File, type Item, type Position, ItemType } from "@/models/item";

export enum EbookLayout {
  Single = "single",
  DualStart = "dualStart",
  DualEnd = "dualEnd",
}

export interface EbookPosition extends Position {
  x: number;
  y: number;
}

export enum EbookResizePolicy {
  None = "none",
  FitWidth = "fitWidth",
  FitHeight = "fitHeight",
  FitPage = "fitPage",
}

export interface Ebook extends Item {
  position: EbookPosition;
  background: string;
  foreground: string;
  flip: boolean;
  layout: EbookLayout;
  rotate: number;
  scale: number;
  resizePolicy: EbookResizePolicy;
}

export function createEbook(bookId: string, name: string, file: File): Ebook {
  return {
    id: window.crypto.randomUUID(),
    type: ItemType.Ebook,
    bookId,
    name,
    file,
    order: 1,
    position: { value: 0, x: 0, y: 0 },
    openingFirstTime: true,
    background: "#ffffff",
    foreground: "#000000",
    flip: false,
    layout: EbookLayout.Single,
    rotate: 0,
    scale: 1,
    resizePolicy: EbookResizePolicy.FitPage,
  };
}
