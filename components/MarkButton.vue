<template>
  <label :class="{ 'btn btn-ghost': button }">
    <input
      :class="{ hidden: button }"
      class="checkbox"
      type="checkbox"
      @change="onChange"
    />
    <BookmarkIcon
      v-show="button"
      class="size-4"
      :class="{ 'fill-current': mark != null }"
    />
    <span :class="{ hidden: button }">
      {{ $t("Mark") }}
    </span>
  </label>
</template>
<script setup lang="ts">
import { DatabaseEvent, useDatabase } from "@/database";
import { type Item, type Mark, createMark } from "@/models";
import { formatPosition } from "@/utils";

const { t } = useI18n();

interface Props {
  item: Item;
  button: boolean;
}

const { item } = defineProps<Props>();

const database = await useDatabase();

const mark: Ref<Mark | null> = ref(null);

async function onChange() {
  if (mark.value) {
    await database.delMark(toValue(mark));
    return;
  }

  const prettyPosition = formatPosition(item.position, item.type);
  const newMark = createMark(
    item.id,
    t("On {position}", { position: prettyPosition }),
    toRaw(item.position),
  );
  await database.putMark(newMark);
}

async function onMarksChanged() {
  const marks = await database.getMarks(item.id);
  mark.value = marks.find((mark) => mark.position.value == item.position.value);
}

watch(
  () => item,
  async () => {
    await onMarksChanged();
  },
);

onMounted(() => {
  database.addEventListener(DatabaseEvent.Marks, onMarksChanged);
});

onUnmounted(() => {
  database.removeEventListener(DatabaseEvent.Marks, onMarksChanged);
});
</script>
