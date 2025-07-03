import { type Position } from "@/models/position";

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
  position: Position,
): Note {
  return { id: window.crypto.randomUUID(), parentId, name, description, position };
}
