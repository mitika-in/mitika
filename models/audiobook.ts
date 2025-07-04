import { type File } from "@/models/file";
import { type Item, ItemType } from "@/models/item";

export interface Audiobook extends Item {
  length: number;
  rate: number;
  volume: number;
}

export function createAudiobook(parentId: string, name: string, file: File): Audiobook {
  return {
    id: window.crypto.randomUUID(),
    type: ItemType.Audiobook,
    parentId,
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
