import {
  type AudiobookBackend,
  type AudiobookBackendOptions,
  type AudiobookOutline,
  type PositionChangedCallback,
  type EndedCallback,
} from "@/backends/audiobook";
import type { Metadata } from "@/backends/backend";
import { useLogger } from "@/logging";

const { debug } = useLogger("htmlAudio");

export class HtmlAudio implements AudiobookBackend {
  private audio!: HTMLAudioElement;

  private positionCb!: PositionChangedCallback;
  private endedCb!: EndedCallback;

  private onError() {
    throw this.audio.error;
  }

  private onTimeUpdate() {
    const position = this.audio.currentTime;
    this.positionCb(position);
  }

  async open(blob: Blob, type: string, options: AudiobookBackendOptions) {
    this.positionCb = options.positionCb;
    this.endedCb = options.endedCb;

    this.audio = new Audio(URL.createObjectURL(blob));

    this.audio.addEventListener("error", () => this.onError());
    this.audio.addEventListener("timeupdate", () => this.onTimeUpdate());
    this.audio.addEventListener("ended", () => this.endedCb());
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

  async getOutlines(): Promise<AudiobookOutline[]> {
    return [];
  }

  async setPosition(position: number) {
    this.audio.currentTime = position;
  }

  async play() {
    this.audio.play();
  }

  async pause() {
    this.audio.pause();
  }

  async setRate(rate: number) {
    this.audio.playbackRate = rate;
  }

  async setVolume(volume: number) {
    this.audio.volume = volume;
  }
}
