<template>
  <li>
    <button @click="$emit('click')">
      {{ note.name }}
    </button>
  </li>
</template>
<script setup lang="ts">
import { Note } from "@/models";

interface Props {
  note: Note;
}

interface Emits {
  click: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>
