<template>
  <div
    v-if="ebook"
    class="flex flex-col gap-8"
  >
    <header class="flex flex-row gap-4 items-center">
      <button class="btn btn-ghost">
        <BookmarkIcon class="size-4" />
      </button>
      <EbookPageNumberButton
        ref="pageNumberButton"
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
          <ul
            class="menu bg-base-200 rounded-box w-64 shadow"
            tabindex="0"
          >
            <li>
              <button>
                {{ $t("Search") }}
              </button>
            </li>
            <li>
              <details>
                <summary>
                  {{ $t("Rotation") }}
                </summary>
                <ul>
                  <li>
                    <button>
                      {{ $t("Original") }}
                    </button>
                  </li>
                  <li>
                    <button>
                      {{ $t("Rotate left") }}
                    </button>
                  </li>
                  <li>
                    <button>
                      {{ $t("Rotate right") }}
                    </button>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <label class="label cursor-pointer">
                <span class="label-text">
                  {{ $t("Flip") }}
                </span>
                <input
                  class="checkbox"
                  type="checkbox"
                />
              </label>
            </li>
            <li>
              <details>
                <summary>
                  {{ $t("Layout") }}
                </summary>
                <ul>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Single") }}
                      </span>
                      <input
                        v-model="layout"
                        type="radio"
                        :value="PageLayout.SINGLE"
                        @change="onLayoutChange"
                      />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Dual start") }}
                      </span>
                      <input
                        v-model="layout"
                        type="radio"
                        :value="PageLayout.DUAL_START"
                        @change="onLayoutChange"
                      />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Dual end") }}
                      </span>
                      <input
                        v-model="layout"
                        type="radio"
                        :value="PageLayout.DUAL_END"
                        @change="onLayoutChange"
                      />
                    </label>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>
                  {{ $t("Colors") }}
                </summary>
                <ul>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Original") }}
                      </span>
                      <input type="radio" />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Invert") }}
                      </span>
                      <input type="radio" />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Sepia") }}
                      </span>
                      <input type="radio" />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Solarized light") }}
                      </span>
                      <input type="radio" />
                    </label>
                  </li>
                  <li>
                    <label class="label cursor-pointer">
                      <span class="label-text">
                        {{ $t("Solarized dark") }}
                      </span>
                      <input type="radio" />
                    </label>
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
import { PageLayout, Ebook } from "@/models";
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

const layout = ref(PageLayout.SINGLE);
const pageNumberButton = useTemplateRef("pageNumberButton");
const container = useTemplateRef("container");

const pages = ref([]);

async function open(item: Ebook) {
  debug(f`Opening: ${item}`);
  ebook.value = item;

  const ctor = useEbookBackend(item.file.type);
  debug(f`Using backend: ${ctor.name}`);

  const blob = await storage.readFile(item.file);
  backend = new ctor();
  await backend.open(blob, container.value, PAGE_GAP, onPositionChanged, onScaleChanged);

  ebook.value.length = await backend.getLength();
  pages.value = await backend.getPages();

  layout.value = ebook.value.layout;
  await backend.setLayout(ebook.value.layout);

  await backend.setPosition(ebook.value.position);

  if (ebook.value.openingFirstTime) {
    await backend.scaleToFitPage();
    ebook.value.openingFirstTime = false;
  } else {
    await backend.setScale(ebook.value.scale);
  }

  pageNumberButton.value.open(backend);

  emit("metadata", await backend.getName(), await backend.getAuthors(), await backend.getCover());
  emit("outlines", await backend.getOutlines());
}

async function close() {
  if (!backend) return;

  debug(f`Closing: ${ebook.value}`);

  pages.value = [];

  if (pageNumberButton.value) pageNumberButton.value.close();

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
  debug(`Changing to position: ${position}`);
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

async function onLayoutChange() {
  debug(`Changing to layout: ${layout.value}`);
  await backend.setLayout(layout.value);
  ebook.value.layout = layout.value;
}
</script>
