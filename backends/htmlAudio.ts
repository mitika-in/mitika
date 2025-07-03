import {
  AudiobookBackend,
  type AudiobookBackendOptions,
  type AudiobookInitOptions,
  type PositionChangedCallback,
  type EndedCallback,
} from "@/backends/audiobook";
import type { Metadata } from "@/backends/metadata";
import type { Outline } from "@/backends/outline";
import { useLogger } from "@/logging";
import type { Position } from "@/models";

const { debug } = useLogger("htmlAudio");

export class HtmlAudio extends AudiobookBackend {
  private audio!: HTMLAudioElement;

  private endedCb: EndedCallback;
  private positionCb: PositionChangedCallback;

  private position: number;
  private rate: number;
  private volume: number;

  constructor(backendOptions: AudiobookBackendOptions, initOptions: AudiobookInitOptions) {
    super(backendOptions, initOptions);

    this.endedCb = backendOptions.endedCb;
    this.positionCb = backendOptions.positionCb;

    this.position = initOptions.position.value;
    this.rate = initOptions.rate;
    this.volume = initOptions.volume;
  }

  private onError() {
    throw this.audio.error;
  }

  private onTimeUpdate() {
    const currentTime = this.audio.currentTime;
    const position = {
      name: currentTime.toString(),
      value: currentTime,
    };
    this.positionCb(position);
  }

  async open(blob: Blob) {
    this.audio = new Audio(URL.createObjectURL(blob));
    this.audio.currentTime = this.position;
    this.audio.playbackRate = this.rate;
    this.audio.volume = this.volume;
    this.audio.addEventListener("error", () => this.onError());
    this.audio.addEventListener("timeupdate", () => this.onTimeUpdate());
    this.audio.addEventListener("ended", this.endedCb);
  }

  async close() {
    this.audio.pause();
    URL.revokeObjectURL(this.audio.src);
  }

  async getMetadata(): Promise<Metadata> {
    const name = "";
    const authors: string[] = [];
    const cover = null;
    const metadata = { name, authors, cover };
    return metadata;
  }

  async getLength(): Promise<number> {
    if (!isNaN(this.audio.duration)) return this.audio.duration;

    debug("Unknown duration, so waiting for duration change");
    await new Promise((resolve) => this.audio.addEventListener("durationchange", resolve));

    return this.audio.duration;
  }

  async getOutlines(): Promise<Outline[]> {
    return [];
  }

  async setPosition(position: Position) {
    this.audio.currentTime = position.value;
  }

  async play() {
    this.audio.play();
  }

  async pause() {
    this.audio.pause();
  }

  async setRate(rate: number) {
    debug(`Changing to rate: ${rate}`);
    this.audio.playbackRate = rate;
  }

  async setVolume(volume: number) {
    debug(`Changing to volume: ${volume}`);
    this.audio.volume = volume;
  }
}
