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
            {{ position }}
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
            :type="type"
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
        <span class="flex flex-row gap-2"
          ><span>
            {{ outline.name }}
          </span>
          <span class="italic">
            {{ position }}
          </span>
        </span>
      </button>
    </li>
    <OutlinesDialogRow
      v-for="childOutline of outline.children"
      :type="type"
      :outline="childOutline"
      :search="search"
      @click="(outline) => $emit('click', outline)"
    />
  </template>
</template>
<script setup lang="ts">
import { type Outline } from "@/backends/outline";
import { ItemType } from "@/models";
import { formatPosition } from "@/utils";

interface Props {
  type: ItemType;
  outline: Outline;
  search: string;
}

interface Emits {
  click: [outline: Outline];
}

defineEmits<Emits>();
const { outline, search, type } = defineProps<Props>();

const matches = computed(() => {
  return outline.name.toLowerCase().includes(search.toLowerCase());
});

const position = computed(() => formatPosition(outline.position, type));
</script>
