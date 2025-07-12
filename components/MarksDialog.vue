<template>
  <Dialog
    ref="dialog"
    styleClass="@2xl:w-2xl max-w-none"
  >
    <div class="flex h-[75vh] flex-col gap-4">
      <div class="flex flex-row gap-4">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Marks')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <input
        v-model="search"
        class="input w-full"
        :placeholder="$t('Search…')"
        @keyup.enter="onEnter"
      />
      <div class="flex h-0 grow flex-col overflow-scroll">
        <ol class="list peer">
          <MarksDialogRow
            v-for="mark in filteredMarks"
            :key="mark.id"
            :mark="mark"
            :type="item.type"
            @click="onClick(mark)"
            @remove="onRemove(mark)"
            @edit="onEdit(mark)"
          />
        </ol>
        <Status
          class="m-auto hidden peer-empty:flex"
          :description="$t(emptyStateDescription)"
          :title="$t('No marks found')"
          :type="StatusType.Info"
        />
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { StatusType } from "@/components/statusType";
import { type Database, DatabaseEvent, useDatabase } from "@/database";
import { type Item, type Mark } from "@/models";

interface Props {
  item: Item;
}

interface Emits {
  openMark: [mark: Mark];
}

const { item } = defineProps<Props>();
const emit = defineEmits<Emits>();

let database: Database | null;

const dialog = useTemplateRef("dialog");
const marks: Ref<Mark[]> = ref([]);
const search = ref("");

const emptyStateDescription = computed(() =>
  search.value.length == 0 ? "Add a mark to display it here." : "No matching mark exists.",
);

const filteredMarks = computed(() => {
  return marks.value.filter((mark) => mark.name.toLowerCase().includes(search.value.toLowerCase()));
});

function onEnter() {
  if (filteredMarks.value.length == 0) return;
  emit("openMark", filteredMarks.value[0]);
}

function onClick(mark: Mark) {
  emit("openMark", mark);
  dialog.value!.hide();
}

async function onEdit(mark: Mark) {
  await database!.putMark(toRaw(mark));
}

async function onRemove(mark: Mark) {
  await database!.delMark(toRaw(mark));
}

async function onMarksChanged() {
  marks.value = await database!.getMarks(item.id);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

database = await useDatabase();

watch(
  () => item,
  async () => {
    await onMarksChanged();
  },
  { immediate: true },
);

onMounted(() => {
  database!.addEventListener(DatabaseEvent.Marks, onMarksChanged);
});

onUnmounted(() => {
  database!.removeEventListener(DatabaseEvent.Marks, onMarksChanged);
});
</script>
