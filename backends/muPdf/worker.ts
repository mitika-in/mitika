import type { Page, Match, EbookOutline } from "@/backends/ebook";
import {
  type ExternalLinkNode,
  type Font,
  type InternalLinkNode,
  type Node,
  type TextNode,
  NodeType,
} from "@/backends/ebook/node";
import {
  RequestType,
  type Request,
  type Response,
  type MuPdfMetadata,
} from "@/backends/muPdf/communication";
import * as mupdf from "mupdf";

interface MuPdfOutlineItem {
  title: string | undefined;
  uri: string | undefined;
  open: boolean;
  down?: MuPdfOutlineItem[];
  page?: number;
}

type MuPdfRect = [ulx: number, uly: number, lrx: number, lry: number];

type MuPdfQuad = [
  ulx: number,
  uly: number,
  urx: number,
  ury: number,
  llx: number,
  lly: number,
  lrx: number,
  lry: number,
];

interface MuPdfLine {
  bbox: { x: number; y: number; w: number; h: number };
  font: Font;
  text: string;
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function mupdfRectToRect(rect: MuPdfRect): Rect {
  const [ulx, uly, lrx, lry] = rect;
  const x = ulx;
  const y = uly;
  const width = lrx - ulx;
  const height = lry - uly;
  return { x, y, width, height };
}

function mupdfQuadToRect(quad: MuPdfQuad): Rect {
  const [ulx, uly, urx, ury, llx, lly, lrx, lry] = quad;
  const left = Math.max(ulx, llx);
  const right = Math.max(urx, lrx);
  const top = Math.max(uly, ury);
  const bottom = Math.max(lly, lry);
  const rect = { x: left, y: top, width: right - left, height: bottom - top };
  return rect;
}

function linkToExternalLinkNode(link: mupdf.Link): ExternalLinkNode {
  const uri = link.getURI();
  const box = mupdfRectToRect(link.getBounds());
  const node = {
    type: NodeType.ExternalLink,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    uri,
  };
  return node;
}

function linkToInternalLinkNode(
  link: mupdf.Link,
  position: { value: number; x: number; y: number },
): InternalLinkNode {
  const box = mupdfRectToRect(link.getBounds());
  const node = {
    type: NodeType.InternalLink,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    position,
  };
  return node;
}

function lineToTextNode(line: MuPdfLine): TextNode {
  const node = {
    type: NodeType.Text,
    x: line.bbox.x,
    y: line.bbox.y,
    width: line.bbox.w,
    height: line.bbox.h,
    font: {
      family: line.font.family,
      weight: line.font.weight,
      style: line.font.style,
      size: line.font.size,
    },
    text: line.text,
  };

  return node;
}

class MuPdfWorker {
  private doc: mupdf.Document;
  private epub: boolean = false;
  private dpr: number = 1;

  constructor(buffer: ArrayBuffer, magic: string, dpr: number) {
    this.doc = mupdf.Document.openDocument(buffer, magic);
    this.dpr = dpr;
    if (magic == "application/epub+zip") this.epub = true;
  }

  authenticate(password: string): boolean {
    const success = this.doc.authenticatePassword(password) != 0;
    return success;
  }

  close() {
    this.doc.destroy();
  }

  getMetadata(): MuPdfMetadata {
    const name = this.doc.getMetaData(mupdf.Document.META_INFO_TITLE) || "";

    const authors = [];
    const author = this.doc.getMetaData(mupdf.Document.META_INFO_AUTHOR);
    if (author) authors.push(author);

    const cover = this.getImageArray(0, 1, "#ffffff", "#000000");

    return { name, authors, cover };
  }

  private formatLabel(index: number, label: string): string {
    if (this.epub || label.length == 0) return (index + 1).toString();
    return label;
  }

  private resolve(uri: string): { value: number; x: number; y: number } {
    const dest = this.doc.resolveLinkDestination(uri);
    return { value: dest.page, x: dest.x, y: dest.y };
  }

  private toOutlines(outlineItems: MuPdfOutlineItem[] | null | undefined): EbookOutline[] {
    if (outlineItems == null) return [];
    return outlineItems.map((o) => this.toOutline(o)).filter((o) => o != null);
  }

  private toOutline(outlineItem: MuPdfOutlineItem): EbookOutline | null {
    if (!outlineItem.uri || !outlineItem.title) return null;

    const id = outlineItem.uri;
    const name = outlineItem.title;
    const position = this.resolve(outlineItem.uri);
    const children = this.toOutlines(outlineItem.down);

    return { id, name, position, children };
  }

  getOutlines(): EbookOutline[] {
    const outlines = this.toOutlines(this.doc.loadOutline());
    return outlines;
  }

  getPages(): Page[] {
    const pages = [];
    const length = this.doc.countPages();

    for (let i = 0; i < length; i++) {
      const page = this.doc.loadPage(i);
      const label = this.formatLabel(i, page.getLabel());
      const rect = mupdfRectToRect(page.getBounds());
      pages.push({ label, width: rect.width, height: rect.height });
      page.destroy();
    }

    return pages;
  }

  getPixmap(index: number, scale: number, background: string, foreground: string): mupdf.Pixmap {
    const fg = parseInt(foreground.substring(1), 16);
    const bg = parseInt(background.substring(1), 16);

    const page = this.doc.loadPage(index);

    const matrix = mupdf.Matrix.scale(scale * this.dpr, scale * this.dpr);
    const bbox = mupdf.Rect.transform(page.getBounds(), matrix);
    const pixmap = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, bbox, true);
    pixmap.clear(255);

    const device = new mupdf.DrawDevice(matrix, pixmap);
    page.run(device, mupdf.Matrix.identity);

    pixmap.tint(fg, bg);

    device.close();
    page.destroy();

    return pixmap;
  }

  getImageArray(index: number, scale: number, background: string, foreground: string): Uint8Array {
    const pixmap = this.getPixmap(index, scale, background, foreground);
    const array = pixmap.asPNG();
    return array;
  }

  getImageData(index: number, scale: number, background: string, foreground: string): ImageData {
    const pixmap = this.getPixmap(index, scale, background, foreground);
    const imageData = new ImageData(pixmap.getPixels(), pixmap.getWidth(), pixmap.getHeight());
    return imageData;
  }

  getNodes(index: number): Node[] {
    const page = this.doc.loadPage(index);

    const nodes: Node[] = [];

    const structTxt = page.toStructuredText();
    const txt = JSON.parse(structTxt.asJSON(1));
    for (const block of txt.blocks) {
      if (block.type == "text") {
        for (const line of block.lines) {
          const node = lineToTextNode(line);
          nodes.push(node);
        }
      }
    }

    const pageLinks = page.getLinks();
    for (const link of pageLinks) {
      let node;
      if (link.isExternal()) node = linkToExternalLinkNode(link);
      else node = linkToInternalLinkNode(link, this.resolve(link.getURI()));
      nodes.push(node);
    }

    page.destroy();

    return nodes;
  }

  search(index: number, needle: string): Match[] {
    const page = this.doc.loadPage(index);
    const hits = page.search(needle);
    const matches = [];

    for (const quads of hits) {
      const first = mupdfQuadToRect(quads[0]);
      const last = mupdfQuadToRect(quads[quads.length - 1]);
      const match = {
        x: first.x,
        y: first.y,
        width: last.x + last.width - first.x,
        height: last.y + last.height - first.y,
      };
      matches.push(match);
    }

    page.destroy();

    return matches;
  }
}

let worker: MuPdfWorker | null;

self.onmessage = (message) => {
  const request = message.data as Request;
  const args = request.args;
  let data;
  let transfer: Transferable[] = [];

  console.log("Request:", message.data);
  try {
    switch (request.type) {
      case RequestType.Authenticate:
        data = worker!.authenticate(args[0]);
        break;
      case RequestType.Close:
        data = worker!.close();
        break;
      case RequestType.GetMetadata:
        data = worker!.getMetadata();
        transfer = [data.cover.buffer];
        break;
      case RequestType.GetOutlines:
        data = worker!.getOutlines();
        break;
      case RequestType.GetPages:
        data = worker!.getPages();
        break;
      case RequestType.GetImageArray:
        data = worker!.getImageArray(args[0], args[1], args[2], args[3]);
        break;
      case RequestType.GetImageData:
        data = worker!.getImageData(args[0], args[1], args[2], args[3]);
        break;
      case RequestType.GetNodes:
        data = worker!.getNodes(args[0]);
        break;
      case RequestType.Open:
        worker = new MuPdfWorker(args[0], args[1], args[2]);
        break;
      case RequestType.Search:
        data = worker!.search(args[0], args[1]);
        break;
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  } catch (error) {
    if (error instanceof Error) data = error;
    else throw error;
  }

  const response: Response = { replyTo: request.id, data };
  self.postMessage(response, transfer);
};

const ready: Response = { replyTo: -1, data: null };
self.postMessage(ready);
