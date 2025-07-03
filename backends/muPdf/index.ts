import { Proxy } from "./proxy";
import {
  EbookBackend,
  type Page,
  type EbookBackendOptions,
  type EbookInitOptions,
  type Match,
} from "@/backends/ebook";
import type { Node } from "@/backends/ebook/node";
import { type Metadata } from "@/backends/metadata";
import { type Outline } from "@/backends/outline";
import { useLogger } from "@/logging";
import { type EbookColor } from "@/models";

const { f, debug } = useLogger("muPdf");

export class MuPdf extends EbookBackend {
  private proxy: Proxy;

  constructor(backendOptions: EbookBackendOptions, initOptions: EbookInitOptions) {
    super(backendOptions, initOptions);

    this.proxy = new Proxy(backendOptions.passwordCb);
  }

  async open(blob: Blob, mimeType: string) {
    await this.proxy.open(await blob.arrayBuffer(), mimeType);
  }

  async close() {
    await this.proxy.close();
  }

  async getMetadata(): Promise<Metadata> {
    const metadata = await this.proxy.getMetadata();
    return metadata;
  }

  async getOutlines(): Promise<Outline[]> {
    const outlines = await this.proxy.getOutlines();
    return outlines;
  }

  async getPages(): Promise<Page[]> {
    const pages = await this.proxy.getPages();
    return pages;
  }

  async getImageData(index: number, color: EbookColor, scale: number): Promise<ImageData> {
    const imageData = await this.proxy.getImageData(index, color, scale);
    return imageData;
  }

  async getNodes(index: number): Promise<Node[]> {
    const nodes = await this.proxy.getNodes(index);
    return nodes;
  }

  async getBlob(index: number, color: EbookColor): Promise<Blob> {
    const blob = await this.proxy.getBlob(index, color);
    return blob;
  }

  async search(index: number, needle: string): Promise<Match[]> {
    const matches = await this.proxy.search(index, needle);
    return matches;
  }
}
