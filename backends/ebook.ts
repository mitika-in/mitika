import { Backend, type ProgressCallback } from "@/backends/backend";
import type { PageLayout } from "~/models";

export interface EbookPageView {
  position: number;
  height: number;
  width: number;
}

export type ScaleChangedCallback = (scale: number) => void;
export type PasswordCallback = (callback: (password: string) => void, retry: boolean) => void;

export abstract class EbookBackend extends Backend {
  abstract open(
    blob: Blob,
    container: HTMLDivElement,
    gap: number,
    progressCb: ProgressCallback,
    scaleCb: ScaleChangedCallback,
    passwordCb: PasswordCallback,
  ): Promise<void>;
  abstract getPages(): Promise<EbookPageView[]>;
  abstract setLayout(layout: PageLayout): Promise<void>;
  abstract setScale(scale: number): Promise<void>;
  abstract scaleToFitWidth(): Promise<void>;
  abstract scaleToFitHeight(): Promise<void>;
  abstract scaleToFitPage(): Promise<void>;
  abstract setRotation(rotation: number): Promise<void>;
  abstract setColors(white: number, black: number): Promise<void>;
}
