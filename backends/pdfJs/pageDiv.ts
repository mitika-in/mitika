export enum PageDivType {
  REAL = "real",
  DUMMY = "dummy",
}

export class PageDiv extends HTMLDivElement {
  private shadow!: ShadowRoot;
  private div!: HTMLDivElement;
  private canvas: HTMLCanvasElement | null = null;

  constructor(
    public position: number,
    public width: number,
    public height: number,
    private scale: number,
    private type: PageDivType,
  ) {
    super();
  }

  createDummy(): PageDiv {
    return new PageDiv(0, this.width, this.height, this.scale, PageDivType.DUMMY);
  }

  connectedCallback() {
    if (this.shadow) return;

    this.shadow = this.attachShadow({ mode: "open" });
    this.div = document.createElement("div");
    if (this.type == PageDivType.REAL) this.div.classList.add("skeleton");
    this.shadow.appendChild(this.div);
    this.setScale(this.scale);
  }

  setScale(scale: number) {
    this.scale = scale;
    this.div.style.height = `${this.height * this.scale}px`;
    this.div.style.width = `${this.width * this.scale}px`;
  }

  createCanvas(): CanvasRenderingContext2D {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.div.appendChild(this.canvas);
    }

    this.canvas.height = this.height * this.scale;
    this.canvas.width = this.width * this.scale;

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
