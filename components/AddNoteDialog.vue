<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-2">
      <input
        v-model="name"
        class="input w-full"
        :placeholder="$t('Name of the note')"
      />
      <textarea
        v-model="description"
        class="textarea w-full"
        :placeholder="$t('Description of the note')"
      />
    </div>
    <div class="modal-action">
      <button
        class="btn btn-primary w-32"
        :disabled="name.length == 0"
        @click="onAddClick"
      >
        {{ $t("Add") }}
      </button>
      <button
        class="btn w-32"
        @click="dialog!.hide()"
      >
        {{ $t("Cancel") }}
      </button>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { useDatabase } from "@/database";
import { type Item, createNote } from "@/models";
import { formatPosition } from "@/utils";

const { t } = useI18n();

interface Props {
  item: Item;
}

const { item } = defineProps<Props>();

const database = await useDatabase();

const dialog = useTemplateRef("dialog");
const name = ref("");
const description = ref("");

async function onAddClick() {
  const note = createNote(item.id, name.value, description.value, toRaw(item.position));
  await database.putNote(note);
  dialog.value!.hide();
}

function show() {
  const prettyPosition = formatPosition(item.position, item.type);
  name.value = t("On {position}", { position: prettyPosition });
  description.value = t("{name} says…", { name: item.name });
  dialog.value!.show();
}

defineExpose({ show });
</script>
