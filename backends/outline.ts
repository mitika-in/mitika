export interface Outline {
  name: string;
  destination: { position: number; x: number; y: number };
  children: Outline[];
}
