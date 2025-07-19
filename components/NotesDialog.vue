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
          :title="$t('Notes')"
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
      />
      <div class="flex h-0 grow flex-col overflow-scroll">
        <ol class="list peer">
          <NotesDialogRow
            v-for="note in filteredNotes"
            :key="note.id"
            :note="note"
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
import { type Item, type Note, ObjectType } from "@/models";

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

function onClick(note: Note) {
  emit("openNote", note);
  dialog.value!.hide();
}

async function onEdit(note: Note) {
  await database!.putObject(toRaw(note));
}

async function onRemove(note: Note) {
  await database!.delObject(toRaw(note));
}

async function onNotesChanged() {
  notes.value = (await database!.getObjects(item.id, ObjectType.Note)) as Note[];
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

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
