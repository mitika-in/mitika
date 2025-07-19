import { type Backend, type BackendOptions, type Outline } from "@/backends/backend";
import { type Node } from "@/backends/ebook/node";

export interface EbookBackendOptions extends BackendOptions {}

export interface EbookOutline extends Outline {
  position: { value: number; x: number; y: number };
}

export interface Page {
  label: string;
  width: number;
  height: number;
}

export interface Match {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EbookBackend extends Backend {
  open(blob: Blob, type: string, options: EbookBackendOptions): Promise<void>;
  getOutlines(): Promise<EbookOutline[]>;
  getPages(): Promise<Page[]>;
  getImageBlob(index: number, scale: number, background: string, foreground: string): Promise<Blob>;
  getImageData(
    index: number,
    scale: number,
    background: string,
    foreground: string,
  ): Promise<ImageData>;
  getNodes(index: number): Promise<Node[]>;
  search(index: number, needle: string): Promise<Match[]>;
}
