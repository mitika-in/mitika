<template>
  <template v-if="search.length == 0">
    <li>
      <button
        v-if="outline.children.length == 0"
        @click="$emit('click', outline)"
      >
        <span>
          {{ outline.name }}
          &nbsp;
          <span class="italic">
            {{ queryPositionName!(outline.position) }}
          </span>
        </span>
      </button>
      <details v-else>
        <summary>
          {{ outline.name }}
        </summary>
        <ul>
          <OutlinesDialogRow
            v-for="childOutline of outline.children"
            :outline="childOutline"
            :search="search"
            @click="(outline) => $emit('click', outline)"
          />
        </ul>
      </details>
    </li>
  </template>
  <template v-else>
    <li v-if="matches">
      <button @click="$emit('click', outline)">
        <span>
          {{ outline.name }}
          &nbsp;
          <span class="italic">
            {{ queryPositionName!(outline.position) }}
          </span>
        </span>
      </button>
    </li>
    <OutlinesDialogRow
      v-for="childOutline of outline.children"
      :outline="childOutline"
      :search="search"
      @click="(outline) => $emit('click', outline)"
    />
  </template>
</template>
<script setup lang="ts">
import type { Outline } from "@/backends";
import { QUERY_POSITION_NAME } from "@/components/keys";

const queryPositionName = inject<(position: any) => string>(QUERY_POSITION_NAME);

interface Props {
  outline: Outline;
  search: string;
}

interface Emits {
  click: [outline: Outline];
}

defineEmits<Emits>();
const { outline, search } = defineProps<Props>();

const matches = computed(() => {
  return outline.name.toLowerCase().includes(search.toLowerCase());
});
</script>
