import { useLogger } from "@/logging";
import { AudiobookBackend, type EndedCallback, type ProgressCallback } from "@/backends/audiobook";
import type { Outline } from "@/backends/outline";

const { debug } = useLogger("htmlAudio");

export class HtmlAudio extends AudiobookBackend {
  private audio!: HTMLAudioElement;

  async open(blob: Blob, progressCb: ProgressCallback, endedCb: EndedCallback) {
    this.audio = new Audio(URL.createObjectURL(blob));
    this.audio.addEventListener("error", () => {
      if (this.audio.src) throw this.audio.error;
    });
    this.audio.addEventListener("timeupdate", () => progressCb(this.audio.currentTime));
    this.audio.addEventListener("seeked", () =>
      debug(`Seeked to position: ${this.audio.currentTime}`),
    );
    this.audio.addEventListener("ended", () => endedCb());
  }

  async close() {
    this.audio.pause();
    this.audio.src = "";
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
