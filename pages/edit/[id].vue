<template>
  <div class="flex grow flex-col gap-8 items-center p-4">
    <header class="flex flex-row w-full justify-between">
      <button
        class="btn"
        @click="cancel"
      >
        {{ $t("Cancel") }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="zeroItems"
        @click="save"
      >
        {{ $t("Save") }}
      </button>
    </header>
    <main class="flex flex-col gap-4 w-full lg:w-1/2">
      <fieldset class="fieldset">
        <label class="fieldset-label">
          {{ $t("Name") }}
        </label>
        <input
          v-model.trim="name"
          class="input w-full"
          :placeholder="$t('Name of the book')"
          type="text"
        />
        <label class="fieldset-label">
          {{ $t("Authors") }}
        </label>
        <input
          v-model.trim="authors"
          class="input w-full"
          :placeholder="$t('Authors of the book')"
          type="text"
        />
        <label class="fieldset-label">
          {{ $t("Tags") }}
        </label>
        <div class="flex flex-row gap-2 flex-wrap items-center">
          <Tag
            v-for="tag in tags"
            :key="tag"
            :removable="true"
            :text="tag"
            @remove="removeTag(tag)"
          />
          <input
            v-model.trim="editingTag"
            class="input grow"
            :placeholder="tags.length == 0 ? $t('Tags describing the book') : $t('… more tags')"
            type="text"
            @keyup.delete="editLastTag"
            @keyup.enter="addTag"
            @keyup.space="addTag"
          />
        </div>
      </fieldset>
      <EditSection
        :items="newAudiobooks"
        :name="$t('Audiobooks')"
        :type="ItemType.AUDIOBOOK"
      />
      <EditSection
        :items="newEbooks"
        :name="$t('Ebooks')"
        :type="ItemType.EBOOK"
      />
    </main>
  </div>
</template>
<script lang="ts" setup>
import { useLogger } from "@/logging";
import { createAudiobook, createEbook, ItemType, Item } from "@/models";
import { useDatabase } from "@/database";
import { useStorage } from "@/storages";

const { f, debug } = useLogger("edit");

const route = useRoute();
const router = useRouter();

const database = await useDatabase();
const storage = await useStorage();

const book = ref(await database.getBook(route.params.id));

const oldAudiobooks = ref(await database.getItems(book.value.id, ItemType.AUDIOBOOK));
const newAudiobooks = ref([...oldAudiobooks.value]);
const oldEbooks = ref(await database.getItems(book.value.id, ItemType.EBOOK));
const newEbooks = ref([...oldEbooks.value]);

const name = ref(book.value.name);
const authors = ref(book.value.authors.join(","));
const tags = ref([...book.value.tags]);
const editingTag = ref("");

const zeroItems = computed(() => newAudiobooks.value.length == 0 && newEbooks.value.length == 0);

async function cancel() {
  await router.back();
}

async function diffItems(
  newList: Item[],
  oldList: Item[],
): { newItems: Item[]; oldItems: Item[]; delItems: Item[] } {
  const newItems = [];
  const oldItems = [];
  const delItems = [];

  const map = new Map<string, { item: Item; membership: number }>();

  for (const item of newList) map.set(item.id, { item, membership: -1 });

  for (const item of oldList) {
    if (map.has(item.id)) map.set(item.id, { item, membership: 0 });
    else map.set(item.id, { item, membership: 1 });
  }

  for (const { item, membership } of map.values())
    if (membership == -1) newItems.push(item);
    else if (membership == 0) oldItems.push(item);
    else if (membership == 1) delItems.push(item);
    else throw new TypeError(`Unknown membership: ${membership}`);

  return { newItems, oldItems, delItems };
}

async function save() {
  let newList = [...newAudiobooks.value.map(toRaw), ...newEbooks.value.map(toRaw)];
  let oldList = [...oldAudiobooks.value.map(toRaw), ...oldEbooks.value.map(toRaw)];

  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    item.order = i;
    item.parentId = book.value.id;
  }

  const { newItems, oldItems, delItems } = await diffItems(newList, oldList);

  await database.updateItems(book.value.id, newItems, oldItems, delItems);

  book.value.name = name.value || (newItems.length != 0 ? newItems[0].name : oldItems[0].name);
  book.value.authors = authors.value
    .split(",")
    .map((author) => author.trim())
    .filter((author) => author.length != 0);
  book.value.tags = tags.value;
  await database.putBook(toRaw(book.value));

  for (const item of delItems) {
    debug(f`Dropping old item file: ${item.file}`);
    await storage.dropFile(toRaw(item).file);
  }

  await router.back();
}

function addTag() {
  if (editingTag.value.length == 0) return;
  const splits = editingTag.value.split(" ");
  tags.value.push(splits[0]);
  if (splits.length == 2) editingTag.value = splits[1];
  else editingTag.value = "";
}

function removeTag(tag: string) {
  const idx = tags.value.indexOf(tag);
  tags.value.splice(idx, 1);
}

function editLastTag(event) {
  if (editingTag.value.length != 0) return;

  event.preventDefault();
  if (tags.value.length == 0) return;
  editingTag.value = tags.value.splice(tags.value.length - 1, 1)[0];
}
</script>
