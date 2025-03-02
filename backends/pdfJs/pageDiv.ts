export enum PageDivType {
  REAL = "real",
  DUMMY = "dummy",
}

export class PageDiv extends HTMLDivElement {
  private shadow!: ShadowRoot;
  private div!: HTMLDivElement;
  private canvas: HTMLCanvasElement | null = null;
  private visualWidth: number = 0;
  private visualHeight: number = 0;

  constructor(
    public pageNumber: number,
    public width: number,
    public height: number,
    private flip: boolean,
    private rotate: number,
    private scale: number,
    private type: PageDivType,
  ) {
    super();
  }

  createDummy(): PageDiv {
    return new PageDiv(
      0,
      this.width,
      this.height,
      this.flip,
      this.rotate,
      this.scale,
      PageDivType.DUMMY,
    );
  }

  connectedCallback() {
    if (this.shadow) return;

    this.shadow = this.attachShadow({ mode: "open" });
    this.style.display = "inline-block";
    this.div = document.createElement("div");
    if (this.type == PageDivType.REAL) this.div.classList.add("skeleton");
    this.shadow.appendChild(this.div);
    this.applyVisualDimensions();
  }

  private applyVisualDimensions() {
    if ([-360, -180, 0, 180, 360].includes(this.rotate)) {
      this.visualHeight = this.height;
      this.visualWidth = this.width;
    } else if ([-270, -90, 90, 270].includes(this.rotate)) {
      this.visualHeight = this.width;
      this.visualWidth = this.height;
    } else {
      throw new TypeError(`Unknown rotation: ${this.rotate}`);
    }

    this.visualHeight *= this.scale;
    this.visualWidth *= this.scale;

    this.div.style.height = `${this.visualHeight}px`;
    this.div.style.width = `${this.visualWidth}px`;
  }

  setFlip(flip: boolean) {
    this.flip = flip;
    this.style.rotate = `y ${this.flip ? 180 : 0}deg`;
  }

  setRotate(rotate: number) {
    this.rotate = rotate;
    this.destroyCanvas();
    this.applyVisualDimensions();
  }

  setScale(scale: number) {
    this.scale = scale;
    this.destroyCanvas();
    this.applyVisualDimensions();
  }

  createCanvas(): CanvasRenderingContext2D {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.div.appendChild(this.canvas);
    }

    this.canvas.height = this.visualHeight;
    this.canvas.width = this.visualWidth;

    const context = this.canvas.getContext("2d");
    if (!context) throw new TypeError("Unable to get context");

    return context;
  }

  destroyCanvas() {
    if (!this.canvas) return;

    this.canvas.remove();
    this.canvas = null;
  }
}

window.customElements.define("pdfjs-page-div", PageDiv, { extends: "div" });
