<template>
  <li class="list-row @container">
    <template v-if="state == State.Display">
      <button
        class="list-col-grow cursor-pointer text-start"
        @click="$emit('click')"
      >
        {{ mark.name }}
        &nbsp;
        <span class="italic">
          {{ formatPosition(mark.position, type) }}
        </span>
      </button>
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
        :popoverId="`marksDialogRowPo_${mark.id}`"
        styleClass="btn-ghost @lg:hidden"
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
      <input
        v-model="name"
        class="list-col-grow input w-full"
        :placeholder="$t('Name of the mark')"
        @keyup.enter="onSaveClick"
      />
      <button
        class="btn btn-ghost"
        :disabled="name.length == 0"
        @click="onSaveClick"
      >
        <CheckIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost"
        @click="state = State.Display"
      >
        <XIcon class="size-4" />
      </button>
    </template>
    <template v-else-if="state == State.Remove">
      <p class="list-col-grow self-center">{{ $t("Remove {mark}?", { mark: mark.name }) }}</p>
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
        <CheckIcon class="size-4" />
      </button>
    </template>
    <template v-else>{{ throwError() }}</template>
  </li>
</template>
<script setup lang="ts">
import { type Mark, ItemType } from "@/models";
import { formatPosition } from "@/utils";

interface Emits {
  click: [];
  edit: [];
  remove: [];
}

interface Props {
  mark: Mark;
  type: ItemType;
}

const { mark } = defineProps<Props>();
const emit = defineEmits<Emits>();

enum State {
  Display,
  Edit,
  Remove,
}

const state = ref(State.Display);
const expand = ref(false);
const name = ref(mark.name);

function onSaveClick() {
  mark.name = name.value;
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
