<template>
  <div class="drawer">
    <input
      class="drawer-toggle"
      id="sidebar"
      type="checkbox"
    />
    <div class="drawer-content flex flex-col h-dvh gap-4 p-4">
      <header class="flex flex-row gap-4 items-center">
        <label
          class="btn btn-ghost drawer-button"
          for="sidebar"
        >
          <SidebarIcon class="size-4" />
        </label>
        <TitleBar
          class="grow"
          :subtitle="book.authors.join(', ')"
          :title="book.name"
        />
        <Dropdown>
          <template #button>
            <MenuIcon class="size-4" />
          </template>
          <template #content>
            <ul class="menu rounded-box bg-base-100 w-64 shadow-sm">
              <li>
                <button @click="onEdit">
                  {{ $t("Edit") }}
                </button>
              </li>
              <li>
                <button @click="onHome">
                  {{ $t("Home") }}
                </button>
              </li>
              <li>
                <button>
                  {{ $t("Help") }}
                </button>
              </li>
              <li>
                <button>
                  {{ $t("About {name}", { name: Constants.NAME }) }}
                </button>
              </li>
            </ul>
          </template>
        </Dropdown>
      </header>
      <EbookViewer
        ref="ebook-viewer"
        class="grow"
        @metadata="onMetadata"
        @outlines="async (o) => await onOutlines(ItemType.EBOOK, o)"
      />
      <AudiobookPlayer
        ref="audiobook-player"
        @metadata="onMetadata"
        @outlines="async (o) => await onOutlines(ItemType.AUDIOBOOK, o)"
      />
    </div>
    <aside class="drawer-side">
      <label
        aria-label="Close sidebar"
        class="drawer-overlay"
        for="sidebar"
      />
      <Navigator
        ref="navigator"
        @openItem="open"
      />
    </aside>
  </div>
</template>
<script lang="ts" setup>
import { useDatabase } from "@/database";
import { Constants } from "@/constants";
import { ItemType, Item } from "@/models";
import { useLogger } from "@/logging";
import { Outline } from "@/backends/outline";
import { useStorage } from "@/storages";

const route = useRoute();
const database = await useDatabase();
const storage = await useStorage();

const { f, debug } = useLogger("open");

const book = ref(await database.getBook(route.params.id));
const audiobook = ref(null);
const ebook = ref(null);

const viewer = useTemplateRef("ebook-viewer");
const player = useTemplateRef("audiobook-player");
const navigator = useTemplateRef("navigator");

async function open(item: Item) {
  let component;
  let openItem;

  debug(f`Opening item: ${item}`);

  if (item.type == ItemType.AUDIOBOOK) {
    component = player.value;
    openItem = audiobook;
  } else if (item.type == ItemType.EBOOK) {
    component = viewer.value;
    openItem = ebook;
  } else {
    throw new Error(`Unknown item type: ${item.type}`);
  }

  if (openItem.value) {
    debug(f`Closing already open item: ${openItem}`);
    await component.close();
  }

  openItem.value = item;
  await component.open(openItem.value);
}

async function onEdit() {
  await navigateTo(`/edit/${book.value.id}`);
}

async function onHome() {
  await navigateTo("/");
}

async function onMetadata(name: string, authors: string[], cover: Blob | null) {
  debug(`Got metadata; name: ${name}, authors: ${authors}, cover: ${cover}`);

  if (name.length != 0 && book.value.name.length == 0) {
    debug("Setting name from metadata");
    book.value.name = name;
  }

  if (authors.length != 0 && book.value.authors.length == 0) {
    debug("Setting authors from metadata");
    book.value.authors = authors;
  }

  if (cover && !(await storage.readCache(`${book.value.id}_cover.png`))) {
    debug("Setting cover from metadata");
    await storage.writeCache(`${book.value.id}_cover.png`, cover);
  }
}

async function onOutlines(type: ItemType, outlines: Outline[]) {
  await navigator.value.setOutlines(type, outlines);
}

onMounted(async () => {
  await navigator.value.setBook(book.value);
});

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
</script>
