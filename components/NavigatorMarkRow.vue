<template>
  <li>
    <button @click="$emit('click')">
      {{ item.name }}
    </button>
  </li>
</template>
<script setup lang="ts">
import { Mark } from "@/models";

interface Emits {
  click: [];
}

interface Props {
  mark: Mark;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
