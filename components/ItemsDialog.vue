<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-4">
        <input
          v-model="search"
          class="input grow"
          :placeholder="$t('Search…')"
          @keyup.enter="onEnter"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <div class="flex h-[75vh] grow flex-col overflow-scroll">
        <ol class="list peer">
          <ItemsDialogRow
            v-for="item in filteredItems"
            :key="item.id"
            :item="item"
            @click="onClick(item)"
          />
        </ol>
        <Status
          class="m-auto hidden peer-empty:flex"
          :description="$t('No matching item exists.')"
          :title="$t('No items found')"
          :type="StatusType.Info"
        />
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { StatusType } from "@/components/statusType";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { type Book, type Item, ItemType } from "@/models";

const { f, debug } = useLogger("itemsButton");

interface Props {
  book: Book;
}

interface Emits {
  openItem: [item: Item, force: boolean];
}

const { book } = defineProps<Props>();
const emit = defineEmits<Emits>();

const database = await useDatabase();

const dialog = useTemplateRef("dialog");
const items: Ref<Item[]> = ref([]);
const search = ref("");

const filteredItems = computed(() => {
  return items.value.filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase()));
});

function onEnter() {
  if (filteredItems.value.length == 0) return;
  emit("openItem", filteredItems.value[0], true);
}

function onClick(item: Item) {
  emit("openItem", item, true);
  dialog.value!.hide();
}

function findLastItem(lastItemId: string | null, items: Item[], type: ItemType) {
  debug(f`Finding id: ${lastItemId} of type: ${type} from items: ${items}`);
  let foundItem = items.find((item) => item.type == type && item.id == lastItemId);
  debug(f`Found item: ${foundItem}`);
  if (!foundItem) foundItem = items.find((item) => item.type == type);
  debug(f`Coalesced finding to item: ${foundItem}`);
  return foundItem;
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => book,
  async (newBook, oldBook) => {
    if (oldBook) {
      debug(f`Closing: ${oldBook}`);
      items.value = [];
    }

    if (newBook) {
      debug(f`Opening: ${book}`);
      items.value = await database!.getItems(book.id);
      const lastAudiobook = findLastItem(book.lastAudiobookId, items.value, ItemType.Audiobook);
      if (lastAudiobook) emit("openItem", lastAudiobook, false);
      const lastEbook = findLastItem(book.lastEbookId, items.value, ItemType.Ebook);
      if (lastEbook) emit("openItem", lastEbook, false);
    }
  },
  { immediate: true },
);
</script>
