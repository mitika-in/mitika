<template>
  <fieldset class="fieldset">
    <legend class="fieldset-legend">
      {{ name }}
    </legend>
    <ol class="list rounded-box shadow-sm">
      <EditSectionRow
        v-for="(item, i) of items"
        :key="item.id"
        :item="item"
        :position="i"
        :length="items.length"
        @moveDown="move(i, i + 1)"
        @moveUp="move(i, i - 1)"
        @remove="remove(item)"
      />
      <button
        class="list-row btn btn-ghost flex flex-row gap-2 items-center"
        @click="addItem"
      >
        <PlusIcon class="size-4" />
        {{ $t("Add item") }}
      </button>
    </ol>
  </fieldset>
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
  if (props.type == ItemType.Audiobook) item = createAudiobook(0, name, file);
  else if (props.type == ItemType.Ebook) item = createEbook(0, name, file);

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
