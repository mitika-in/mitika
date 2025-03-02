<template>
  <div class="bg-base-100 flex flex-col gap-4 min-h-full w-3/4 lg:w-1/4 p-4">
    <select
      v-model="currentItem"
      class="select select-bordered w-full"
      @change="updateSections"
    >
      <option :value="ItemType.Audiobook">
        {{ $t("Audiobooks") }}
      </option>
      <option :value="ItemType.Ebook">
        {{ $t("Ebooks") }}
      </option>
    </select>
    <select
      v-model="currentSection"
      class="select select-bordered w-full"
    >
      <option :value="SectionType.ITEMS">
        {{ $t("Items") }}
      </option>
      <option :value="SectionType.OUTLINES">
        {{ $t("Outline") }}
      </option>
      <option :value="SectionType.MARKS">
        {{ $t("Marks") }}
      </option>
      <option :value="SectionType.NOTES">
        {{ $t("Notes") }}
      </option>
    </select>
    <div class="grow h-0 overflow-scroll">
      <template v-if="currentSection == SectionType.ITEMS">
        <ul
          v-if="items.length != 0"
          class="menu"
        >
          <NavigatorItemRow
            v-for="item of items"
            :key="item.id"
            :item="item"
            @click="$emit('openItem', item)"
          />
        </ul>
        <Status
          v-else
          :action="$t('Edit Book')"
          :compact="true"
          :description="$t('Add an item by editing the book.')"
          :title="$t('Empty list')"
          type="info"
        />
      </template>
      <template v-else-if="currentSection == SectionType.OUTLINES">
        <ul
          v-if="outlines.length != 0"
          class="menu"
        >
          <NavigatorOutlineRow
            v-for="outline of outlines"
            :outline="outline"
            @click="(outline) => $emit('openOutline', currentItem, outline)"
          />
        </ul>
        <Status
          v-else
          :compact="true"
          :description="$t('Item has an empty outline.')"
          :title="$t('Empty list')"
          type="info"
        />
      </template>
      <template v-else-if="currentSection == SectionType.MARKS">
        <ul
          v-if="marks.length != 0"
          class="menu"
        >
          <NavigatorMarkRow
            v-for="mark of marks"
            :key="mark.id"
            :mark="mark"
            @click="$emit('openNote', currentItem, mark)"
          />
        </ul>
        <Status
          v-else
          :compact="true"
          :description="$t('Add a mark to display it here.')"
          :title="$t('Empty list')"
          type="info"
        />
      </template>
      <template v-else-if="currentSection == SectionType.NOTES">
        <ul
          v-if="notes.length != 0"
          class="menu"
        >
          <NavigatorNoteRow
            v-for="note of notes"
            :key="note.id"
            :note="note"
            @click="$emit('openNote', currentItem, note)"
          />
        </ul>
        <Status
          v-else
          :compact="true"
          :description="$t('Add a note to display it here.')"
          :title="$t('Empty list')"
          type="info"
        />
      </template>
      <template v-else>
        {{ unknownSection() }}
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Book, Item, ItemType, Mark, Note } from "@/models";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { Outline } from "@/backends/outline";

const { t } = useI18n();
const { f, debug } = useLogger("sidebar");

enum SectionType {
  ITEMS,
  OUTLINES,
  MARKS,
  NOTES,
}

interface Emits {
  openItem: [item: Item];
  openOutline: [type: ItemType, outline: Outline];
  openNote: [type: ItemType, note: Note];
  openMark: [type: ItemType, mark: Mark];
}

const emit = defineEmits<Emits>();

let database;

const audiobook = ref(null);
const audiobookOutlines = ref([]);
const audiobookNotes = ref([]);
const audiobookMarks = ref([]);
const audiobooks = ref([]);
const ebook = ref(null);
const ebookOutlines = ref([]);
const ebookNotes = ref([]);
const ebookMarks = ref([]);
const ebooks = ref([]);

const currentItem = ref(ItemType.Audiobook);
const currentSection = ref(SectionType.OUTLINES);
const items = ref([]);
const outlines = ref([]);
const notes = ref([]);
const marks = ref([]);

function updateSections() {
  if (currentItem.value == ItemType.Audiobook) {
    items.value = audiobooks.value;
    outlines.value = audiobookOutlines.value;
    notes.value = audiobookNotes.value;
    marks.value = audiobookMarks.value;
  } else if (currentItem.value == ItemType.Ebook) {
    items.value = ebooks.value;
    outlines.value = ebookOutlines.value;
    notes.value = ebookNotes.value;
    marks.value = ebookMarks.value;
  } else {
    throw new Error(`Unknown currentItem: ${currentItem.value}`);
  }
}

function findLastItem(lastItemId: number | null, items: Item[]) {
  debug(f`Finding id=${lastItemId} from items=${items}`);
  let foundItem = items.find((item) => item.id == lastItemId);
  debug(f`Found item=${foundItem}`);
  if (!foundItem && items.length >= 1) foundItem = items[0];
  debug(f`Coalesced finding to item=${foundItem}`);
  return foundItem;
}

async function fetchItemDetails(item: Item) {
  let notes;
  let marks;

  if (item.type == ItemType.Audiobook) {
    notes = audiobookNotes;
    marks = audiobookMarks;
  } else if (item.type == ItemType.Ebook) {
    notes = ebookNotes;
    marks = ebookMarks;
  } else {
    throw new Error(`Unknown item type: ${item.type}`);
  }

  notes.value = await database.getNotes(item.id);
  marks.value = await database.getMarks(item.id);
}

async function setBook(book: Book) {
  if (!database) database = await useDatabase();

  audiobooks.value = await database.getItems(book.id, ItemType.Audiobook);
  ebooks.value = await database.getItems(book.id, ItemType.Ebook);
  currentItem.value = audiobooks.value.length != 0 ? ItemType.Audiobook : ItemType.Ebook;

  audiobook.value = findLastItem(book.lastAudiobookId, audiobooks.value);
  if (audiobook.value) {
    await fetchItemDetails(audiobook.value);
    emit("openItem", audiobook.value);
  }

  ebook.value = findLastItem(book.lastEbookId, ebooks.value);
  if (ebook.value) {
    await fetchItemDetails(ebook.value);
    emit("openItem", ebook.value);
  }

  updateSections();
}

async function setOutlines(type: ItemType, outlines: Outline[]) {
  debug(f`Setting outlines of length=${outlines.length} for type=${type}`);
  if (type == ItemType.Audiobook) audiobookOutlines.value = outlines;
  else if (type == ItemType.Ebook) ebookOutlines.value = outlines;
  else throw new Error(`Unknown item type: ${type}`);
  updateSections();
}

defineExpose({ setBook, setOutlines });

function unknownSection() {
  throw new Error(`Unknown section: ${currentSection.value}`);
}
</script>
