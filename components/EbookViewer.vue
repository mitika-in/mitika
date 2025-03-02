<template>
  <div
    v-if="ebook"
    class="flex flex-col gap-8"
  >
    <header class="flex flex-row gap-4 items-center">
      <button class="btn btn-ghost">
        <BookmarkIcon class="size-4" />
      </button>
      <EbookPositionButton
        ref="positionButton"
        :pages="pages"
        :position="ebook.position"
        @change="onPositionChange"
      />
      <TitleBar
        class="grow"
        :subtitle="ebook.file.name"
        title=""
      />
      <EbookScaleButton
        :scale="ebook.scale"
        @change="onScaleChange"
        @fitHeight="onScaleToFitHeight"
        @fitPage="onScaleToFitPage"
        @fitWidth="onScaleToFitWidth"
      />
      <Dropdown>
        <template #button>
          <MoreVerticalIcon class="size-4" />
        </template>
        <template #content>
          <ul class="menu bg-base-100 rounded-box w-64 shadow-sm">
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
    </header>
    <div ref="container" />
  </div>
</template>
<script setup lang="ts">
import { useDatabase } from "@/database";
import { useEbookBackend } from "@/backends";
import { ColorScheme, EbookLayout, Ebook } from "@/models";
import { useLogger } from "@/logging";
import { Outline } from "@/backends/outline";
import { useStorage } from "@/storages";

const { f, debug } = useLogger("ebookViewer");

interface Emits {
  metadata: [name: string, authors: string[], cover: Blob | null];
  outlines: [outlines: Outline[]];
}

const emit = defineEmits<Emits>();

const PAGE_GAP = 16;

const ebook = ref(null);

let backend = null;
let database = null;
let storage = null;

const positionButton = useTemplateRef("positionButton");
const container = useTemplateRef("container");

const pages = ref([]);

async function open(item: Ebook) {
  debug(f`Opening: ${item}`);
  ebook.value = item;

  const ctor = useEbookBackend(item.file.type);
  debug(f`Using backend: ${ctor.name}`);

  const blob = await storage.readFile(item.file);
  backend = new ctor();
  await backend.open(blob, {
    container: container.value,
    gap: PAGE_GAP,
    positionCb: onPositionChanged,
    scaleCb: onScaleChanged,
  });

  pages.value = await backend.getPages();

  if (ebook.value.openingFirstTime) {
    ebook.value.color = ColorScheme.Original;
    ebook.value.flip = false;
    ebook.value.rotate = 0;
    ebook.value.layout = EbookLayout.DualEnd;
    ebook.value.position = pages.value[0];
    await backend.scaleToFitPage();
    ebook.value.openingFirstTime = false;
  } else {
    await backend.setScale(ebook.value.scale);
    await backend.setColor(ebook.value.color);
  }

  await backend.setFlip(ebook.value.flip);
  await backend.setRotate(ebook.value.rotate);
  await backend.setColor(ebook.value.color);
  await backend.setLayout(ebook.value.layout);
  await backend.setPosition(ebook.value.position);

  positionButton.value.open(backend);

  emit("metadata", await backend.getName(), await backend.getAuthors(), await backend.getCover());
  emit("outlines", await backend.getOutlines());
}

async function close() {
  if (!backend) return;

  debug(f`Closing: ${ebook.value}`);

  pages.value = [];

  if (positionButton.value) positionButton.value.close();

  await backend.close();
  backend = null;

  await database.putItem(toRaw(ebook.value));
  ebook.value = null;
}

defineExpose({ open, close });

database = await useDatabase();
storage = await useStorage();

onUnmounted(async () => {
  await close();
});

async function onPositionChanged(position) {
  ebook.value.position = position;
}

async function onScaleChanged(scale) {
  ebook.value.scale = scale;
}

async function onPositionChange(position) {
  debug(f`Changing to position: ${position}`);
  await backend.setPosition(position);
}

async function onScaleChange(scale: number) {
  debug(`Changing to scale: ${scale}`);
  await backend.setScale(scale);
}

async function onScaleToFitWidth() {
  debug(`Changing scale to fit width`);
  await backend.scaleToFitWidth();
}

async function onScaleToFitHeight() {
  debug(`Changing scale to fit height`);
  await backend.scaleToFitHeight();
}

async function onScaleToFitPage() {
  debug(`Changing scale to fit page`);
  await backend.scaleToFitPage();
}

async function onColorClick(color: EbookColor) {
  ebook.value.color = color;
  debug(f`Changing to color: ${color}`);
  await backend.setColor(color);
}

async function onFlipChange() {
  debug(`Changing to flip: ${ebook.value.flip}`);
  await backend.setFlip(ebook.value.flip);
}

async function onLayoutChange() {
  debug(`Changing to layout: ${ebook.value.layout}`);
  await backend.setLayout(ebook.value.layout);
}

async function onRotateOriginalClick() {
  ebook.value.rotate = 0;
  debug(`Changing to rotate: ${ebook.value.rotate}`);
  await backend.setRotate(ebook.value.rotate);
}

async function onRotateLeftClick() {
  ebook.value.rotate = (ebook.value.rotate - 90) % 360;
  debug(`Changing to rotate: ${ebook.value.rotate}`);
  await backend.setRotate(ebook.value.rotate);
}

async function onRotateRightClick() {
  ebook.value.rotate = (ebook.value.rotate + 90) % 360;
  debug(`Changing to rotate: ${ebook.value.rotate}`);
  await backend.setRotate(ebook.value.rotate);
}
</script>
