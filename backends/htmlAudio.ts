import { useLogger } from "@/logging";
import { AudiobookBackend, type AudiobookBackendOptions } from "@/backends/audiobook";
import type { Outline } from "@/backends/outline";
import type { AudiobookPosition } from "@/models";

const { debug } = useLogger("htmlAudio");

export class HtmlAudio extends AudiobookBackend {
  private audio!: HTMLAudioElement;
  private options!: AudiobookBackendOptions;

  onError() {
    throw this.audio.error;
  }

  onTimeUpdate() {
    const position = { id: this.audio.currentTime };
    this.options.positionCb(position);
  }

  async open(blob: Blob, options: AudiobookBackendOptions) {
    this.audio = new Audio(URL.createObjectURL(blob));
    this.options = options;
    this.audio.addEventListener("error", () => this.onError());
    this.audio.addEventListener("timeupdate", () => this.onTimeUpdate());
  }

  async close() {
    this.audio.pause();
    URL.revokeObjectURL(this.audio.src);
  }

  async getName(): Promise<string> {
    return "";
  }

  async getAuthors(): Promise<string[]> {
    return [];
  }

  async getCover(): Promise<Blob | null> {
    return null;
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

  async setPosition(position: AudiobookPosition) {
    this.audio.currentTime = position.id;
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
