<template>
  <div>
    <button
      class="btn"
      :style="`width: ${Math.ceil(Math.log10(pages.length) + 1)}rem`"
      @click="dialog.show()"
    >
      {{ position.name }}
    </button>
    <Dialog
      ref="dialog"
      :autoWidth="true"
    >
      <div class="flex flex-col gap-4 w-[75vw]">
        <div class="flex flex-row gap-4">
          <input
            v-model="positionInput"
            class="input grow"
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
            class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(128px,1fr))]"
          >
            <EbookThumbnail
              v-for="position in filteredPages"
              :key="position.id"
              :ref="(component) => observe(position, component)"
              :name="position.name"
              @click="emitChange(position)"
            />
          </div>
          <Status
            v-else
            class="h-full"
            :description="$t('Try a valid page.')"
            :title="$t('Page not found')"
            type="info"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { useLogger } from "@/logging";
import { EbookPosition } from "@/models";
import { EbookBackend } from "@/backends";

const { f, debug } = useLogger("ebook-position-button");

interface Props {
  position: EbookPosition;
  pages: EbookPosition[];
}

interface Emits {
  change: [position: EbookPosition];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialog = useTemplateRef("dialog");
const positionInput = ref("");
const components = new Map();

let backend = null;

const filteredPages = computed(() =>
  props.pages.filter(
    (position) => positionInput.value.length == 0 || position.name.includes(positionInput.value),
  ),
);

async function onIntersection(entries) {
  if (!backend) return;

  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    const [rendered, position, component] = components.get(entry.target);
    if (rendered) continue;

    debug(f`Rendering thumbnail: ${position}`);
    const blob = await backend.getThumbnail(position);
    component.setThumbnail(blob);
    components.set(entry.target, [true, position, component]);
    debug(f`Rendered thumbnail: ${position}`);
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

function observe(position, component) {
  if (!component || !component.element || components.has(component.element)) return;

  components.set(component.element, [false, position, component]);
  observer.observe(component.element);
}

function emitChange(position) {
  emit("change", position);
  dialog.value.hide();
}

function onEnter() {
  if (filteredPages.value.length == 0) return;
  emitChange(filteredPages.value[0]);
}
</script>
