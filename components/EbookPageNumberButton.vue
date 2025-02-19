<template>
  <div>
    <button
      class="btn"
      @click="dialog.show()"
    >
      {{ position }}
    </button>
    <Dialog
      ref="dialog"
      :autoWidth="true"
    >
      <div class="flex flex-col gap-4 w-[75vw]">
        <div class="flex flex-row gap-4">
          <input
            v-model="positionModel"
            class="input input-bordered grow"
            :placeholder="$t('Go to page…')"
            @keyup.enter="onEnter"
          />
          <button
            class="btn btn-ghost"
            @click="dialog.hide()"
          >
            <XIcon class="size-4" />
          </button>
        </div>
        <div class="grow h-[75vh] overflow-scroll">
          <div
            v-if="filteredPages.length != 0"
            class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(256px,1fr))]"
          >
            <EbookPageThumbnail
              v-for="page in filteredPages"
              :key="page.position"
              :ref="(component) => observe(page, component)"
              :page="page"
              :scale="resize(page, thumbnailWidth, thumbnailHeight)"
              @click="emitChange(page.position)"
            />
          </div>
          <Status
            v-else
            class="h-full"
            :description="$t('Try a number between 1 and {length}.', { length: pages.length })"
            :title="$t('Page not found')"
            type="info"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";
import { useLogger } from "@/logging";
import { EbookPageView, EbookBackend } from "@/backends";

const { f, debug } = useLogger("page-button");

interface Props {
  position: number;
  pages: EbookPageView[];
}

interface Emits {
  change: [position: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const thumbnailWidth = 256;
const thumbnailHeight = thumbnailWidth * (Constants.THUMBNAIL_HEIGHT / Constants.THUMBNAIL_WIDTH);

const dialog = useTemplateRef("dialog");
const positionModel = ref("");
const components = new Map();

let backend = null;

const filteredPages = computed(() =>
  props.pages.filter(
    (page) =>
      positionModel.value.length == 0 || page.position.toString().includes(positionModel.value),
  ),
);

function resize(page: EbookPage, maxWidth: number, maxHeight: number): number {
  const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
  return scale;
}

async function onIntersection(entries) {
  if (!backend) return;

  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    const [rendered, page, component] = components.get(entry.target);
    if (rendered) continue;

    debug(f`Rendering thumbnail: ${page.position}`);
    const scale = resize(page, thumbnailWidth, thumbnailHeight);
    const canvas = new OffscreenCanvas(page.width * scale, page.height * scale);
    const context = canvas.getContext("2d");
    await backend.renderPage(page.position, context, { scale });
    const blob = await canvas.convertToBlob({ type: "image/png" });
    component.setThumbnail(blob);
    components.set(entry.target, [true, page, component]);
    debug(f`Rendered thumbnail: ${page.position}`);
  }
}

const observer = new IntersectionObserver(onIntersection);

function open(newBackend: EbookBackend) {
  debug("Opening with new backend");
  backend = newBackend;
}

function close() {
  debug("Closing");
  observer.disconnect();
  components.clear();
  backend = null;
}

defineExpose({ open, close });

onUnmounted(async () => {
  await close();
});

function observe(page, component) {
  if (!component || !component.element || components.has(component.element)) return;

  components.set(component.element, [false, page, component]);
  observer.observe(component.element);
}

function emitChange(position) {
  emit("change", position);
  dialog.value.hide();
}

function onEnter() {
  if (filteredPages.value.length == 0) return;
  emitChange(filteredPages.value[0].position);
}
</script>
