<template>
  <li class="list-row items-center">
    <MusicIcon
      v-if="item.type == ItemType.Audiobook"
      class="size-4"
    />
    <BookIcon
      v-else-if="item.type == ItemType.Ebook"
      class="size-4"
    />
    <template v-else>{{ throwError(item.type) }}</template>
    <button
      class="list-col-grow cursor-pointer text-start"
      @click="$emit('click')"
    >
      {{ item.name }}
    </button>
    <p class="list-col-wrap opacity-75">
      {{ item.file.name }}
    </p>
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
