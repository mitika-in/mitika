import { type Position } from "@/models/position";

export interface Mark {
  id: string;
  parentId: string;
  name: string;
  position: Position;
}

export function createMark(parentId: string, name: string, position: Position): Mark {
  return { id: window.crypto.randomUUID(), parentId, name, position };
}
