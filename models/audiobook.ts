import { type File, type Item, type Position, ItemType } from "@/models/item";

export interface AudiobookPosition extends Position {}

export interface Audiobook extends Item {
  position: AudiobookPosition;
  length: number;
  rate: number;
  volume: number;
}

export function createAudiobook(bookId: string, name: string, file: File): Audiobook {
  return {
    id: window.crypto.randomUUID(),
    type: ItemType.Audiobook,
    bookId,
    name,
    file,
    order: 1,
    length: 1,
    position: { value: 0 },
    openingFirstTime: true,
    volume: 1,
    rate: 1,
  };
}
