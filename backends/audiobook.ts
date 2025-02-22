import { Backend, type BackendOptions } from "@/backends/backend";

export interface AudiobookBackendOptions extends BackendOptions {}

export abstract class AudiobookBackend extends Backend {
  abstract override open(blob: Blob, options: AudiobookBackendOptions): Promise<void>;
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract getLength(): Promise<number>;
  abstract setRate(rate: number): Promise<void>;
  abstract setVolume(volume: number): Promise<void>;
}
