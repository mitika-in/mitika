<template>
  <button class="flex flex-col gap-2 p-2 btn btn-ghost h-auto">
    <img
      ref="element"
      :class="{ skeletion: loading }"
      class="rounded-none object-scale-down w-32 h-32"
    />
    <span>
      {{ name }}
    </span>
  </button>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";

interface Props {
  name: string;
}

defineProps<Props>();

const loading = ref(true);
const element = useTemplateRef("element");

function setThumbnail(blob) {
  if (element.value.src) URL.revokeObjectURL(element.value.src);

  element.value.src = URL.createObjectURL(blob);
  loading.value = false;
}

defineExpose({ element, setThumbnail });
</script>
