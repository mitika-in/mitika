import { Proxy } from "./proxy";
import {
  type EbookBackend,
  type Page,
  type EbookBackendOptions,
  type EbookOutline,
  type Match,
} from "@/backends/ebook";
import type { Metadata } from "@/backends/backend";
import type { Node } from "@/backends/ebook/node";

export class MuPdf implements EbookBackend {
  private proxy!: Proxy;

  async open(blob: Blob, type: string, options: EbookBackendOptions) {
    this.proxy = new Proxy(options.passwordCb);
    await this.proxy.open(await blob.arrayBuffer(), type);
  }

  async close() {
    await this.proxy.close();
  }

  async getMetadata(): Promise<Metadata> {
    const metadata = await this.proxy.getMetadata();
    return metadata;
  }

  async getOutlines(): Promise<EbookOutline[]> {
    const outlines = await this.proxy.getOutlines();
    return outlines;
  }

  async getPages(): Promise<Page[]> {
    const pages = await this.proxy.getPages();
    return pages;
  }

  async getImageBlob(
    index: number,
    scale: number,
    background: string,
    foreground: string,
  ): Promise<Blob> {
    const blob = await this.proxy.getImageBlob(index, scale, background, foreground);
    return blob;
  }

  async getImageData(
    index: number,
    scale: number,
    background: string,
    foreground: string,
  ): Promise<ImageData> {
    const imageData = await this.proxy.getImageData(index, scale, background, foreground);
    return imageData;
  }

  async getNodes(index: number): Promise<Node[]> {
    const nodes = await this.proxy.getNodes(index);
    return nodes;
  }

  async search(index: number, needle: string): Promise<Match[]> {
    const matches = await this.proxy.search(index, needle);
    return matches;
  }
}
