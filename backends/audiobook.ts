import { Backend, type ProgressCallback } from "@/backends/backend";

export type EndedCallback = () => void;

export abstract class AudiobookBackend extends Backend {
  abstract open(blob: Blob, progressCb: ProgressCallback, endedCb: EndedCallback): Promise<void>;
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract setRate(rate: number): Promise<void>;
  abstract setVolume(volume: number): Promise<void>;
}
