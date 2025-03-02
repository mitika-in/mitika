import { useLogger } from "@/logging";
import { EbookBackend, type EbookBackendOptions } from "@/backends/ebook";
import { type Outline } from "@/backends/outline";
import { PageDivType, PageDiv } from "@/backends/pdfJs/pageDiv";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  PasswordResponses,
  type RenderTask,
  RenderingCancelledException,
} from "pdfjs-dist";
import workerURL from "pdfjs-dist/build/pdf.worker?url";
import { type EbookColor, EbookLayout, type EbookPosition } from "@/models";

const { f, debug, warn } = useLogger("pdfJs");

GlobalWorkerOptions.workerSrc = workerURL;

interface RawOutline {
  title: string;
  dest: string | any[] | null;
  items: RawOutline[];
}

async function parseOutline(doc: PDFDocumentProxy, rawOutline: RawOutline[]): Promise<Outline[]> {
  const outline: Outline[] = [];
  for (const rawItem of rawOutline) {
    if (typeof rawItem.dest != "string") {
      warn(f`Ignoring non-string destination in outline item=${rawItem}`);
      continue;
    }
    const dest = await doc.getDestination(rawItem.dest);
    if (!dest || dest.length == 0) {
      warn(f`Destination resolved to null for destination=${dest} in outline item=${rawItem}`);
      continue;
    }
    const position = (await doc.getPageIndex(dest[0])).toString();
    const x = 0;
    const y = 0;
    const item = {
      name: rawItem.title,
      position: { id: position, name: position, x, y },
      children: await parseOutline(doc, rawItem.items),
    };
    outline.push(item);
  }
  return outline;
}

function multiply255(a: number, b: number): number {
  let x = a * b + 128;
  x += x >> 8;
  return x >> 8;
}

function tintCanvas(
  context: CanvasRenderingContext2D,
  height: number,
  width: number,
  black: number,
  white: number,
) {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;

  const rb = (black >> 16) & 255;
  const gb = (black >> 8) & 255;
  const bb = black & 255;

  const rw = (white >> 16) & 255;
  const gw = (white >> 8) & 255;
  const bw = white & 255;

  const rm = rw - rb;
  const gm = gw - gb;
  const bm = bw - bb;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = rb + multiply255(data[i], rm);
    data[i + 1] = gb + multiply255(data[i + 1], gm);
    data[i + 2] = bb + multiply255(data[i + 2], bm);
  }

  context.putImageData(image, 0, 0);
}

function computeVisibleRatio(pTop: number, pBottom: number, cTop: number, cBottom: number): number {
  if (cBottom < pTop) return 0;

  if (cTop > pBottom) return 0;

  if (cTop < pTop && pTop < cBottom) return (cBottom - pTop) / (pBottom - pTop);

  if (cTop < pBottom && pBottom < cBottom) return (pBottom - cTop) / (pBottom - pTop);

  return 1;
}

function lengthToRows(length: number, layout: EbookLayout): number {
  if (layout == EbookLayout.Single) return length;
  else if (layout == EbookLayout.DualStart) return Math.ceil(length / 2);
  else if (layout == EbookLayout.DualEnd) return Math.ceil((length + 1) / 2);
  else throw new TypeError(`Unknown layout: ${layout}`);
}

function rowToPageNumbers(row: number, layout: EbookLayout): number[] {
  if (layout == EbookLayout.Single) return [row];
  else if (layout == EbookLayout.DualStart) return [2 * row - 1, 2 * row];
  else if (layout == EbookLayout.DualEnd) return [2 * (row - 1), 2 * row - 1];
  else throw new TypeError(`Unknown layout: ${layout}`);
}

function dummyOrPage(pages: PageDiv[], pageNumber: number): { dummy: boolean; page: PageDiv } {
  if (pageNumber < 1) return { dummy: true, page: pages[0] };
  else if (pageNumber > pages.length) return { dummy: true, page: pages[pages.length - 1] };
  else return { dummy: false, page: pages[pageNumber - 1] };
}

function pageNumberToPageNumbers(
  pageNumber: number,
  length: number,
  layout: EbookLayout,
): number[] {
  let start = 0;
  let end = 0;

  if (layout == EbookLayout.Single) {
    start = pageNumber;
  } else if (layout == EbookLayout.DualStart) {
    if (pageNumber % 2 == 1) {
      start = pageNumber;
      end = pageNumber + 1;
    } else {
      start = pageNumber - 1;
      end = pageNumber;
    }
  } else if (layout == EbookLayout.DualEnd) {
    if (pageNumber % 2 == 1) {
      start = pageNumber - 1;
      end = pageNumber;
    } else {
      start = pageNumber;
      end = pageNumber + 1;
    }
  } else {
    throw new TypeError(`Unknown layout: ${layout}`);
  }

  if (start < 1 || start > length) start = 0;
  if (end < 1 || end > length) end = 0;

  return [start, end];
}

interface RenderingOptions {
  color: EbookColor;
  flip: boolean;
  scale: number;
  rotate: number;
}

const DPR = window.devicePixelRatio || 1;

export class PdfJs extends EbookBackend {
  private options!: EbookBackendOptions;
  private blobUrl!: string;

  private pageNumber: number = 1;
  private color: EbookColor = { foreground: 0x000000, background: 0xffffff };
  private flip: boolean = false;
  private layout: EbookLayout = EbookLayout.DualEnd;
  private scale: number = 1;
  private rotate: number = 0;

  private doc!: PDFDocumentProxy;
  private tasks = new Map<CanvasRenderingContext2D, RenderTask>();

  private pages: PageDiv[] = [];
  private dummyPages: PageDiv[] = [];
  private visiblePages = new Set<number>();
  private observer!: IntersectionObserver;

  private onSetup = true;

  private updatePosition() {
    let pageNumber = this.pageNumber;
    let maxRatio = 0;
    const { top: pTop, bottom: pBottom } = this.options.container.getBoundingClientRect();

    for (const page of this.pages) {
      if (!this.visiblePages.has(page.pageNumber)) continue;

      const { top: cTop, bottom: cBottom } = page.getBoundingClientRect();
      const ratio = computeVisibleRatio(pTop, pBottom, cTop, cBottom);
      if (ratio >= maxRatio) {
        maxRatio = ratio;
        pageNumber = page.pageNumber;
      }
    }

    debug(`Updating page number to ${pageNumber} (${Math.floor(maxRatio * 100)}% visible)`);
    this.pageNumber = pageNumber;
    this.options.positionCb({
      id: this.pageNumber.toString(),
      name: this.pageNumber.toString(),
      x: 0,
      y: 0,
    });
  }

  async renderPage(
    pageNumber: number,
    context: CanvasRenderingContext2D,
    options: RenderingOptions,
  ) {
    debug(`Rendering page: ${pageNumber}`);
    if (this.tasks.has(context)) {
      debug(`Canceling existing rendering task for page: ${pageNumber}`);
      const task = this.tasks.get(context);
      task?.cancel();
    }

    const proxy = await this.doc.getPage(pageNumber);
    const viewport = proxy.getViewport({
      dontFlip: false,
      scale: options.scale,
      rotation: options.rotate,
    });
    const transform = [DPR, 0, 0, DPR, 0, 0];
    const task = proxy.render({ canvasContext: context, transform, viewport });
    this.tasks.set(context, task);

    try {
      await task.promise;
      tintCanvas(
        context,
        viewport.height,
        viewport.width,
        this.color.foreground,
        this.color.background,
      );
      debug(`Rendered page: ${pageNumber}`);
    } catch (error) {
      if (error instanceof RenderingCancelledException)
        debug(`Rendering canceled for page: ${pageNumber}`);
      else throw error;
    } finally {
      this.tasks.delete(context);
    }
  }

  private async queueRender(page: PageDiv) {
    debug(`Queueing render for page: ${page.pageNumber}`);
    const context = page.createCanvas();
    await this.renderPage(page.pageNumber, context, {
      flip: this.flip,
      color: this.color,
      rotate: this.rotate,
      scale: this.scale,
    });
  }

  private async onIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const page = entry.target as PageDiv;
      if (entry.isIntersecting) {
        if (!this.visiblePages.has(page.pageNumber)) {
          this.visiblePages.add(page.pageNumber);
          await this.queueRender(page);
        }
      } else {
        this.visiblePages.delete(page.pageNumber);
        page.destroyCanvas();
      }
    }

    if (!this.onSetup) this.updatePosition();
  }

  private async setup() {
    const container = this.options.container;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.flexGrow = "1";
    container.style.gap = `${this.options.gap}px`;
    container.style.height = "0px";
    container.style.overflow = "scroll";

    for (let i = 1; i <= this.doc.numPages; i++) {
      const proxy = await this.doc.getPage(i);
      const view = proxy.getViewport({ scale: 1 });
      const page = new PageDiv(
        i,
        view.width * DPR,
        view.height * DPR,
        false,
        0,
        1,
        PageDivType.REAL,
      );
      this.pages.push(page);
      this.observer.observe(page);
    }
  }

  onPassword(cb: (passowrd: string) => void, reason: number) {
    this.options.passwordCb(cb, reason == PasswordResponses.INCORRECT_PASSWORD);
  }

  async open(blob: Blob, options: EbookBackendOptions) {
    this.blobUrl = URL.createObjectURL(blob);
    this.options = options;

    const task = getDocument(this.blobUrl);
    task.onPassword = (cb: (passowrd: string) => void, reason: number) =>
      this.onPassword(cb, reason);
    this.doc = await task.promise;
    this.observer = new IntersectionObserver((entries) => this.onIntersection(entries), {
      threshold: [0, 0.5],
    });

    await this.setup();
    this.onSetup = false;
    await this.setLayout(this.layout);
  }

  async close() {
    this.observer.disconnect();
    this.options.container.replaceChildren();
    this.visiblePages.clear();
    this.pages = [];
    this.dummyPages = [];
    this.tasks.clear();
    await this.doc.destroy();
    URL.revokeObjectURL(this.blobUrl);
  }

  async getName(): Promise<string> {
    return "";
  }

  async getAuthors(): Promise<string[]> {
    return [];
  }

  async getCover(): Promise<Blob | null> {
    const position = { id: "1", name: "1", x: 0, y: 0 };
    const cover = await this.getThumbnail(position);
    return cover;
  }

  async getOutlines(): Promise<Outline[]> {
    const rawOutline = await this.doc.getOutline();
    if (!rawOutline) return [];
    const outlines = await parseOutline(this.doc, rawOutline);
    return outlines;
  }

  private resolvePosition(position: EbookPosition): [pageNumber: number, x: number, y: number] {
    const pageNumber = position.id.length != 0 ? Number(position.id) : 1;
    if (isNaN(pageNumber)) throw new TypeError(`Invalid position.id: ${position.id}`);
    return [pageNumber, position.x, position.y];
  }

  async setPosition(position: EbookPosition): Promise<void> {
    debug(f`Changing to position: ${position}`);
    const [pageNumber] = this.resolvePosition(position);
    for (const page of this.pages)
      if (page.pageNumber == pageNumber) {
        page.scrollIntoView();
        return;
      }

    throw new TypeError(f`Invalid position: ${position}`);
  }

  async getPages(): Promise<EbookPosition[]> {
    const pages = [];
    for (let i = 1; i <= this.doc.numPages; i++) {
      pages.push({ id: i.toString(), name: i.toString(), x: 0, y: 0 });
    }
    return pages;
  }

  async getThumbnail(position: EbookPosition): Promise<Blob | null> {
    debug(f`Generating thumbnail for position: ${position}`);
    const [pageNumber] = this.resolvePosition(position);

    const proxy = await this.doc.getPage(pageNumber);
    const viewport = proxy.getViewport({ scale: 1 });

    const canvas = new OffscreenCanvas(viewport.width * DPR, viewport.height * DPR);
    const context = canvas.getContext("2d");
    if (context == null) throw new TypeError("Unable to get context for cover");

    await this.renderPage(pageNumber, context, { flip: false, rotate: 0, scale: 1 });
    const blob = canvas.convertToBlob({ type: "image/png" });

    return blob;
  }

  private async layPages(): Promise<void> {
    this.options.container.replaceChildren();
    this.dummyPages.map((page) => page.remove());

    const rows = lengthToRows(this.pages.length, this.layout);
    for (let row = 1; row <= rows; row++) {
      const div = document.createElement("div");
      div.classList.add("flex", "flex-row", "mx-auto");
      div.style.display = "flex";
      div.style.flexDirection = "row";
      div.style.marginLeft = "auto";
      div.style.marginRight = "auto";
      div.style.gap = `${this.options.gap}px`;
      this.options.container.appendChild(div);
      for (const pageNumber of rowToPageNumbers(row, this.layout)) {
        const { dummy, page: realPage } = dummyOrPage(this.pages, pageNumber);
        let page;
        if (dummy) {
          page = realPage.createDummy();
          this.dummyPages.push(page);
        } else {
          page = realPage;
          page.remove();
        }
        page.style.flexShrink = "0";
        div.appendChild(page);
      }
    }
  }

  async setFlip(flip: boolean): Promise<void> {
    debug(`Changing to flip: ${flip}`);
    this.flip = flip;
    for (const page of this.pages) page.setFlip(this.flip);
    for (const page of this.dummyPages) page.setFlip(this.flip);
  }

  async setLayout(layout: EbookLayout): Promise<void> {
    debug(`Changing to layout: ${layout}`);
    this.layout = layout;
    await this.layPages();
  }

  async setScale(scale: number): Promise<void> {
    debug(`Changing to scale: ${scale}`);
    this.scale = scale;
    const position = { id: this.pageNumber.toString(), name: "", x: 0, y: 0 };

    for (const page of this.pages) {
      page.setScale(this.scale);
      if (this.visiblePages.has(page.pageNumber)) {
        debug(`Re-rendering ${page.pageNumber} at ${this.scale} scale`);
        await this.queueRender(page);
      }
    }

    for (const page of this.dummyPages) {
      page.setScale(this.scale);
    }

    await this.setPosition(position);
    this.options.scaleCb(this.scale);
  }

  async scaleToFitHeight() {
    debug(`Changing scale to fit height`);
    const pageNumbers = pageNumberToPageNumbers(this.pageNumber, this.pages.length, this.layout);

    let height = 0;
    for (const pageNumber of pageNumbers)
      if (pageNumber != 0) height = Math.max(this.pages[pageNumber - 1].height, height);

    const scale = this.options.container.clientHeight / height;

    await this.setScale(scale);
  }

  async scaleToFitWidth() {
    debug(`Changing scale to fit width`);
    const pageNumbers = pageNumberToPageNumbers(this.pageNumber, this.pages.length, this.layout);

    let width = 0;
    for (const pageNumber of pageNumbers)
      if (pageNumber != 0) width += this.pages[pageNumber - 1].width;

    if (this.layout != EbookLayout.Single) width += this.options.gap;

    const scale = this.options.container.clientWidth / width;

    await this.setScale(scale);
  }

  async scaleToFitPage() {
    debug(`Changing scale to fit page`);
    const pageNumbers = pageNumberToPageNumbers(this.pageNumber, this.pages.length, this.layout);

    let height = 0;
    let width = 0;
    for (const pageNumber of pageNumbers) {
      if (pageNumber != 0) {
        height = Math.max(this.pages[pageNumber - 1].height, height);
        width += this.pages[pageNumber - 1].width;
      }
    }

    if (this.layout != EbookLayout.Single) width += this.options.gap;

    const scale = Math.min(
      this.options.container.clientWidth / width,
      this.options.container.clientHeight / height,
    );
    await this.setScale(scale);
  }

  async setColor(color: EbookColor): Promise<void> {
    debug(f`Changing to color: ${color}`);
    this.color = color;

    for (const page of this.pages) {
      if (this.visiblePages.has(page.pageNumber)) {
        debug(f`Re-rendering ${page.pageNumber} at ${this.color} color`);
        await this.queueRender(page);
      }
    }
  }

  async setRotate(rotate: number): Promise<void> {
    debug(`Changing to rotate: ${rotate}`);
    this.rotate = rotate;
    const position = { id: this.pageNumber.toString(), name: "", x: 0, y: 0 };

    for (const page of this.pages) {
      page.setRotate(this.rotate);
      if (this.visiblePages.has(page.pageNumber)) {
        debug(`Re-rendering ${page.pageNumber} at ${this.rotate} rotate`);
        await this.queueRender(page);
      }
    }

    for (const page of this.dummyPages) {
      page.setRotate(this.rotate);
    }

    await this.setPosition(position);
  }
}
