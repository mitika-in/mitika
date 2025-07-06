<template>
  <div
    ref="root"
    xlass="{ 'bg-base-300 inset-shadow-sm shadow-sm': !transparent }"
  >
    <div
      ref="inner"
      class="relative"
    >
      <canvas
        ref="canvas"
        class="absolute"
        :style="`width: ${width * scale}px; height: ${height * scale}px`"
      />
      <div
        class="absolute origin-top-left"
        :style="`scale: ${scale}`"
      >
        <template v-for="node in nodes">
          <span
            v-if="node.type == NodeType.Text"
            :style="getTextNodeStyle(node as TextNode)"
          >
            {{ (node as TextNode).text }}
          </span>
          <button
            v-if="node.type == NodeType.ExternalLink"
            :style="getExternalLinkNodeStyle(node as ExternalLinkNode)"
            @click="$emit('openUri', (node as ExternalLinkNode).uri)"
          />

          <button
            v-if="node.type == NodeType.InternalLink"
            :style="getInternalLinkNodeStyle(node as InternalLinkNode)"
            @click="$emit('openPosition', (node as InternalLinkNode).position)"
          />
        </template>
      </div>
      <div class="absolute origin-top-left">
        <template v-for="(match, i) in matches">
          <span
            v-if="i == currentMatchIndex"
            :ref="onCurrentMatchMounted"
            :style="getCurrentMatchStyle(match)"
          />
          <span
            v-else
            :style="getMatchStyle(match)"
          />
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  NodeType,
  type Node,
  type TextNode,
  type ExternalLinkNode,
  type InternalLinkNode,
} from "@/backends/ebook/node";
import { type Match } from "@/backends/ebook";
import { type EbookPosition } from "@/models";

interface Props {
  width: number;
  height: number;
  transparent: boolean;
  flip: boolean;
  rotate: number;
  scale: number;
}

interface Emits {
  openPosition: [position: EbookPosition];
  openUri: [uri: string];
}

const { width, height, transparent, flip, rotate, scale } = defineProps<Props>();
defineEmits<Emits>();

const root = useTemplateRef("root");
const inner = useTemplateRef("inner");
const canvas = useTemplateRef("canvas");

const nodes: Ref<Node[]> = ref([]);

const matches: Ref<Match[]> = ref([]);
const currentMatchIndex = ref(-1);

function getNodeStyle(node: Node): string {
  return `
  position: absolute;
  left: ${node.x}px;
  top: ${node.y}px;
  width: ${node.width}px;
  height: ${node.height}px`;
}

function getExternalLinkNodeStyle(node: ExternalLinkNode): string {
  const nodeStyle = getNodeStyle(node);

  return `
  ${nodeStyle};
  z-index: 2;
  cursor: pointer`;
}

function getInternalLinkNodeStyle(node: InternalLinkNode): string {
  const nodeStyle = getNodeStyle(node);

  return `
  ${nodeStyle};
  z-index: 2;
  cursor: pointer`;
}

function getTextNodeStyle(node: TextNode): string {
  const nodeStyle = getNodeStyle(node);
  const size = `${node.font.size}px`;
  const family = node.font.family;
  const weight = node.font.weight;
  const style = node.font.style;

  const ctx = canvas.value!.getContext("2d");
  ctx!.font = `${style} ${weight} ${size} ${family}`;
  const metrics = ctx!.measureText(node.text);
  const transform = `scaleX(${node.width / metrics.width})`;

  return `
  ${nodeStyle};
  color: transparent;
  line-height: ${node.height}px;
  white-space: pre;
  font-size: ${size};
  font-family: ${family};
  font-weight: ${weight};
  font-style: ${style};
  transform: ${transform};
  transform-origin: 0px 0px;`;
}

function getMatchStyle(match: Match): string {
  return `
  background-color: var(--color-secondary);
  mix-blend-mode: multiply;
  position: absolute;
  left: ${match.rect.x * scale}px;
  top: ${match.rect.y * scale}px;
  width: ${match.rect.width * scale}px;
  height: ${match.rect.height * scale}px`;
}

function getCurrentMatchStyle(match: Match): string {
  const style = getMatchStyle(match);

  return `
  ${style};
  background-color: var(--color-primary)`;
}

function onCurrentMatchMounted(node: Element | ComponentPublicInstance | null) {
  if (!node) return;

  if (node instanceof Element) node.scrollIntoView();
}

function setImageData(imageData: ImageData | null) {
  if (!imageData) {
    canvas.value!.width = 0;
    canvas.value!.height = 0;
    return;
  }

  canvas.value!.width = imageData.width;
  canvas.value!.height = imageData.height;
  const ctx = canvas.value!.getContext("2d");
  ctx!.putImageData(imageData, 0, 0);
}

function setNodes(newNodes: Node[]) {
  setMatches([]);
  nodes.value = newNodes;
}

function setMatches(newMatches: Match[]) {
  currentMatchIndex.value = -1;
  matches.value = newMatches;
}

function scrollToMatchIndex(index: number) {
  currentMatchIndex.value = index;
}

function getVisibleRatio(): number {
  if (transparent || !root.value || !root.value.parentElement) return 0;

  const { left: cL, top: cT, right: cR, bottom: cB } = root.value.getBoundingClientRect();
  const {
    left: pL,
    top: pT,
    right: pR,
    bottom: pB,
  } = root.value.parentElement.getBoundingClientRect();

  const left = Math.max(cL, pL);
  const top = Math.max(cT, pT);
  const right = Math.min(cR, pR);
  const bottom = Math.min(cB, pB);

  if (right <= left || bottom <= top) return 0;

  const visibleArea = (right - left) * (bottom - top);
  const totalArea = (cR - cL) * (cB - cT);

  return visibleArea / totalArea;
}

function transform(x: number, y: number, t: number, cX = 0, cY = 0): { x: number; y: number } {
  const angle = (t * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const nX = (x - cX) * cos - (y - cY) * sin + cX;
  const nY = (x - cX) * sin + (y - cY) * cos + cY;
  return { x: nX, y: nY };
}

function getInnerAbsoluteTopLeft(): { x: number; y: number } {
  if (transparent || !root.value || !root.value.parentElement) return { x: 0, y: 0 };

  const { left: rX, top: rY, width: rW, height: rH } = root.value.getBoundingClientRect();

  const iCX = rX + (width * scale) / 2;
  const iCY = rY + (height * scale) / 2;

  const rCX = rX + rW / 2;
  const rCY = rY + rH / 2;

  const deltaX = rCX - iCX;
  const deltaY = rCY - iCY;

  const { x: nX, y: nY } = transform(rX, rY, rotate, iCX, iCY);
  const iX = nX + deltaX;
  const iY = nY + deltaY;

  return { x: iX, y: iY };
}

function getVisibleTopLeft(): { x: number; y: number } {
  if (transparent || !root.value || !root.value.parentElement) return { x: 0, y: 0 };

  const { left: rX, top: rY } = root.value.getBoundingClientRect();
  const { left: pX, top: pY } = root.value.parentElement.getBoundingClientRect();
  const { x: iX, y: iY } = getInnerAbsoluteTopLeft();

  const vX = Math.max(rX, pX);
  const vY = Math.max(rY, pY);

  const relX = (vX - iX) / scale;
  const relY = (vY - iY) / scale;

  const { x, y } = transform(relX, relY, -rotate);

  return { x, y };
}

function scrollTo(x: number, y: number) {
  if (!inner.value) return;

  const point = document.createElement("div");
  point.style.position = "absolute";
  point.style.left = `${x * scale}px`;
  point.style.top = `${y * scale}px`;
  inner.value.append(point);
  point.scrollIntoView({ block: "start", inline: "start" });
  point.remove();
}

defineExpose({
  root,
  setImageData,
  setNodes,
  setMatches,
  scrollToMatchIndex,
  getVisibleRatio,
  getVisibleTopLeft,
  scrollTo,
});

watch(
  [root, inner, () => width, () => height, () => flip, () => rotate, () => scale],
  () => {
    if (!root.value || !inner.value) return;

    inner.value.style.translate = "0px 0px";

    inner.value.style.width = `${width * scale}px`;
    inner.value.style.height = `${height * scale}px`;
    inner.value.style.rotate = `${rotate}deg`;
    inner.value.style.transform = `rotateY(${flip ? 180 : 0}deg)`;

    const { width: boxW, height: boxH } = inner.value.getBoundingClientRect();

    root.value.style.width = `${boxW}px`;
    root.value.style.height = `${boxH}px`;

    const { x: pX, y: pY, width: pW, height: pH } = root.value.getBoundingClientRect();
    const { x: cX, y: cY, width: cW, height: cH } = inner.value.getBoundingClientRect();

    const pCenterX = pX + pW / 2;
    const pCenterY = pY + pH / 2;
    const cCenterX = cX + cW / 2;
    const cCenterY = cY + cH / 2;

    const deltaX = pCenterX - cCenterX;
    const deltaY = pCenterY - cCenterY;

    inner.value.style.translate = `${deltaX}px ${deltaY}px`;
  },
  { immediate: true },
);
</script>
