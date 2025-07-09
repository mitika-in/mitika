<template>
  <li class="list-row items-center">
    <template v-if="!editing">
      <MusicIcon
        v-if="item.type == ItemType.Audiobook"
        class="size-4"
      />
      <FileTextIcon
        v-else-if="item.type == ItemType.Ebook"
        class="size-4"
      />
      <template v-else>{{ throwError(item.type) }}</template>
      <div class="list-col-grow flex flex-col gap-2 truncate">
        <p>
          {{ item.name }}
        </p>
        <p class="italic">
          {{ item.file.name }}
        </p>
      </div>
      <Dropdown
        :popoverId="item.id"
        styleClass="btn-ghost"
      >
        <template #button>
          <MoreVerticalIcon class="size-4" />
        </template>
        <template #content>
          <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
            <li v-show="position != 0">
              <button @click="$emit('move', position, position - 1)">Move up</button>
            </li>
            <li v-show="position != length - 1">
              <button @click="$emit('move', position, position + 1)">Move down</button>
            </li>
            <li>
              <button @click="editing = true">Edit</button>
            </li>
            <li>
              <button @click="$emit('remove')">Remove</button>
            </li>
          </ul>
        </template>
      </Dropdown>
    </template>
    <template v-else>
      <input
        v-model.trim="name"
        class="input list-col-grow w-full"
        @keyup.enter="save"
        @keyup.esc="cancel"
      />
      <button
        class="btn btn-ghost"
        :disabled="name.length == 0"
        @click="save()"
      >
        <CheckIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost"
        @click="cancel()"
      >
        <XIcon class="size-4" />
      </button>
    </template>
  </li>
</template>
<script lang="ts" setup>
import { type Item, ItemType } from "@/models";

interface Props {
  position: number;
  length: number;
  item: Item;
}

interface Emits {
  move: [src: number, dst: number];
  remove: [];
}

const props = defineProps<Props>();
defineEmits<Emits>();

const editing = ref(false);
const name = ref(props.item.name);

function throwError(type: ItemType) {
  throw new Error(`Unknown type: ${type}`);
}

function cancel() {
  name.value = props.item.name;
  editing.value = false;
}

function save() {
  props.item.name = name.value;
  editing.value = false;
}
</script>
