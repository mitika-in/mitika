<template>
  <div class="relative flex flex-col gap-4">
    <header
      v-show="!focus"
      class="flex flex-col gap-4"
    >
      <div class="flex flex-row gap-4 self-center">
        <button
          class="btn btn-ghost"
          @click="outlinesDialog!.toggle()"
        >
          <ListIcon class="size-4" />
        </button>
        <MarkButton :item="ebook" />
        <button
          :class="{ 'btn-ghost': !searching }"
          class="btn"
          @click="onSearchClick"
        >
          <SearchIcon class="size-4" />
        </button>
        <EbookScaleButton
          :resizePolicy="ebook.resizePolicy"
          :scale="ebook.scale"
          @change="onScaleChange"
          @fitHeight="onScaleToFitHeight"
          @fitPage="onScaleToFitPage"
          @fitWidth="onScaleToFitWidth"
        />
        <Dropdown popoverId="ebookViewerPo">
          <template #button>
            <MoreVerticalIcon class="size-4" />
          </template>
          <template #content>
            <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
              <li>
                <button @click="onAddNoteClick">
                  {{ $t("Add note") }}
                </button>
              </li>
              <li>
                <button @click="onMarksClick">
                  {{ $t("Marks") }}
                </button>
              </li>
              <li>
                <button @click="onNotesClick">
                  {{ $t("Notes") }}
                </button>
              </li>
              <li>
                <details>
                  <summary>
                    {{ $t("Colors") }}
                  </summary>
                  <ul>
                    <li v-for="entry of Object.entries(ColorScheme)">
                      <button @click="onColorClick(entry[1])">
                        {{ $t(entry[0]) }}
                      </button>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <label class="label">
                  <input
                    v-model="ebook.flip"
                    class="checkbox"
                    type="checkbox"
                    @change="onFlipChange"
                  />
                  {{ $t("Flip") }}
                </label>
              </li>
              <li>
                <details>
                  <summary>
                    {{ $t("Layout") }}
                  </summary>
                  <ul>
                    <li>
                      <label class="label">
                        <input
                          v-model="ebook.layout"
                          class="radio"
                          name="layout"
                          type="radio"
                          :value="EbookLayout.Single"
                          @change="onLayoutChange"
                        />
                        {{ $t("Single") }}
                      </label>
                    </li>
                    <li>
                      <label class="label">
                        <input
                          v-model="ebook.layout"
                          class="radio"
                          name="layout"
                          type="radio"
                          :value="EbookLayout.DualStart"
                          @change="onLayoutChange"
                        />
                        {{ $t("Dual start") }}
                      </label>
                    </li>
                    <li>
                      <label class="label">
                        <input
                          v-model="ebook.layout"
                          class="radio"
                          name="layout"
                          type="radio"
                          :value="EbookLayout.DualEnd"
                          @change="onLayoutChange"
                        />
                        {{ $t("Dual end") }}
                      </label>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details>
                  <summary>
                    {{ $t("Rotate") }}
                  </summary>
                  <ul>
                    <li>
                      <button @click="onRotateOriginalClick">
                        {{ $t("Original") }}
                      </button>
                    </li>
                    <li>
                      <button @click="onRotateLeftClick">
                        {{ $t("Rotate left") }}
                      </button>
                    </li>
                    <li>
                      <button @click="onRotateRightClick">
                        {{ $t("Rotate right") }}
                      </button>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          </template>
        </Dropdown>
      </div>
      <TitleBar
        :subtitle="ebook.file.name"
        title=""
      />
      <EbookSearchBar
        ref="searchBar"
        v-show="searching"
        :startIndex="startIndex"
        :endIndex="endIndex"
        :pages="pages"
        @change="onPositionChange"
        @search="onSearch"
        @step="onStep"
        @query="onQuery"
      />
    </header>
    <div
      ref="container"
      class="flex h-0 grow flex-row overflow-scroll"
      @scroll="onScroll"
    >
      <div
        class="flex w-0 grow flex-row items-center-safe justify-center-safe gap-4 overflow-scroll"
        @scroll="onScroll"
      >
        <EbookPage
          ref="startPage"
          v-bind="getPageProperties(startIndex)"
          class="shrink-0"
          :color="ebook.color"
          :flip="ebook.flip"
          :rotate="ebook.rotate"
          :scale="ebook.scale"
          @openPosition="onPositionChange"
          @openUri="onOpenUri"
        />
        <EbookPage
          ref="endPage"
          v-bind="getPageProperties(endIndex)"
          v-show="ebook.layout != EbookLayout.Single"
          class="shrink-0"
          :color="ebook.color"
          :flip="ebook.flip"
          :rotate="ebook.rotate"
          :scale="ebook.scale"
          @openPosition="onPositionChange"
          @openUri="onOpenUri"
        />
      </div>
    </div>
    <div class="absolute end-0 bottom-0 flex grow flex-row gap-4">
      <button
        :disabled="startIndex <= 0"
        class="btn btn-circle self-center"
        @click="onPreviousClick"
      >
        <ChevronLeftIcon class="size-4" />
      </button>
      <EbookPositionButton
        :color="ebook.color"
        :flip="ebook.flip"
        :pages="pages"
        :position="ebook.position"
        :rotate="ebook.rotate"
        @change="onPositionChange"
        @setPreview="onSetPreview"
      />
      <button
        :disabled="endIndex >= pages.length - 1"
        class="btn btn-circle self-center"
        @click="onNextClick"
      >
        <ChevronRightIcon class="size-4" />
      </button>
    </div>
    <AddNoteDialog
      ref="addNoteDialog"
      :item="ebook"
    />
    <MarksDialog
      ref="marksDialog"
      :item="ebook"
      @openMark="onOpenMark"
    />
    <NotesDialog
      ref="notesDialog"
      :item="ebook"
      @openNote="onOpenNote"
    />
    <OpenUriDialog ref="openUriDialog" />
    <OutlinesDialog
      ref="outlinesDialog"
      :item="ebook"
      :outlines="outlines"
      @openOutline="onOpenOutline"
    />
  </div>
</template>
<script setup lang="ts">
import { type EbookBackend, useEbookBackend } from "@/backends";
import { type Page } from "@/backends/ebook";
import { type Metadata } from "@/backends/metadata";
import { type Outline } from "@/backends/outline";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import {
  ColorScheme,
  EbookLayout,
  EbookResizePolicy,
  type EbookColor,
  type Ebook,
  type Mark,
  type Note,
  type EbookPosition,
} from "@/models";
import { useSource } from "@/sources";

const { f, debug } = useLogger("ebookViewer");

const DUAL_PAGE_WIDTH = 768;

interface Props {
  ebook: Ebook;
  focus: boolean;
}

interface Emits {
  metadata: [metadata: Metadata];
}

const { ebook } = defineProps<Props>();
const emit = defineEmits<Emits>();

const database = await useDatabase();
const source = await useSource();

let backend: EbookBackend | null = null;

const observer = new ResizeObserver(onContainerResize);

const pages: Ref<Page[]> = shallowRef([]);
const outlines: Ref<Outline[]> = shallowRef([]);

const searching = ref(false);

const startIndex = ref(ebook.position.value);
const endIndex = ref(ebook.position.value);

const startPage = useTemplateRef("startPage");
const endPage = useTemplateRef("endPage");
const container = useTemplateRef("container");

const searchBar = useTemplateRef("searchBar");

const addNoteDialog = useTemplateRef("addNoteDialog");
const marksDialog = useTemplateRef("marksDialog");
const notesDialog = useTemplateRef("notesDialog");
const openUriDialog = useTemplateRef("openUriDialog");
const outlinesDialog = useTemplateRef("outlinesDialog");

let startMatchesLength = 0;
let scrollTimeoutId = 0;

function onOpenMark(mark: Mark) {
  debug(`Opening mark: ${mark.name}`);
  ebook.position = mark.position as EbookPosition;
  loadLayout();
}

function onOpenNote(note: Note) {
  debug(`Opening note: ${note.name}`);
  ebook.position = note.position as EbookPosition;
  loadLayout();
}

function onOpenOutline(outline: Outline) {
  debug(`Opening outline: ${outline.name}`);
  ebook.position = outline.position as EbookPosition;
  loadLayout();
}

async function onPositionChange(position: EbookPosition) {
  debug(f`Changing to position: ${position}`);
  ebook.position = position;
  await loadLayout();
}

async function onScaleChange(scale: number) {
  debug(`Changing to scale: ${scale}`);
  if (scale == Infinity) throw new Error("Invalid scale");
  ebook.scale = scale;
  await loadImageData();
  ebook.resizePolicy = EbookResizePolicy.None;
}

async function onScaleToFitWidth() {
  debug(`Changing scale to fit width`);

  if (!pages.value.length || !container.value) return;

  let width = 0;
  if (startIndex.value >= 0) width += pages.value[startIndex.value].width;
  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length)
    width += pages.value[endIndex.value].width;

  const scale = container.value.clientWidth / width;
  await onScaleChange(scale);
  ebook.resizePolicy = EbookResizePolicy.FitWidth;
}

async function onScaleToFitHeight() {
  debug(`Changing scale to fit height`);

  if (!pages.value.length || !container.value) return;

  let height = 0;
  if (startIndex.value >= 0) height = pages.value[startIndex.value].height;
  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length)
    height = Math.max(pages.value[endIndex.value].height, height);

  const scale = container.value.clientHeight / height;
  await onScaleChange(scale);
  ebook.resizePolicy = EbookResizePolicy.FitHeight;
}

async function onScaleToFitPage() {
  debug(`Changing scale to fit page`);

  if (!pages.value.length || !container.value) return;

  let width = 0;
  let height = 0;
  if (startIndex.value >= 0) {
    width += pages.value[startIndex.value].width;
    height = Math.max(pages.value[endIndex.value].height, height);
  }
  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length) {
    width += pages.value[endIndex.value].width;
    height = Math.max(pages.value[endIndex.value].height, height);
  }

  const scale = Math.min(
    container.value.clientWidth / width,
    container.value.clientHeight / height,
  );

  await onScaleChange(scale);
  ebook.resizePolicy = EbookResizePolicy.FitPage;
}

function onContainerResize() {
  debug(`Container resized, adopting resize policy: ${ebook.resizePolicy}`);

  if (ebook.resizePolicy == EbookResizePolicy.FitWidth) onScaleToFitWidth();
  else if (ebook.resizePolicy == EbookResizePolicy.FitHeight) onScaleToFitHeight();
  else if (ebook.resizePolicy == EbookResizePolicy.FitPage) onScaleToFitPage();
}

function onSearchClick() {
  searching.value = !searching.value;

  if (!searching.value) {
    searchBar.value!.reset();
    startPage.value!.setMatches([]);
    endPage.value!.setMatches([]);
  }
}

function onAddNoteClick() {
  addNoteDialog.value!.show();
}

function onColorClick(color: EbookColor) {
  debug(f`Changing to color: ${color}`);
  ebook.color = color;
  loadImageData();
}

function onFlipChange() {
  debug(f`Changing to flip: ${ebook.flip}`);
}

function onLayoutChange() {
  debug(f`Changing to layout: ${ebook.layout}`);
  loadLayout();
}

function onMarksClick() {
  marksDialog.value!.show();
}

function onNotesClick() {
  notesDialog.value!.show();
}

async function onRotateOriginalClick() {
  debug(`Changing to rotate: 0`);
  ebook.rotate = 0;
}

async function onRotateLeftClick() {
  const rotate = (ebook.rotate - 90) % 360;
  debug(`Changing to rotate: ${rotate}`);
  ebook.rotate = rotate;
}

async function onRotateRightClick() {
  const rotate = (ebook.rotate + 90) % 360;
  debug(`Changing to rotate: ${rotate}`);
  ebook.rotate = rotate;
}

async function onSetPreview(index: number, setPreviewCb: (preview: Blob) => void) {
  const preview = await backend!.getBlob(index, toRaw(ebook.color));
  setPreviewCb(preview);
}

function onSearch() {
  loadSearch();
}

function onStep(matchIndex: number) {
  if (matchIndex < startMatchesLength) {
    startPage.value!.scrollToMatchIndex(matchIndex);
  } else {
    endPage.value!.scrollToMatchIndex(matchIndex - startMatchesLength);
  }
}

async function onQuery(index: number, needle: string, doneCb: (matchesFound: boolean) => void) {
  debug(f`Querying for ${needle} on ${index}`);
  const matches = await backend!.search(index, needle);
  doneCb(matches.length > 0);
}

function onScrollTimeout() {
  scrollTimeoutId = 0;

  const startPageRatio = startPage.value!.getVisibleRatio();
  const endPageRatio = endPage.value!.getVisibleRatio();

  let index;
  let topLeft;
  if (startPageRatio > endPageRatio) {
    index = startIndex.value;
    topLeft = startPage.value!.getVisibleTopLeft();
  } else {
    index = endIndex.value;
    topLeft = endPage.value!.getVisibleTopLeft();
  }
  ebook.position = pages.value[index].position;
  ebook.position.x = topLeft.x;
  ebook.position.y = topLeft.y;

  const ratio = Math.floor(Math.max(startPageRatio, endPageRatio) * 100);
  debug(f`Updating position: ${ebook.position} (${ratio}% visible)`);
}

function onScroll() {
  if (scrollTimeoutId) window.clearTimeout(scrollTimeoutId);
  scrollTimeoutId = window.setTimeout(onScrollTimeout, 250);
}

function getPageProperties(index: number) {
  let width;
  let height;
  let transparent;

  if (pages.value.length == 0) {
    width = 0;
    height = 0;
    transparent = true;
  } else if (index < 0) {
    width = pages.value[0].width;
    height = pages.value[0].height;
    transparent = true;
  } else if (index >= pages.value.length) {
    width = pages.value[pages.value.length - 1].width;
    height = pages.value[pages.value.length - 1].height;
    transparent = true;
  } else {
    width = pages.value[index].width;
    height = pages.value[index].height;
    transparent = false;
  }

  return { width, height, transparent };
}

function onOpenUri(uri: string) {
  debug(`Asking if to open URI: ${uri}`);
  openUriDialog.value!.open(uri);
}

function onPreviousClick() {
  const index = startIndex.value - 1;
  onPositionChange(pages.value[index].position);
}

function onNextClick() {
  const index = endIndex.value + 1;
  onPositionChange(pages.value[index].position);
}

async function loadImageData() {
  if (startIndex.value >= 0) {
    const imageData = await backend!.getImageData(
      startIndex.value,
      toRaw(ebook.color),
      ebook.scale,
    );
    startPage.value!.setImageData(imageData);
  } else {
    startPage.value!.setImageData(null);
  }

  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length) {
    const imageData = await backend!.getImageData(endIndex.value, toRaw(ebook.color), ebook.scale);
    endPage.value!.setImageData(imageData);
  } else {
    endPage.value!.setImageData(null);
  }
}

async function loadNodes() {
  if (startIndex.value >= 0) {
    const nodes = await backend!.getNodes(startIndex.value);
    startPage.value!.setNodes(nodes);
  } else {
    startPage.value!.setNodes([]);
  }

  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length) {
    const nodes = await backend!.getNodes(endIndex.value);
    endPage.value!.setNodes(nodes);
  } else {
    endPage.value!.setNodes([]);
  }
}

async function loadSearch() {
  if (!searching.value) return;

  const needle = searchBar.value!.getNeedle();
  debug(`Searching for needle: ${needle}`);

  let matchesLength = 0;

  if (startIndex.value >= 0) {
    const matches = await backend!.search(startIndex.value, needle);
    startPage.value!.setMatches(matches);
    matchesLength += matches.length;
    startMatchesLength = matches.length;
  } else {
    startPage.value!.setMatches([]);
    startMatchesLength = 0;
  }

  if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length) {
    const matches = await backend!.search(endIndex.value, needle);
    endPage.value!.setMatches(matches);
    matchesLength += matches.length;
  } else {
    endPage.value!.setMatches([]);
  }

  searchBar.value!.setMatchesLength(matchesLength);
}

async function loadLayout() {
  let start, end;

  if (ebook.layout == EbookLayout.DualStart) {
    if (ebook.position.value % 2 == 0) {
      start = ebook.position.value;
      end = ebook.position.value + 1;
    } else {
      start = ebook.position.value - 1;
      end = ebook.position.value;
    }
  } else if (ebook.layout == EbookLayout.DualEnd) {
    if (ebook.position.value % 2 == 0) {
      start = ebook.position.value - 1;
      end = ebook.position.value;
    } else {
      start = ebook.position.value;
      end = ebook.position.value + 1;
    }
  } else if (ebook.layout == EbookLayout.Single) {
    start = ebook.position.value;
    end = ebook.position.value;
  } else {
    throw new Error(`Unknown layout: ${ebook.layout}`);
  }

  startIndex.value = start;
  endIndex.value = end;

  await loadImageData();
  await loadNodes();
  await loadSearch();

  if (ebook.position.value == startIndex.value) {
    startPage.value!.scrollTo(ebook.position.x, ebook.position.y);
  } else {
    endPage.value!.scrollTo(ebook.position.x, ebook.position.y);
  }
}

async function open(ebook: Ebook) {
  debug(f`Opening: ${ebook}`);
  const ctor = useEbookBackend(ebook.file.type);
  debug(f`Using backend: ${ctor.name}`);

  let fitScale = false;
  if (ebook.openingFirstTime) {
    if (window.screen.width >= DUAL_PAGE_WIDTH) ebook.layout = EbookLayout.DualEnd;
    fitScale = true;
    ebook.openingFirstTime = false;
  }

  backend = new ctor({ passwordCb: console.error }, {});
  const blob = await source.readFile(ebook.file);
  await backend!.open(blob, ebook.file.type);
  pages.value = await backend!.getPages();
  outlines.value = await backend!.getOutlines();
  emit("metadata", await backend!.getMetadata());

  await loadLayout();
  if (fitScale) await onScaleToFitPage();
}

async function close(ebook: Ebook) {
  debug(f`Closing: ${ebook}`);
  pages.value = [];
  outlines.value = [];
  await backend!.close();
  backend = null;
  await database.putItem(toRaw(ebook));
}

watch(
  () => ebook,
  async (newEbook, oldEbook) => {
    if (oldEbook) await close(oldEbook);
    await open(newEbook);
  },
  { immediate: true },
);

onMounted(() => {
  observer.observe(container.value!);
});

onUnmounted(async () => {
  observer.disconnect();
  await close(ebook);
});
</script>
