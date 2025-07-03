<template>
  <li class="list-row items-center">
    <MusicIcon
      v-if="item.type == ItemType.Audiobook"
      class="size-4"
    />
    <FileTextIcon
      v-else-if="item.type == ItemType.Ebook"
      class="size-4"
    />
    <template v-else>{{ throwError(item.type) }}</template>
    <div class="list-col-grow flex flex-row gap-2">
      <p>
        {{ item.name }}
      </p>
      <p class="opacity-75">
        {{ item.file.name }}
      </p>
    </div>
    <button
      class="btn btn-ghost"
      @click="$emit('click')"
    >
      <BookOpenIcon class="size-4" />
    </button>
  </li>
</template>
<script setup lang="ts">
import { type Item, ItemType } from "@/models";

interface Emits {
  click: [];
}

interface Props {
  item: Item;
}

defineProps<Props>();
defineEmits<Emits>();

function throwError(type: ItemType) {
  throw new Error(`Unknown type: ${type}`);
}
</script>
