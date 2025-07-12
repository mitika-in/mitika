<template>
  <div class="relative flex flex-col gap-4">
    <div
      class="collapse"
      :class="{ 'collapse-open': !focus }"
    >
      <div class="collapse-content @container flex flex-col gap-4">
        <div class="@container flex flex-row items-center justify-center gap-4">
          <button
            class="btn btn-ghost hidden @3xs:flex"
            @click="outlinesDialog!.toggle()"
          >
            <ListIcon class="size-4" />
          </button>
          <MarkButton
            class="hidden @3xs:flex"
            :button="true"
            :item="ebook"
          />
          <button
            :class="{ 'btn-ghost': !searching }"
            class="btn hidden @2xs:flex"
            @click="onSearchClick"
          >
            <SearchIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @xs:flex"
            @click="scaleDialog.toggle()"
          >
            <EyeIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @sm:flex"
            @click="colorDialog.toggle()"
          >
            <ImageIcon class="size-4" />
          </button>
          <label class="btn btn-ghost hidden @md:flex">
            <input
              v-model="ebook.flip"
              class="checkbox peer hidden"
              type="checkbox"
              @change="onFlipChange"
            />
            <span class="peer-checked:rotate-y-180">
              {{ $t("F") }}
            </span>
          </label>
          <button
            class="btn btn-ghost hidden @lg:flex"
            @click="layoutDialog.toggle()"
          >
            <ColumnsIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @xl:flex"
            @click="rotateDialog.toggle()"
          >
            <ArrowUpCircleIcon
              class="size-4"
              :style="`transform: rotateZ(${ebook.rotate}deg)`"
            />
          </button>
          <button
            class="btn btn-ghost hidden @2xl:flex"
            @click="addNoteDialog.toggle()"
          >
            <FilePlusIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @3xl:flex"
            @click="marksDialog.toggle()"
          >
            <TagIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @3xl:flex"
            @click="notesDialog.toggle()"
          >
            <LayersIcon class="size-4" />
          </button>
          <Dropdown
            popoverId="ebookViewerPo"
            styleClass="btn-ghost @3xl:hidden"
          >
            <template #button>
              <MoreVerticalIcon class="size-4" />
            </template>
            <template #content>
              <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
                <li class="@3xs:hidden">
                  <button @click="outlinesDialog.toggle()">
                    {{ $t("Outlines") }}
                  </button>
                </li>
                <li class="@3xs:hidden">
                  <MarkButton
                    :button="false"
                    :item="ebook"
                  />
                </li>
                <li class="@2xs:hidden">
                  <button @click="onSearchClick">
                    <CheckIcon
                      v-show="searching"
                      class="size-4"
                    />
                    {{ $t("Search") }}
                  </button>
                </li>
                <li class="@xs:hidden">
                  <button @click="scaleDialog.toggle()">
                    {{ $t("Scale") }}
                  </button>
                </li>
                <li class="@sm:hidden">
                  <button @click="colorDialog.toggle()">
                    {{ $t("Color") }}
                  </button>
                </li>
                <li class="@md:hidden">
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
                <li class="@lg:hidden">
                  <button @click="layoutDialog.toggle()">
                    {{ $t("Layout") }}
                  </button>
                </li>
                <li class="@xl:hidden">
                  <button @click="rotateDialog.toggle()">
                    {{ $t("Rotate") }}
                  </button>
                </li>
                <li class="@2xl:hidden">
                  <button @click="addNoteDialog.toggle()">
                    {{ $t("Add note") }}
                  </button>
                </li>
                <li class="@3xl:hidden">
                  <button @click="marksDialog.toggle()">
                    {{ $t("Marks") }}
                  </button>
                </li>
                <li class="@3xl:hidden">
                  <button @click="notesDialog.toggle()">
                    {{ $t("Notes") }}
                  </button>
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
      </div>
    </div>
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
      <button
        class="btn btn-circle"
        @click="previewsDialog.toggle()"
      >
        {{ pages.length != 0 ? pages[ebook.position.value].position.name : "" }}
      </button>
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
    <EbookColorDialog
      ref="colorDialog"
      :color="ebook.color"
      @change="onColorChange"
    />
    <EbookLayoutDialog
      ref="layoutDialog"
      :layout="ebook.layout"
      @change="onLayoutChange"
    />
    <EbookPagePreviewsDialog
      ref="previewsDialog"
      :color="ebook.color"
      :flip="ebook.flip"
      :pages="pages"
      :rotate="ebook.rotate"
      @change="onPositionChange"
      @setPreview="onSetPreview"
    />
    <EbookRotateDialog
      ref="rotateDialog"
      :rotate="ebook.rotate"
      @change="onRotateChange"
    />
    <EbookScaleDialog
      ref="scaleDialog"
      :resizePolicy="ebook.resizePolicy"
      :scale="ebook.scale"
      @change="onScaleChange"
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
import { Constants } from "@/constants";
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
const colorDialog = useTemplateRef("colorDialog");
const layoutDialog = useTemplateRef("layoutDialog");
const marksDialog = useTemplateRef("marksDialog");
const notesDialog = useTemplateRef("notesDialog");
const openUriDialog = useTemplateRef("openUriDialog");
const outlinesDialog = useTemplateRef("outlinesDialog");
const previewsDialog = useTemplateRef("previewsDialog");
const rotateDialog = useTemplateRef("rotateDialog");
const scaleDialog = useTemplateRef("scaleDialog");

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

async function onScaleChange(scale: number, resizePolicy: EbookResizePolicy) {
  if (scale == -1 && resizePolicy == EbookResizePolicy.None)
    throw new Error(`Invalid scale: ${scale}, resize policy: ${resizePolicy}`);

  let newScale;

  if (resizePolicy != EbookResizePolicy.None) {
    if (!pages.value.length || !container.value) {
      debug("Skipping scale change request due to empty pages list or unmounted container");
      return;
    }

    let width = 0;
    let height = 0;

    if (startIndex.value >= 0) {
      width += pages.value[startIndex.value].width;
      height = Math.max(pages.value[endIndex.value].height, height);
    }
    const wScale = container.value.clientWidth / width;

    if (ebook.layout != EbookLayout.Single && endIndex.value < pages.value.length) {
      width += pages.value[endIndex.value].width;
      height = Math.max(pages.value[endIndex.value].height, height);
    }
    const hScale = container.value.clientHeight / height;

    if (resizePolicy == EbookResizePolicy.FitWidth) newScale = wScale;
    else if (resizePolicy == EbookResizePolicy.FitHeight) newScale = hScale;
    else if (resizePolicy == EbookResizePolicy.FitPage) newScale = Math.min(wScale, hScale);
    else throw new Error(`Unknow resize policy: ${resizePolicy}`);

    newScale = Math.min(Math.max(newScale, Constants.EBOOK_MIN_SCALE), Constants.EBOOK_MAX_SCALE);
  } else {
    newScale = scale;
  }

  debug(`Changing to scale: ${newScale}, resize policy: ${resizePolicy}`);

  ebook.scale = newScale;
  ebook.resizePolicy = resizePolicy;
  await loadImageData();
}

function onContainerResize() {
  debug(`Container resized, adopting resize policy: ${ebook.resizePolicy}`);
  if (ebook.resizePolicy != EbookResizePolicy.None) onScaleChange(-1, ebook.resizePolicy);
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

function onColorChange(color: EbookColor) {
  debug(f`Changing to color: ${color}`);
  ebook.color = color;
  loadImageData();
}

function onFlipChange() {
  debug(f`Changing to flip: ${ebook.flip}`);
}

function onLayoutChange(layout: EbookLayout) {
  debug(f`Changing to layout: ${layout}`);
  ebook.layout = layout;
  loadLayout();
}

function onMarksClick() {
  marksDialog.value!.show();
}

function onNotesClick() {
  notesDialog.value!.show();
}

async function onRotateChange(rotate: number) {
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
    ebook.openingFirstTime = false;
  }

  backend = new ctor({ passwordCb: console.error }, {});
  const blob = await source.readFile(ebook.file);
  await backend!.open(blob, ebook.file.type);
  pages.value = await backend!.getPages();
  outlines.value = await backend!.getOutlines();
  emit("metadata", await backend!.getMetadata());

  await loadLayout();
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
