<template>
  <button
    :class="{ 'btn btn-ghost': !listItem }"
    @click="onClick"
  >
    <template v-if="listItem">
      <CheckIcon
        v-show="marked"
        class="size-4"
      />
      {{ $t("Mark") }}
    </template>
    <BookmarkIcon
      v-else
      class="size-4"
      :class="{ 'fill-current': marked }"
    />
  </button>
</template>
<script setup lang="ts">
import { DatabaseEvent, useDatabase } from "@/database";
import { type Item, type Mark, createMark } from "@/models";
import { formatPosition } from "@/utils";

const { t } = useI18n();

interface Props {
  item: Item;
  listItem: boolean;
}

const { item } = defineProps<Props>();

const database = await useDatabase();
const marks: Ref<Mark[]> = ref([]);

const marked = computed(() => {
  return marks.value.some((mark) => mark.position.value == item.position.value);
});

async function delMark() {
  const mark = marks.value.find((mark) => mark.position.value == item.position.value);
  if (!mark) throw new TypeError(`Unable to find mark on position: ${item.position.value}`);

  await database.delMark(mark);
}

async function addMark() {
  const prettyPosition = formatPosition(item.position, item.type);
  const mark = createMark(
    item.id,
    t("On {position}", { position: prettyPosition }),
    toRaw(item.position),
  );
  await database.putMark(mark);
}

async function onClick() {
  if (marked.value) await delMark();
  else await addMark();
}

async function onMarksChanged() {
  marks.value = await database.getMarks(item.id);
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
