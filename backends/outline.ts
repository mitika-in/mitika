import type { Position } from "@/models";

export interface Outline {
  name: string;
  position: Position;
  children: Outline[];
}
