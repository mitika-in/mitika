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
import { type Item, type Mark, createMark, ObjectType } from "@/models";
import { QUERY_POSITION_NAME } from "@/components/keys";

const { t } = useI18n();

const queryPositionName = inject<(position: any) => string>(QUERY_POSITION_NAME);

interface Props {
  item: Item;
  button: boolean;
}

const { item } = defineProps<Props>();

const database = await useDatabase();

const marks: Ref<Mark[]> = ref([]);

const mark = computed(() => {
  return marks.value.find((mark) => mark.position.value == item.position.value);
});

async function onChange() {
  if (mark.value) {
    await database.delObject(toValue(mark)!);
    return;
  }

  const newMark = createMark(
    item.id,
    toRaw(item.position),
    t("On {position}", { position: queryPositionName!(item.position) }),
  );
  await database.putObject(newMark);
}

async function onMarksChanged() {
  marks.value = (await database.getObjects(item.id, ObjectType.Mark)) as Mark[];
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
