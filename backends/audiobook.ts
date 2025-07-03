import { Backend, type BackendOptions, type InitOptions } from "@/backends/backend";
import { type Position } from "@/models";

export type EndedCallback = () => void;

export type PositionChangedCallback = (position: Position) => void;

export interface AudiobookInitOptions extends InitOptions {
  position: Position;
  rate: number;
  volume: number;
}

export interface AudiobookBackendOptions extends BackendOptions {
  positionCb: PositionChangedCallback;
  endedCb: EndedCallback;
}

export abstract class AudiobookBackend extends Backend {
  constructor(backendOptions: AudiobookBackendOptions, initOptions: AudiobookInitOptions) {
    super(backendOptions, initOptions);
  }
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract getLength(): Promise<number>;
  abstract setPosition(position: Position): Promise<void>;
  abstract setRate(rate: number): Promise<void>;
  abstract setVolume(volume: number): Promise<void>;
}
