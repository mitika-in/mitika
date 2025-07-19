import { type Position } from "@/models/item";

export enum ObjectType {
  Annotation = "annotation",
  Mark = "mark",
  Note = "note",
}

export interface Object {
  id: string;
  itemId: string;
  type: ObjectType;
  position: Position;
}

export interface Annotation extends Object {
  text: string;
  rects: { x: number; y: number; width: number; height: number }[];
  background: string;
}

export interface Mark extends Object {
  name: string;
}

export interface Note extends Object {
  name: string;
  description: string;
}

export function createAnnotation(
  itemId: string,
  position: Position,
  text: string,
  rects: { x: number; y: number; width: number; height: number }[],
  background: string,
): Annotation {
  return {
    id: window.crypto.randomUUID(),
    itemId,
    type: ObjectType.Annotation,
    position,
    text,
    rects,
    background,
  };
}

export function createMark(itemId: string, position: Position, name: string): Mark {
  return { id: window.crypto.randomUUID(), itemId, type: ObjectType.Mark, position, name };
}

export function createNote(
  itemId: string,
  position: Position,
  name: string,
  description: string,
): Note {
  return {
    id: window.crypto.randomUUID(),
    itemId,
    type: ObjectType.Note,
    position,
    name,
    description,
  };
}
