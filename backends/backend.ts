import { type Position } from "@/models";
import { type Outline } from "@/backends/outline";

export type PasswordRequiredCallback = (
  callback: (password: string) => void,
  retry: boolean,
) => void;

export type PositionChangedCallback = (position: Position) => void;

export interface BackendOptions {
  passwordCb: PasswordRequiredCallback;
  positionCb: PositionChangedCallback;
}

export abstract class Backend {
  abstract open(blob: Blob, options: BackendOptions): Promise<void>;
  abstract close(): Promise<void>;
  abstract getAuthors(): Promise<string[]>;
  abstract getCover(): Promise<Blob | null>;
  abstract getName(): Promise<string>;
  abstract getOutlines(): Promise<Outline[]>;
  abstract setPosition(position: Position): Promise<void>;
}
