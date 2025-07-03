import { Backend, type BackendOptions, type InitOptions } from "@/backends/backend";
import { type Node } from "@/backends/ebook/node";
import { type EbookColor, type EbookPosition } from "@/models";

export interface EbookInitOptions extends InitOptions {}

export interface EbookBackendOptions extends BackendOptions {}

export interface Page {
  position: EbookPosition;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Match {
  rect: Rect;
}

export abstract class EbookBackend extends Backend {
  constructor(backendOptions: EbookBackendOptions, initOptions: EbookInitOptions) {
    super(backendOptions, initOptions);
  }
  abstract getPages(): Promise<Page[]>;
  abstract getImageData(index: number, color: EbookColor, scale: number): Promise<ImageData>;
  abstract getNodes(index: number): Promise<Node[]>;
  abstract getBlob(index: number, color: EbookColor): Promise<Blob>;
  abstract search(index: number, needle: string): Promise<Match[]>;
}
