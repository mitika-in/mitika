<template>
  <li class="list-row">
    <template v-if="!editing">
      <div class="join join-horizontal">
        <button
          class="join-item btn btn-ghost"
          :disabled="position == 0"
          @click="$emit('moveUp')"
        >
          <ChevronUpIcon class="size-4" />
        </button>
        <button
          class="join-item btn btn-ghost"
          :disabled="position == length - 1"
          @click="$emit('moveDown')"
        >
          <ChevronDownIcon class="size-4" />
        </button>
      </div>
      <div class="flex flex-row gap-2 items-center w-128">
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
        class="input w-full list-col-grow"
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

interface Props {
  position: number;
  length: number;
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
