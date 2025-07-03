<template>
  <Dialog
    ref="dialog"
    :autoWidth="true"
  >
    <div class="flex w-[75vw] flex-col gap-4">
      <div class="flex flex-row gap-4">
        <input
          v-model="search"
          class="input grow"
          :placeholder="$t('Search…')"
          @keyup.enter="onEnter"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <div class="flex h-[75vh] grow flex-col overflow-scroll">
        <ol class="list peer">
          <NotesDialogRow
            v-for="note in filteredNotes"
            :key="note.id"
            :note="note"
            :type="item!.type"
            @click="onClick(note)"
            @remove="onRemove(note)"
            @edit="onEdit(note)"
          />
        </ol>
        <Status
          class="m-auto hidden peer-empty:flex"
          :description="$t(emptyStateDescription)"
          :title="$t('No notes found')"
          :type="StatusType.Info"
        />
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { StatusType } from "@/components/statusType";
import { type Database, DatabaseEvent, useDatabase } from "@/database";
import { type Item, type Note } from "@/models";

interface Props {
  item: Item;
}

interface Emits {
  openNote: [note: Note];
}

const { item } = defineProps<Props>();
const emit = defineEmits<Emits>();

let database: Database | null;

const dialog = useTemplateRef("dialog");
const notes: Ref<Note[]> = ref([]);
const search = ref("");

const filteredNotes = computed(() => {
  return notes.value.filter((note) =>
    `${note.name} ${note.description}`.toLowerCase().includes(search.value.toLowerCase()),
  );
});

const emptyStateDescription = computed(() =>
  search.value.length == 0 ? "Add a note to display it here." : "No matching note exists.",
);

function onEnter() {
  if (filteredNotes.value.length == 0) return;
  emit("openNote", filteredNotes.value[0]);
}

function onClick(note: Note) {
  emit("openNote", note);
  dialog.value!.hide();
}

async function onEdit(note: Note) {
  await database!.putNote(toRaw(note));
}

async function onRemove(note: Note) {
  await database!.delNote(toRaw(note));
}

async function onNotesChanged() {
  notes.value = await database!.getNotes(item.id);
}

function show() {
  dialog.value!.show();
}

defineExpose({ show });

database = await useDatabase();
watch(
  () => item,
  async () => {
    await onNotesChanged();
  },
  { immediate: true },
);

onMounted(() => {
  database!.addEventListener(DatabaseEvent.Notes, onNotesChanged);
});

onUnmounted(() => {
  database!.removeEventListener(DatabaseEvent.Notes, onNotesChanged);
});
</script>
