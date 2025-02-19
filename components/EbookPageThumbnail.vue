<template>
  <button class="flex flex-col gap-2 p-2 btn btn-ghost h-auto">
    <img
      ref="element"
      class="skeleton rounded-none"
      :style="`height: ${page.height * scale}px; width: ${page.width * scale}px`"
    />
    <span>
      {{ page.position }}
    </span>
  </button>
</template>
<script setup lang="ts">
import { EbookPageView } from "@/backends";

interface Props {
  page: EbookPageView;
  scale: number;
}

defineProps<Props>();

const element = useTemplateRef("element");

function setThumbnail(blob) {
  URL.revokeObjectURL(element.value.src);

  element.value.src = URL.createObjectURL(blob);
}

defineExpose({ element, setThumbnail });
</script>
