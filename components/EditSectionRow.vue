<template>
  <li class="flex flex-row gap-2 p-2 bg-base-200 shadow items-center">
    <template v-if="!editing">
      <div class="join join-horizontal">
        <button
          class="join-item btn btn-ghost"
          :disabled="position == Position.SINGLE || position == Position.TOP"
          @click="$emit('moveUp')"
        >
          <ChevronUpIcon class="size-4" />
        </button>
        <button
          class="join-item btn btn-ghost"
          :disabled="position == Position.SINGLE || position == Position.BOTTOM"
          @click="$emit('moveDown')"
        >
          <ChevronDownIcon class="size-4" />
        </button>
      </div>
      <div class="w-0 grow flex flex-row gap-2">
        <span class="truncate">
          {{ item.name }}
        </span>
        <span class="truncate italic">
          {{ `(${item.file.name})` }}
        </span>
      </div>
      <button
        class="btn btn-ghost"
        @click="editing = true"
      >
        <EditIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost"
        @click="$emit('remove')"
      >
        <XIcon class="size-4" />
      </button>
    </template>
    <template v-else>
      <input
        v-model.trim="name"
        class="input input-bordered grow"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
      />
      <button
        class="btn btn-ghost"
        @click="cancelEdit"
      >
        <XIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost"
        :disabled="name.length == 0"
        @click="saveEdit"
      >
        <CheckIcon class="size-4" />
      </button>
    </template>
  </li>
</template>
<script lang="ts" setup>
import { Item } from "@/models";

enum Position {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
  SINGLE = "single",
}

interface Props {
  position: Position;
  item: Item;
}

interface Emits {
  moveUp: [];
  moveDown: [];
  remove: [];
}

const props = defineProps<Props>();
defineEmits<Emits>();

const editing = ref(false);
const name = ref(props.item.name);

async function cancelEdit() {
  name.value = props.item.name;
  editing.value = false;
}

async function saveEdit() {
  props.item.name = name.value;
  editing.value = false;
}
</script>
