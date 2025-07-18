<template>
  <li class="list-row @container">
    <template v-if="state == State.Display">
      <button
        class="list-col-grow cursor-pointer text-start"
        @click="$emit('click')"
      >
        {{ note.name }}
        &nbsp;
        {{ queryPositionName!(note.position) }}
      </button>
      <textarea
        v-model="note.description"
        class="textarea list-col-wrap col-start-1 col-end-4 max-h-[25vh] w-full"
        readonly="true"
      />
      <button
        class="btn btn-ghost hidden @lg:flex"
        @click="state = State.Edit"
      >
        <EditIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost hidden @lg:flex"
        @click="state = State.Remove"
      >
        <TrashIcon class="size-4" />
      </button>
      <Dropdown
        buttonClass="btn-ghost @lg:hidden"
        dropdownClass="dropdown-end"
        :popoverId="`notesDialogRowPo_${note.id}`"
      >
        <template #button>
          <MoreVerticalIcon class="size-4" />
        </template>
        <template #content>
          <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
            <li>
              <button @click="state = State.Edit">Edit</button>
            </li>
            <li>
              <button @click="state = State.Remove">Remove</button>
            </li>
          </ul>
        </template>
      </Dropdown>
    </template>
    <template v-else-if="state == State.Edit">
      <div class="list-col-grow flex flex-col gap-2">
        <input
          v-model="name"
          class="input w-full"
          :placeholder="$t('Name of the note')"
        />
        <textarea
          v-model="description"
          class="textarea max-h-[25vh] w-full"
          :placeholder="$t('Description of the note')"
        />
        <div class="flex flex-col justify-end gap-2 @lg:flex-row">
          <button
            class="btn btn-primary @lg:w-32"
            :disabled="name.length == 0"
            @click="onSaveClick"
          >
            {{ $t("Save") }}
          </button>
          <button
            class="btn @lg:w-32"
            @click="state = State.Display"
          >
            {{ $t("Cancel") }}
          </button>
        </div>
      </div>
    </template>
    <template v-else-if="state == State.Remove">
      <p class="list-col-grow self-center">{{ $t("Remove {note}?", { note: note.name }) }}</p>
      <button
        class="btn btn-ghost"
        @click="state = State.Display"
      >
        <XIcon class="size-4" />
      </button>
      <button
        class="btn btn-error"
        @click="onRemoveClick"
      >
        <TrashIcon class="size-4" />
      </button>
    </template>
    <template v-else>{{ throwError() }}</template>
  </li>
</template>
<script setup lang="ts">
import { type Note } from "@/models";
import { QUERY_POSITION_NAME } from "@/components/keys";

const queryPositionName = inject<(position: any) => string>(QUERY_POSITION_NAME);

interface Props {
  note: Note;
}

interface Emits {
  click: [];
  edit: [];
  remove: [];
}

const { note } = defineProps<Props>();
const emit = defineEmits<Emits>();

enum State {
  Display,
  Edit,
  Remove,
}

const state = ref(State.Display);
const name = ref(note.name);
const description = ref(note.description);

function onSaveClick() {
  note.name = name.value;
  note.description = description.value;
  state.value = State.Display;
  emit("edit");
}

function onRemoveClick() {
  state.value = State.Display;
  emit("remove");
}

function throwError() {
  throw new Error(`Unknown state: ${state}`);
}
</script>
