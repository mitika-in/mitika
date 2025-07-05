import type { Page, Match, Rect } from "@/backends/ebook";
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
import type { Outline } from "@/backends/outline";
import type { EbookColor, EbookPosition } from "@/models";
import { ColorScheme } from "@/models";
import * as mupdf from "mupdf";

interface RawOutline {
  title: string | undefined;
  uri: string | undefined;
  open: boolean;
  down?: RawOutline[];
  page?: number;
}

function mupdfRectToRect(mupdfRect: [ulx: number, uly: number, lrx: number, lry: number]): Rect {
  const [ulx, uly, lrx, lry] = mupdfRect;
  const x = ulx;
  const y = uly;
  const width = lrx - ulx;
  const height = lry - uly;
  return { x, y, width, height };
}

function mupdfQuadToRect(
  mupdfQuad: [
    ulx: number,
    uly: number,
    urx: number,
    ury: number,
    llx: number,
    lly: number,
    lrx: number,
    lry: number,
  ],
): Rect {
  const [ulx, uly, urx, ury, llx, lly, lrx, lry] = mupdfQuad;
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

function linkToInternalLinkNode(link: mupdf.Link, position: EbookPosition): InternalLinkNode {
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

function lineToTextNode(line: {
  bbox: { x: number; y: number; w: number; h: number };
  font: Font;
  text: string;
  x: number;
  y: number;
}): TextNode {
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

  constructor(buffer: ArrayBuffer, magic: string) {
    this.doc = mupdf.Document.openDocument(buffer, magic);
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
    const cover = this.getArray(0, ColorScheme.Original);
    return { name, authors, cover };
  }

  private getLabel(index: number, page: mupdf.Page): string {
    if (this.epub) return (index + 1).toString();
    return page.getLabel() || (index + 1).toString();
  }

  private resolve(uri: string): EbookPosition {
    const dest = this.doc.resolveLinkDestination(uri);
    const page = this.doc.loadPage(dest.page);
    const name = this.getLabel(dest.page, page);
    return { name, value: dest.page, x: dest.x, y: dest.y };
  }

  private toOutline(rawOutline: RawOutline): Outline | null {
    if (!rawOutline.uri || !rawOutline.title) return null;

    const id = rawOutline.uri;
    const name = rawOutline.title;
    const position = this.resolve(rawOutline.uri);
    const children = rawOutline.down
      ? rawOutline.down.map((o) => this.toOutline(o)).filter((o) => o != null)
      : [];
    return { id, name, position, children };
  }

  getOutlines(): Outline[] {
    const rawOutlines: RawOutline[] | null = this.doc.loadOutline();
    const outlines = rawOutlines
      ? rawOutlines.map((o) => this.toOutline(o)).filter((o) => o != null)
      : [];
    return outlines;
  }

  getPages(): Page[] {
    const pages = [];
    const length = this.doc.countPages();

    for (let i = 0; i < length; i++) {
      const page = this.doc.loadPage(i);
      const name = this.getLabel(i, page);
      const position = { name, value: i, x: 0, y: 0 };
      const rect = mupdfRectToRect(page.getBounds());
      pages.push({ position, width: rect.width, height: rect.height });
    }

    return pages;
  }

  getImageData(index: number, color: EbookColor, scale: number, dpi: number): ImageData {
    const page = this.doc.loadPage(index);

    const matrix = mupdf.Matrix.scale(scale, scale);
    const bbox = mupdf.Rect.transform(page.getBounds(), matrix);
    const pixmap = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, bbox, true);
    pixmap.clear(255);
    const device = new mupdf.DrawDevice(matrix, pixmap);
    page.run(device, mupdf.Matrix.identity);
    pixmap.tint(color.foreground, color.background);
    pixmap.setResolution(72 * 4, 72 * 4);
    const imageData = new ImageData(pixmap.getPixels(), pixmap.getWidth(), pixmap.getHeight());

    pixmap.destroy();
    device.close();
    device.destroy();
    page.destroy();

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

  getArray(index: number, color: EbookColor): Uint8Array {
    const page = this.doc.loadPage(index) as mupdf.PDFPage;

    const pixmap = page.toPixmap(
      mupdf.Matrix.identity,
      mupdf.ColorSpace.DeviceRGB,
      false,
      false,
      "View",
      "CropBox",
    );
    pixmap.tint(color.foreground, color.background);
    const array = pixmap.asPNG();

    pixmap.destroy();
    page.destroy();

    return array;
  }

  search(index: number, needle: string): Match[] {
    const page = this.doc.loadPage(index);
    const hits = page.search(needle);
    const matches = [];

    for (const quads of hits) {
      const first = mupdfQuadToRect(quads[0]);
      const last = mupdfQuadToRect(quads[quads.length - 1]);
      const rect: Rect = {
        x: first.x,
        y: first.y,
        width: last.x + last.width - first.x,
        height: last.y + last.height - first.y,
      };
      matches.push({ rect });
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
      case RequestType.GetImageData:
        data = worker!.getImageData(args[0], args[1], args[2], args[3]);
        break;
      case RequestType.GetNodes:
        data = worker!.getNodes(args[0]);
        break;
      case RequestType.GetArray:
        data = worker!.getArray(args[0], args[1]);
        transfer = [data.buffer];
        break;
      case RequestType.Open:
        worker = new MuPdfWorker(args[0], args[1]);
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
