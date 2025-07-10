<template>
  <Dialog
    ref="dialog"
    :autoWidth="true"
  >
    <div class="flex w-[75vw] flex-col gap-4">
      <div class="flex flex-row gap-4">
        <input
          v-model="input"
          class="input grow"
          :placeholder="$t('Go to page…')"
          @keyup.enter="onEnter"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <div
        ref="container"
        class="flex h-[75vh] grow flex-col overflow-scroll"
      >
        <template v-if="observer">
          <div
            v-show="filteredPages.length != 0"
            class="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-4"
          >
            <EbookPagePreview
              v-for="(page, index) in pages"
              v-show="filteredPages.includes(page)"
              :key="index"
              :ref="(component) => onPreviewMounted(index, component)"
              :flip="flip"
              :name="page.position.name"
              :rotate="rotate"
              @click="emitChange(index)"
            />
          </div>
          <Status
            v-show="filteredPages.length == 0"
            class="h-full"
            :description="$t('Try a valid page.')"
            :title="$t('Page not found')"
            :type="StatusType.Info"
          />
        </template>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { type Page } from "@/backends/ebook";
import EbookPagePreview from "@/components/EbookPagePreview.vue";
import { StatusType } from "@/components/statusType";
import { useLogger } from "@/logging";
import { type EbookPosition, type EbookColor } from "@/models";

const { f, debug } = useLogger("ebookPositionButton");

interface Props {
  pages: Page[];
  color: EbookColor;
  flip: boolean;
  rotate: number;
}

interface Emits {
  change: [position: EbookPosition];
  setPreview: [index: number, setPreviewCb: (preview: Blob) => void];
}

const { pages, color, flip, rotate } = defineProps<Props>();
const emit = defineEmits<Emits>();

const input = ref("");

const container = useTemplateRef("container");
const dialog = useTemplateRef("dialog");

const observer: Ref<IntersectionObserver | null> = ref(null);

const visiblePreviews: Set<number> = new Set();
const previews: Map<number, ComponentPublicInstance<typeof EbookPagePreview>> = new Map();

let intersectionTimeoutId = 0;

const filteredPages = computed(() => {
  return pages.filter(
    (page) => input.value.length == 0 || page.position.name.includes(input.value),
  );
});

function setPreviews() {
  for (const index of visiblePreviews) {
    const preview = previews.get(index);
    if (!preview) throw new Error(`Unknown preview for index: ${index}`);
    if (!preview.hasPreview())
      setTimeout(() => {
        debug(f`Requesting preview for ${index}`);
        emit("setPreview", index, (pvw) => preview.setPreview(pvw));
      });
  }
}

function onIntersectionTimedOut() {
  intersectionTimeoutId = 0;

  if (!dialog.value!.isShown()) {
    debug("Not setting previews as dialog is not shown");
    return;
  }

  setPreviews();
}

function onIntersection(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    let index;
    let preview;
    for (const [ebookIndex, ebookPreview] of previews.entries()) {
      if (ebookPreview.root == entry.target) {
        index = ebookIndex;
        preview = ebookPreview;
        break;
      }
    }

    if (!preview) {
      debug(f`Unknown preview for target: ${entry.target}`);
      continue;
    }

    if (entry.isIntersecting) visiblePreviews.add(index!);
    else visiblePreviews.delete(index!);

    if (intersectionTimeoutId) window.clearTimeout(intersectionTimeoutId);
    intersectionTimeoutId = window.setTimeout(onIntersectionTimedOut, 50);
  }
}

async function onPreviewMounted(
  index: number,
  component: Element | ComponentPublicInstance<typeof EbookPagePreview> | null,
) {
  if (!component) {
    previews.delete(index);
    return;
  }

  if (component instanceof Element || !component.root) return;

  if (previews.has(index)) return;

  observer.value!.observe(component.root);
  previews.set(index, component);
}

function emitChange(index: number) {
  emit("change", pages[index].position);
  dialog.value!.hide();
}

function onEnter() {
  if (visiblePreviews.size == 0) return;

  const [index] = visiblePreviews;
  emitChange(index);
}

function toggle() {
  dialog.value!.toggle();
  if (dialog.value!.isShown()) setPreviews();
}

defineExpose({ toggle });

watch([() => color], () => {
  debug(`Clearing previews as color changed`);
  for (const preview of previews.values()) preview.setPreview(null);
});

onMounted(() => {
  observer.value = new IntersectionObserver(onIntersection, {
    root: container.value,
  });
});
</script>
