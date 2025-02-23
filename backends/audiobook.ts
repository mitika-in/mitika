import { Backend, type BackendOptions } from "@/backends/backend";

export type EndedCallback = () => void;

export interface AudiobookBackendOptions extends BackendOptions {
  endedCb: EndedCallback;
}

export abstract class AudiobookBackend extends Backend {
  abstract override open(blob: Blob, options: AudiobookBackendOptions): Promise<void>;
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract getLength(): Promise<number>;
  abstract setRate(rate: number): Promise<void>;
  abstract setVolume(volume: number): Promise<void>;
}
