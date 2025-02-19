import { type Outline } from "@/backends/outline";

export type ProgressCallback = (position: number) => void;

export abstract class Backend {
  abstract close(): Promise<void>;
  abstract getName(): Promise<string>;
  abstract getAuthors(): Promise<string[]>;
  abstract getCover(): Promise<Blob | null>;
  abstract getLength(): Promise<number>;
  abstract getOutlines(): Promise<Outline[]>;
  abstract setPosition(position: number): Promise<void>;
}
