<template>
  <div class="@container flex flex-col gap-8 p-4">
    <header class="flex flex-row items-center gap-4">
      <button
        class="btn btn-ghost"
        @click="onBackClick"
      >
        <BackIcon />
      </button>
      <TitleBar
        class="grow"
        subtitle=""
        :title="book.name"
      />
      <button
        class="btn btn-primary"
        :disabled="items.length == 0"
        @click="onSaveClick"
      >
        {{ $t("Save") }}
      </button>
    </header>
    <main class="flex h-0 grow flex-col gap-4 overflow-scroll @2xl:w-2xl @2xl:self-center">
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
        <div class="flex flex-row flex-wrap items-center gap-2">
          <Tag
            v-for="tag in tags"
            :key="tag"
            :removable="true"
            :text="tag"
            @remove="onTagRemove(tag)"
          />
          <input
            v-model.trim="editingTag"
            class="input grow"
            :placeholder="tags.length == 0 ? $t('Tags describing the book') : $t('… more tags')"
            type="text"
            @keyup.delete="onTagDelete"
            @keyup.enter="addTag()"
            @keyup.space="addTag()"
          />
        </div>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("Items") }}
        </legend>
        <ol class="list rounded-sm shadow-sm">
          <EditItemRow
            v-for="(item, i) of items"
            :key="item.id"
            :item="item"
            :position="i"
            :length="items.length"
            @move="(src, dst) => onItemMove(item, src, dst)"
            @remove="onItemRemove(item)"
          />
        </ol>
        <button
          class="btn"
          @click="onAddClick"
        >
          <PlusIcon class="size-4" />
          {{ $t("Add item") }}
        </button>
      </fieldset>
    </main>
    <MessageDialog ref="messageDialog" />
  </div>
</template>
<script lang="ts" setup>
import { ButtonType } from "@/components/buttonType";
import { Constants } from "@/constants";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { createAudiobook, createEbook, ItemType, type Item } from "@/models";
import { useSource } from "@/sources";
import { toTitleCase, splitBaseName } from "@/utils";

const { f, debug } = useLogger("edit");
const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const database = await useDatabase();
const source = await useSource();

const dialog = useTemplateRef("messageDialog")!;

const book = ref(await database.getBook(route.params.id as string));

const originalItems = ref(await database.getItems(book.value.id));
const items = ref([...originalItems.value]);

const name = ref(book.value.name);
const authors = ref(book.value.authors.join(","));
const tags = ref([...book.value.tags]);
const editingTag = ref("");

function onBackClick() {
  router.back();
}

function diffItems(
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
    else throw new Error(`Unknown membership: ${membership}`);

  return { newItems, oldItems, delItems };
}

async function onSaveClick() {
  let newList = [...items.value.map(toRaw)];
  let oldList = [...originalItems.value.map(toRaw)];
  let hasAudiobook = false;
  let hasEbook = false;

  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    item.order = i;
    hasAudiobook = hasAudiobook || item.type == ItemType.Audiobook;
    hasEbook = hasEbook || item.type == ItemType.Ebook;
  }

  const { newItems, oldItems, delItems } = diffItems(newList, oldList);

  await database.updateItems(book.value.id, newItems, oldItems, delItems);

  book.value.name = name.value || newItems[0].name;
  book.value.authors = authors.value
    .split(",")
    .map((author) => author.trim())
    .filter((author) => author.length != 0);
  book.value.tags = tags.value;
  if (hasAudiobook && !hasEbook) book.value.openAudiobook = true;
  if (hasEbook && !hasAudiobook) book.value.openEbook = true;

  await database.putBook(toRaw(book.value));

  for (const item of delItems) {
    debug(f`Dropping old item file: ${item.file}`);
    await source.dropFile(toRaw(item).file);
  }

  router.back();
}

function addTag() {
  if (editingTag.value.length == 0) return;
  const splits = editingTag.value.split(" ");
  tags.value.push(splits[0]);
  if (splits.length == 2) editingTag.value = splits[1];
  else editingTag.value = "";
}

function onTagDelete(event: Event) {
  if (editingTag.value.length != 0) return;

  event.preventDefault();
  if (tags.value.length == 0) return;
  editingTag.value = tags.value.splice(tags.value.length - 1, 1)[0];
}

function onTagRemove(tag: string) {
  const idx = tags.value.indexOf(tag);
  tags.value.splice(idx, 1);
}

function onItemMove(item: Item, src: number, dst: number) {
  const normDst = Math.min(Math.max(dst, 0), items.value.length - 1);
  const [element] = items.value.splice(src, 1);
  items.value.splice(normDst, 0, element);
}

async function onItemRemove(item: Item) {
  const title = t("Remove {name}?", { name: item.name });
  const message = t(
    "Removing an item clears its bookmarks, notes etc. However the item's file is not deleted.",
  );
  const buttons = [
    { action: "cancel", text: t("Cancel"), type: ButtonType.Normal },
    { action: "remove", text: t("Remove"), type: ButtonType.Destructive },
  ];
  await dialog.value!.show(title, message, buttons, async (action: string) => {
    if (action == "remove") {
      const idx = items.value.indexOf(item);
      items.value.splice(idx, 1);
    }
  });
}

async function onAddClick() {
  const [file] = await source.chooseFiles(false, [
    {
      name: t("Item"),
      types: [...Constants.AUDIOBOOK_TYPES, ...Constants.EBOOK_TYPES],
    },
  ]);
  if (!file) return;

  const name = toTitleCase(splitBaseName(file.name).name);
  let item;
  if (Constants.AUDIOBOOK_TYPES.includes(file.type))
    item = createAudiobook(book.value.id, name, file);
  else if (Constants.EBOOK_TYPES.includes(file.type)) item = createEbook(book.value.id, name, file);
  else throw new Error(`Unknown type: ${file.type}`);

  items.value.push(item);
}

useHead({ title: t("Editing {name}", { name: book.value.name }) });
</script>
