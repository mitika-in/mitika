<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-row justify-between items-center">
      <h2>
        {{ name }}
      </h2>
      <button
        class="btn btn-ghost"
        @click="addItem"
      >
        <PlusIcon class="size-4" />
      </button>
    </div>
    <ol
      v-show="items.length != 0"
      ref="list-el"
      class="divide-y divide-neutral"
    >
      <EditSectionRow
        v-for="(item, i) of items"
        :key="item.id"
        :class="{
          'rounded-t-xl': i == 0,
          'rounded-b-xl': i == items.length - 1,
        }"
        :item="item"
        :position="
          items.length == 1
            ? 'single'
            : i == 0
              ? 'top'
              : i == items.length - 1
                ? 'bottom'
                : 'middle'
        "
        @moveDown="move(i, i + 1)"
        @moveUp="move(i, i - 1)"
        @remove="remove(item)"
      />
    </ol>
    <p v-show="items.length == 0">
      <span>
        {{ splits[0] }}
      </span>
      <PlusIcon class="inline size-4" />
      <span>
        {{ splits[1] }}
      </span>
    </p>
  </div>
</template>
<script lang="ts" setup>
import { createAudiobook, createEbook, Item, ItemType } from "@/models";
import { toTitleCase, splitBaseName, itemTypeToString, itemTypeToFileTypes } from "@/utils";
import { useStorage } from "@/storages";

const { t } = useI18n();
const storage = await useStorage();

interface Props {
  name: string;
  items: Item[];
  type: ItemType;
}

const props = defineProps<Props>();

const dialog = inject("dialog");

const empty = t("This section is empty. Use the + to add a new item.");
const splits = ref(empty.split("+"));

async function addItem() {
  const [file] = await storage.chooseFiles(false, [
    {
      name: t(itemTypeToString(props.type)),
      types: itemTypeToFileTypes(props.type),
    },
  ]);
  if (!file) return;

  const name = toTitleCase(splitBaseName(file.name).name);
  let item;
  if (props.type == ItemType.AUDIOBOOK) item = createAudiobook(0, name, file);
  else if (props.type == ItemType.EBOOK) item = createEbook(0, name, file);

  props.items.push(item);
}

function move(srcIdx: number, dstIdx: number) {
  const normDstIdx = Math.min(Math.max(dstIdx, 0), props.items.length - 1);
  const [element] = props.items.splice(srcIdx, 1);
  props.items.splice(normDstIdx, 0, element);
}

async function remove(item: Item) {
  const title = t("Remove {name}?", { name: item.name });
  const message = t(
    "Removing an item clears its bookmarks, notes etc. However the item's file is not deleted.",
  );
  const buttons = [
    { action: "cancel", text: t("Cancel"), type: "normal" },
    { action: "remove", text: t("Remove"), type: "destructive" },
  ];
  await dialog.value.show(title, message, buttons, async (action) => {
    if (action == "remove") {
      const idx = props.items.indexOf(item);
      props.items.splice(idx, 1);
    }
  });
}
</script>
