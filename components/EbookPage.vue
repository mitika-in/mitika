<template>
  <div ref="root">
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
            v-else-if="node.type == NodeType.ExternalLink"
            :style="getExternalLinkNodeStyle(node as ExternalLinkNode)"
            @click="$emit('openUri', (node as ExternalLinkNode).uri)"
          />
          <button
            v-else-if="node.type == NodeType.InternalLink"
            :style="getInternalLinkNodeStyle(node as InternalLinkNode)"
            @click="$emit('openPosition', (node as InternalLinkNode).position)"
          />
          <template v-else>ERROR</template>
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
import { useLogger } from "@/logging";
import { type Match } from "@/backends/ebook";
import { type EbookPosition } from "@/models";

const { debug } = useLogger("ebookPage");

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
  left: ${match.x * scale}px;
  top: ${match.y * scale}px;
  width: ${match.width * scale}px;
  height: ${match.height * scale}px`;
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

function scrollTo(x: number, y: number) {
  if (!inner.value) return;

  debug(`Scrolling to x: ${x}, y: ${y}`);

  const point = document.createElement("div");
  point.style.position = "absolute";
  point.style.left = `${x * scale}px`;
  point.style.top = `${y * scale}px`;
  inner.value.append(point);
  point.scrollIntoView({ block: "start", inline: "start" });
  point.remove();
}

function rotateByTheta(x: number, y: number, t: number, cX = 0, cY = 0): { x: number; y: number } {
  const angle = (t * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const nX = (x - cX) * cos - (y - cY) * sin + cX;
  const nY = (x - cX) * sin + (y - cY) * cos + cY;
  return { x: nX, y: nY };
}

function localizePoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const { x: rX, y: rY, width: rW, height: rH } = root.value!.getBoundingClientRect();

  const oCX = rX + (width * scale) / 2;
  const oCY = rY + (height * scale) / 2;
  const nCX = rX + rW / 2;
  const nCY = rY + rH / 2;

  const dX = nCX - oCX;
  const dY = nCY - oCY;

  const localizedPoints = [];

  for (const { x, y } of points) {
    const unTranslatedX = x - dX;
    const unTranslatedY = y - dY;

    const { x: unRotatedX, y: unRotatedY } = rotateByTheta(
      unTranslatedX,
      unTranslatedY,
      -rotate,
      oCX,
      oCY,
    );

    const relativeX = unRotatedX - rX;
    const relativeY = unRotatedY - rY;

    localizedPoints.push({ x: relativeX / scale, y: relativeY / scale });
  }

  return localizedPoints;
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

function getVisibleTopLeft(): { x: number; y: number } {
  if (transparent || !root.value || !root.value.parentElement) return { x: 0, y: 0 };

  const { left: rX, top: rY } = root.value.getBoundingClientRect();
  const { left: pX, top: pY } = root.value.parentElement.getBoundingClientRect();

  const visibleX = Math.max(rX, pX);
  const visibleY = Math.max(rY, pY);

  const [{ x, y }] = localizePoints([{ x: visibleX, y: visibleY }]);

  return { x, y };
}

defineExpose({
  root,
  setImageData,
  setNodes,
  setMatches,
  scrollToMatchIndex,
  scrollTo,
  localizePoints,
  getVisibleRatio,
  getVisibleTopLeft,
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

    const { x, y } = root.value.getBoundingClientRect();
    const { width: boxW, height: boxH } = inner.value.getBoundingClientRect();

    root.value.style.width = `${boxW}px`;
    root.value.style.height = `${boxH}px`;

    const oCX = x + (width * scale) / 2;
    const oCY = y + (height * scale) / 2;

    const nCX = x + boxW / 2;
    const nCY = y + boxH / 2;

    const dX = nCX - oCX;
    const dY = nCY - oCY;

    inner.value.style.translate = `${dX}px ${dY}px`;
  },
  { immediate: true },
);
</script>
