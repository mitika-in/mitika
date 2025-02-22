import { Backend, type BackendOptions } from "@/backends/backend";
import type { EbookColor, EbookLayout, EbookPosition } from "@/models";

export type ScaleChangedCallback = (scale: number) => void;

export interface EbookBackendOptions extends BackendOptions {
  container: HTMLDivElement;
  gap: number;
  scaleCb: ScaleChangedCallback;
}

export abstract class EbookBackend extends Backend {
  abstract override open(blob: Blob, options: EbookBackendOptions): Promise<void>;
  abstract getPages(): Promise<EbookPosition[]>;
  abstract setColor(color: EbookColor): Promise<void>;
  abstract setLayout(layout: EbookLayout): Promise<void>;
  abstract setRotation(rotation: number): Promise<void>;
  abstract setScale(scale: number): Promise<void>;
  abstract scaleToFitWidth(): Promise<void>;
  abstract scaleToFitHeight(): Promise<void>;
  abstract scaleToFitPage(): Promise<void>;
}
