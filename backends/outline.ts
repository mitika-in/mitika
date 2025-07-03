import type { Position } from "@/models";

export interface Outline {
  id: string;
  name: string;
  position: Position;
  children: Outline[];
}
