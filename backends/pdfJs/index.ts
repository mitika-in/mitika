import { useLogger } from "@/logging";
import {
  EbookBackend,
  type EbookPageView,
  type PasswordCallback,
  type ScaleChangedCallback,
} from "@/backends/ebook";
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
import type { ProgressCallback } from "@/backends/backend";
import { PageLayout } from "@/models";

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
    const position = await doc.getPageIndex(dest[0]);
    const x = 0;
    const y = 0;
    const item = {
      name: rawItem.title,
      destination: { position, x, y },
      children: await parseOutline(doc, rawItem.items),
    };
    outline.push(item);
  }
  return outline;
}

function computeVisibleRatio(pTop: number, pBottom: number, cTop: number, cBottom: number): number {
  if (cBottom < pTop) return 0;

  if (cTop > pBottom) return 0;

  if (cTop < pTop && pTop < cBottom) return (cBottom - pTop) / (pBottom - pTop);

  if (cTop < pBottom && pBottom < cBottom) return (pBottom - cTop) / (pBottom - pTop);

  return 1;
}

function spreads(layout: PageLayout, length: number): number {
  if (layout == PageLayout.SINGLE) return length;
  else if (layout == PageLayout.DUAL_START) return Math.ceil(length / 2);
  else if (layout == PageLayout.DUAL_END) return Math.ceil((length + 1) / 2);
  else throw new TypeError(`Unknown layout: ${layout}`);
}

function spreadToPages(layout: PageLayout, spread: number): number[] {
  if (layout == PageLayout.SINGLE) return [spread];
  else if (layout == PageLayout.DUAL_START) return [2 * spread - 1, 2 * spread];
  else if (layout == PageLayout.DUAL_END) return [2 * (spread - 1), 2 * spread - 1];
  else throw new TypeError(`Unknown layout: ${layout}`);
}

function dummyOrPage(pages: PageDiv[], position: number): { dummy: boolean; page: PageDiv } {
  if (position < 1) return { dummy: true, page: pages[0] };
  else if (position > pages.length) return { dummy: true, page: pages[pages.length - 1] };
  else return { dummy: false, page: pages[position - 1] };
}

function getSpreadForPosition(
  position: number,
  length: number,
  layout: PageLayout,
): [start: number, end: number] {
  let start = 0;
  let end = 0;

  if (layout == PageLayout.SINGLE) {
    start = position;
  } else if (layout == PageLayout.DUAL_START) {
    if (position % 2 == 1) {
      start = position;
      end = position + 1;
    } else {
      start = position - 1;
      end = position;
    }
  } else if (layout == PageLayout.DUAL_END) {
    if (position % 2 == 1) {
      start = position - 1;
      end = position;
    } else {
      start = position;
      end = position + 1;
    }
  } else {
    throw new TypeError(`Unknown layout: ${layout}`);
  }

  if (start < 1 || start > length) start = 0;
  if (end < 1 || end > length) end = 0;

  return [start, end];
}

interface RenderingOptions {
  scale: number;
  rotation: number;
  colors: { black: number; white: number };
}

const DPR = window.devicePixelRatio || 1;

export class PdfJs extends EbookBackend {
  private container!: HTMLDivElement;
  private gap = 0;
  private progressCb: ProgressCallback = () => null;
  private scaleCb: ScaleChangedCallback = () => null;

  private position = 1;
  private length = 1;
  private layout: PageLayout = PageLayout.DUAL_START;
  private scale: number = 1;
  private rotation: number = 0;
  private white = 0xffffff;
  private black = 0x000000;

  private doc!: PDFDocumentProxy;
  private tasks = new Map<CanvasRenderingContext2D, RenderTask>();

  private pages: PageDiv[] = [];
  private dummyPages: PageDiv[] = [];
  private visiblePages = new Set<number>();
  private observer!: IntersectionObserver;

  private computeVisiblePosition() {
    let visiblePosition = this.position;
    let maxRatio = 0;
    const { top: pTop, bottom: pBottom } = this.container.getBoundingClientRect();

    for (const page of this.pages) {
      if (!this.visiblePages.has(page.position)) continue;

      const { top: cTop, bottom: cBottom } = page.getBoundingClientRect();
      const ratio = computeVisibleRatio(pTop, pBottom, cTop, cBottom);
      if (ratio >= maxRatio) {
        maxRatio = ratio;
        visiblePosition = page.position;
      }
    }

    debug(`Setting position: ${visiblePosition} (${Math.floor(maxRatio * 100)}% visible)`);
    this.position = visiblePosition;
    this.progressCb(this.position);
  }

  async renderPage(position: number, context: CanvasRenderingContext2D, options: RenderingOptions) {
    debug(`Rendering page: ${position}`);

    if (this.tasks.has(context)) {
      debug(`Canceling existing rendering task for page: ${position}`);
      const task = this.tasks.get(context);
      task?.cancel();
    }

    const proxy = await this.doc.getPage(position);
    const viewport = proxy.getViewport({
      scale: options.scale,
    });
    const transform = [DPR, 0, 0, DPR, 0, 0];
    const task = proxy.render({ canvasContext: context, transform, viewport });
    this.tasks.set(context, task);

    try {
      await task.promise;
      debug(`Rendered page: ${position}`);
    } catch (error) {
      if (error instanceof RenderingCancelledException)
        debug(`Rendering canceled for page: ${position}`);
      else throw error;
    } finally {
      this.tasks.delete(context);
    }
  }

  private async queueRender(page: PageDiv) {
    debug(`Queueing page: ${page.position}`);
    const context = page.createCanvas();
    await this.renderPage(page.position, context, {
      scale: this.scale,
      rotation: this.rotation,
      colors: { white: this.white, black: this.black },
    });
  }

  private async onIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const page = entry.target as PageDiv;
      if (entry.isIntersecting) {
        if (!this.visiblePages.has(page.position)) {
          this.visiblePages.add(page.position);
          await this.queueRender(page);
        }
      } else {
        this.visiblePages.delete(page.position);
        page.destroyCanvas();
      }
    }

    this.computeVisiblePosition();
  }

  private async setup() {
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.flexGrow = "1";
    this.container.style.gap = "16px";
    this.container.style.height = "0px";
    this.container.style.overflow = "scroll";

    for (let i = 1; i <= this.doc.numPages; i++) {
      const proxy = await this.doc.getPage(i);
      const view = proxy.getViewport({ scale: 1 });
      const page = new PageDiv(i, view.width * DPR, view.height * DPR, 1, PageDivType.REAL);
      this.pages.push(page);
      this.observer.observe(page);
    }
  }

  async open(
    blob: Blob,
    container: HTMLDivElement,
    gap: number,
    progressCb: ProgressCallback,
    scaleCb: ScaleChangedCallback,
    passwordCb: PasswordCallback,
  ) {
    this.container = container;
    this.gap = gap;
    const task = getDocument(URL.createObjectURL(blob));
    task.onPassword = (cb: (passowrd: string) => void, reason: number) =>
      passwordCb(cb, reason == PasswordResponses.INCORRECT_PASSWORD);
    this.doc = await task.promise;
    this.length = this.doc.numPages;
    this.observer = new IntersectionObserver((entries) => this.onIntersection(entries), {
      threshold: [0, 0.5],
    });
    await this.setup();
    this.progressCb = progressCb;
    this.scaleCb = scaleCb;
  }

  async close() {
    this.observer.disconnect();
    this.container.replaceChildren();
    this.visiblePages.clear();
    this.tasks.clear();
    this.pages = [];
    this.dummyPages = [];
    await this.doc.destroy();
  }

  async getName(): Promise<string> {
    return "";
  }

  async getAuthors(): Promise<string[]> {
    return [];
  }

  async getCover(): Promise<Blob> {
    const proxy = await this.doc.getPage(1);
    const viewport = proxy.getViewport({ scale: 1 });

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    if (context == null) throw new TypeError("Unable to get context for cover");

    await this.renderPage(1, context, { scale: 1 });
    const blob = canvas.convertToBlob({ type: "image/png" });

    return blob;
  }

  async getLength(): Promise<number> {
    return this.length;
  }

  async getOutlines(): Promise<Outline[]> {
    const rawOutline = await this.doc.getOutline();
    if (!rawOutline) return [];
    const outlines = await parseOutline(this.doc, rawOutline);
    return outlines;
  }

  async setPosition(position: number): Promise<void> {
    debug(`Changing to position: ${position}`);
    this.position = position;

    for (const page of this.pages)
      if (page.position == this.position) {
        page.scrollIntoView();
        break;
      }
  }

  async getPages(): Promise<EbookPageView[]> {
    const pages = [];
    for (let i = 1; i <= this.doc.numPages; i++) {
      const proxy = await this.doc.getPage(i);
      const viewport = proxy.getViewport({ scale: 1 });
      pages.push({ position: i, height: viewport.height * DPR, width: viewport.width * DPR });
    }
    return pages;
  }

  async setLayout(layout: PageLayout): Promise<void> {
    debug(`Changing to layout: ${layout}`);
    this.layout = layout;
    this.container.replaceChildren();
    this.dummyPages.map((page) => page.remove());

    const totalSpreads = spreads(this.layout, this.pages.length);
    for (let spread = 1; spread <= totalSpreads; spread++) {
      const div = document.createElement("div");
      div.classList.add("flex", "flex-row", "mx-auto");
      div.style.display = "flex";
      div.style.flexDirection = "row";
      div.style.marginLeft = "auto";
      div.style.marginRight = "auto";
      div.style.gap = `${this.gap}px`;
      this.container.appendChild(div);
      for (const position of spreadToPages(this.layout, spread)) {
        const { dummy, page: realPage } = dummyOrPage(this.pages, position);
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

  async setScale(scale: number): Promise<void> {
    debug(`Changing to scale: ${scale}`);
    this.scale = scale;
    const position = this.position;

    for (const page of this.pages) {
      page.setScale(this.scale);
      if (this.visiblePages.has(page.position)) {
        debug(`Re-rendering ${page.position} at ${this.scale} scale`);
        await this.queueRender(page);
      }
    }

    for (const page of this.dummyPages) {
      page.setScale(this.scale);
    }

    await this.setPosition(position);
    this.scaleCb(this.scale);
  }

  async scaleToFitHeight() {
    debug(`Changing scale to fit height`);
    const [start, end] = getSpreadForPosition(this.position, this.length, this.layout);

    let height = 0;

    if (start != 0) {
      height = Math.max(this.pages[start - 1].height, height);
    }
    if (end != 0) {
      height = Math.max(this.pages[end - 1].height, height);
    }

    const scale = this.container.clientHeight / height;
    await this.setScale(scale);
  }

  async scaleToFitWidth() {
    debug(`Changing scale to fit width`);
    const [start, end] = getSpreadForPosition(this.position, this.length, this.layout);

    let width = 0;

    if (start != 0) {
      width += this.pages[start - 1].width;
    } else {
      width += this.pages[end - 1].width;
    }

    if (end != 0) {
      width += this.pages[end - 1].width;
    } else {
      width += this.pages[start - 1].width;
    }

    if (this.layout != PageLayout.SINGLE) width += this.gap;

    const scale = this.container.clientWidth / width;
    await this.setScale(scale);
  }

  async scaleToFitPage() {
    debug(`Changing scale to fit page`);
    const [start, end] = getSpreadForPosition(this.position, this.length, this.layout);

    let height = 0;
    let width = 0;

    if (start != 0) {
      height = Math.max(this.pages[start - 1].height, height);
      width += this.pages[start - 1].width;
    } else {
      width += this.pages[end - 1].width;
    }

    if (end != 0) {
      height = Math.max(this.pages[end - 1].height, height);
      width += this.pages[end - 1].width;
    } else {
      width += this.pages[start - 1].width;
    }

    if (this.layout != PageLayout.SINGLE) width += this.gap;

    const scale = Math.min(
      this.container.clientWidth / width,
      this.container.clientHeight / height,
    );
    await this.setScale(scale);
  }

  async setColors(white: number, black: number): Promise<void> {
    debug(`Changing to colors: ${white}, ${black}`);
    this.white = white;
    this.black = black;
  }

  async setRotation(rotation: number): Promise<void> {
    debug(`Changing to rotation: ${rotation}`);
    this.rotation = rotation;
  }
}
