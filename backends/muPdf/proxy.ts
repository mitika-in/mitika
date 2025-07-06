import type { PasswordRequiredCallback } from "@/backends/backend";
import type { Page, Match } from "@/backends/ebook";
import type { Node } from "@/backends/ebook/node";
import type { Metadata } from "@/backends/metadata";
import {
  type Request,
  type Response,
  RequestType,
  type MuPdfMetadata,
} from "@/backends/muPdf/communication";
import type { Outline } from "@/backends/outline";
import { useLogger } from "@/logging";
import type { EbookColor } from "@/models";

const { f, debug } = useLogger("muPdfProxy");

export class Proxy {
  private worker: Worker;
  private id: number;
  private requests: Map<number, [resolve: (data: any) => void, reject: (error: Error) => void]>;
  private ready: boolean = false;

  constructor(private passwordCb: PasswordRequiredCallback) {
    this.id = 0;
    this.requests = new Map();
    this.worker = new Worker(new URL("worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event) => this.onMessage(event));
  }

  private onMessage(event: MessageEvent) {
    const response: Response = event.data;
    const value = this.requests.get(response.replyTo);

    debug(f`Response for request: ${response.replyTo}`);

    if (response.replyTo == -1) {
      this.ready = true;
      debug("Worker is ready");
    }

    if (!value) throw new Error(`Invalid response: ${response}`);

    this.requests.delete(response.replyTo);
    const [resolve, reject] = value;

    if (response.data instanceof Error) reject(response.data);
    else resolve(response.data);
  }

  private async request(type: RequestType, args: any[] = [], transfer: any[] = []): Promise<any> {
    const id = this.id++;
    const promise = new Promise<any>((resolve, reject) => {
      this.requests.set(id, [resolve, reject]);
      const request: Request = { id, type, args };
      debug(f`Sending request: ${request}`);
      this.worker.postMessage(request, transfer);
    });
    return promise;
  }

  private async getPassword(retry: boolean): Promise<string> {
    const promise = new Promise<string>((resolve) => {
      this.passwordCb((password) => resolve(password), retry);
    });
    const password = await promise;
    return password;
  }

  private waitForReady(): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      if (this.ready) {
        debug("Worker is already ready");
        resolve();
        return;
      }
      this.requests.set(-1, [resolve, reject]);
    });
    return promise;
  }

  async open(buffer: ArrayBuffer, magic: string): Promise<void> {
    await this.waitForReady();

    await this.request(RequestType.Open, [buffer, magic, window.devicePixelRatio || 1], [buffer]);

    let success: boolean = await this.request(RequestType.Authenticate, [""]);
    let retry = false;
    while (!success) {
      let password = await this.getPassword(retry);
      success = await this.request(RequestType.Authenticate, [password]);
      retry = true;
    }
  }

  async close(): Promise<void> {
    await this.request(RequestType.Close);
  }

  async getMetadata(): Promise<Metadata> {
    const rawMetadata: MuPdfMetadata = await this.request(RequestType.GetMetadata);
    const cover = new Blob([rawMetadata.cover], { type: "image/png" });
    const metadata = { name: rawMetadata.name, authors: rawMetadata.authors, cover };
    return metadata;
  }

  async getOutlines(): Promise<Outline[]> {
    const outlines: Outline[] = await this.request(RequestType.GetOutlines);
    return outlines;
  }

  async getPages(): Promise<Page[]> {
    const pages: Page[] = await this.request(RequestType.GetPages);
    return pages;
  }

  async getImageData(index: number, color: EbookColor, scale: number): Promise<ImageData> {
    const imageData: ImageData = await this.request(RequestType.GetImageData, [
      index,
      color,
      scale,
    ]);
    return imageData;
  }

  async getNodes(index: number): Promise<Node[]> {
    const nodes: Node[] = await this.request(RequestType.GetNodes, [index]);
    return nodes;
  }

  async getBlob(index: number, color: EbookColor): Promise<Blob> {
    const array: Uint8Array = await this.request(RequestType.GetArray, [index, color]);
    const blob = new Blob([array], { type: "image/png" });
    return blob;
  }

  async search(index: number, needle: string): Promise<Match[]> {
    const matches: Match[] = await this.request(RequestType.Search, [index, needle]);
    return matches;
  }
}
