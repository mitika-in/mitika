<template>
  <li>
    <button
      v-if="outline.children.length == 0"
      @click="$emit('click', outline)"
    >
      <span class="flex flex-row gap-2"
        ><span>
          {{ outline.name }}
        </span>
        <span class="italic">
          {{ outline.destination.position }}
        </span>
      </span>
    </button>
    <details v-else>
      <summary>
        <span class="flex flex-row gap-2"
          ><span>
            {{ outline.name }}
          </span>
          <span class="italic">
            {{ outline.destination.position }}
          </span>
        </span>
      </summary>
      <ul>
        <OutlineRow
          v-for="outline of outline.children"
          :outline="outline"
          @click="(outline) => $emit('click', outline)"
        />
      </ul>
    </details>
  </li>
</template>
<script setup lang="ts">
import { Outline } from "@/backends/outline";

interface Props {
  outline: Outline;
}

interface Emits {
  click: [outline: Outline];
}

defineProps<Props>();
defineEmits<Emits>();
</script>
