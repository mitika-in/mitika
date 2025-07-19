import { type Backend, type BackendOptions, type Outline } from "@/backends/backend";

export type EndedCallback = () => void;

export type PositionChangedCallback = (position: number) => void;

export interface AudiobookBackendOptions extends BackendOptions {
  positionCb: PositionChangedCallback;
  endedCb: EndedCallback;
}

export interface AudiobookOutline extends Outline {
  position: number;
}

export interface AudiobookBackend extends Backend {
  open(blob: Blob, type: string, options: AudiobookBackendOptions): Promise<void>;
  getOutlines(): Promise<AudiobookOutline[]>;
  play(): Promise<void>;
  pause(): Promise<void>;
  getLength(): Promise<number>;
  setPosition(position: number): Promise<void>;
  setRate(rate: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
}
