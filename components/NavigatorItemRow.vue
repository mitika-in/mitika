<template>
  <li>
    <button
      class="flex flex-row gap-2"
      @click="$emit('click')"
    >
      <span>
        {{ item.name }}
      </span>
      <span class="italic">
        {{ `(${item.file.name})` }}
      </span>
    </button>
  </li>
</template>
<script setup lang="ts">
import { Item } from "@/models";

interface Props {
  item: Item;
}

interface Emits {
  click: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>
