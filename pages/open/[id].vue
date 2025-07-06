<template>
  <div class="flex h-dvh flex-col gap-4 p-4">
    <button
      v-show="book.focus"
      class="btn btn-circle absolute end-4 top-4 z-2"
      @click="onFocusToggle"
    >
      <ZapOffIcon class="size-4" />
    </button>
    <div
      class="collapse"
      :class="{ 'collapse-open': !book.focus }"
    >
      <header class="collapse-content flex flex-row gap-4">
        <button
          class="btn btn-ghost"
          @click="itemsDialog!.toggle()"
        >
          <FileIcon class="size-4" />
        </button>
        <TitleBar
          class="grow"
          :subtitle="book.authors.join(', ')"
          :title="book.name"
        />
        <Dropdown popoverId="openPo">
          <template #button>
            <MenuIcon class="size-4" />
          </template>
          <template #content>
            <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
              <li v-if="audiobook && ebook">
                <details>
                  <summary>
                    {{ $t("View") }}
                  </summary>
                  <ul>
                    <li>
                      <label>
                        <input
                          v-model="book.openAudiobook"
                          type="checkbox"
                          class="checkbox"
                        />
                        {{ $t("Audiobook") }}
                      </label>
                    </li>
                    <li>
                      <label>
                        <input
                          v-model="book.openEbook"
                          type="checkbox"
                          class="checkbox"
                        />
                        {{ $t("Ebook") }}
                      </label>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <button @click="onFocusToggle">
                  {{ $t("Focus mode") }}
                </button>
              </li>
              <li>
                <NuxtLink :to="`/edit/${book.id}`">
                  {{ $t("Edit") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/">
                  {{ $t("Home") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/logs">
                  {{ $t("Logs") }}
                </NuxtLink>
              </li>
              <li>
                <button>
                  {{ $t("Help") }}
                </button>
              </li>
              <li>
                <button @click="aboutDialog!.toggle()">
                  {{ $t("About {name}", { name: Constants.NAME }) }}
                </button>
              </li>
            </ul>
          </template>
        </Dropdown>
      </header>
    </div>
    <figure
      v-if="!ebook || !book.openEbook"
      class="flex h-0 grow place-content-center"
    >
      <img
        :alt="book.name"
        :src="coverUrl ? coverUrl : './fallback.webp'"
        class="object-scale-down"
      />
    </figure>
    <EbookViewer
      v-if="ebook && book.openEbook"
      class="grow"
      :ebook="ebook"
      :focus="book.focus"
      @metadata="onMetadata"
    />
    <AudiobookPlayer
      v-if="audiobook && book.openAudiobook"
      :audiobook="audiobook"
      :focus="book.focus"
      @metadata="onMetadata"
    />
    <AboutDialog ref="aboutDialog" />
    <ItemsDialog
      ref="itemsDialog"
      :book="book"
      @openItem="onOpenItem"
    />
  </div>
</template>
<script lang="ts" setup>
import type { Metadata } from "@/backends/metadata";
import { Constants } from "@/constants";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { ItemType, type Audiobook, type Ebook, type Item } from "@/models";
import { useStorage } from "@/storages";

const route = useRoute();
const database = await useDatabase();
const storage = await useStorage();

const { f, debug } = useLogger("open");

const book = ref(await database.getBook(route.params.id as string));
const cover = ref(await storage.read(`/covers/${book.value.id}.png`));
const audiobook: Ref<Audiobook | null> = ref(null);
const ebook: Ref<Ebook | null> = ref(null);

const aboutDialog = useTemplateRef("aboutDialog");
const itemsDialog = useTemplateRef("itemsDialog");

const coverUrl: ComputedRef<string | null> = computed((oldCoverUrl) => {
  if (oldCoverUrl) URL.revokeObjectURL(oldCoverUrl as string);
  if (!cover.value) return null;
  return URL.createObjectURL(cover.value);
});

function onFocusToggle() {
  debug(`Changing to focus: ${!book.value.focus}`);
  book.value.focus = !book.value.focus;
}

async function onOpenItem(item: Item, forceOpen: boolean) {
  debug(f`Opening item: ${item}, force: ${forceOpen}`);
  if (item.type == ItemType.Audiobook) {
    audiobook.value = item as Audiobook;
    book.value.openAudiobook = book.value.openAudiobook || forceOpen;
  } else if (item.type == ItemType.Ebook) {
    ebook.value = item as Ebook;
    book.value.openEbook = book.value.openEbook || forceOpen;
  } else {
    throw new Error(`Unknown item type: ${item.type}`);
  }
}

async function onMetadata(metadata: Metadata) {
  debug(f`Got metadata: ${metadata}`);

  if (metadata.name.length != 0 && book.value.name.length == 0) {
    debug("Setting name from metadata");
    book.value.name = metadata.name;
  }

  if (metadata.authors.length != 0 && book.value.authors.length == 0) {
    debug("Setting authors from metadata");
    book.value.authors = metadata.authors;
  }

  if (metadata.cover && !cover.value) {
    debug("Setting cover from metadata");
    await storage.write(`/covers/${book.value.id}.png`, metadata.cover);
    cover.value = metadata.cover;
  }
}

onUnmounted(async () => {
  book.value.lastOpened = new Date();

  if (audiobook.value) {
    book.value.lastAudiobookId = audiobook.value.id;
  }

  if (ebook.value) {
    book.value.lastEbookId = ebook.value.id;
  }

  await database.putBook(toRaw(book.value));
});

useHead({ title: book.value.name });
</script>
