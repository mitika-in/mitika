<template>
  <button class="btn btn-ghost flex h-auto flex-col gap-2 p-2">
    <img
      ref="root"
      class="h-32 w-32 rounded-none object-scale-down"
      :style="`rotate: ${rotate}deg; transform: rotateY(${flip ? 180 : 0}deg)`"
    />
    <span>
      {{ label }}
    </span>
  </button>
</template>
<script setup lang="ts">
interface Props {
  label: string;
  flip: boolean;
  rotate: number;
}

const { flip, rotate } = defineProps<Props>();

const preview: Ref<Blob | null> = ref(null);
const root = useTemplateRef("root");

function hasPreview(): boolean {
  return preview.value != null;
}

function setPreview(newPreview: Blob | null) {
  preview.value = newPreview;

  if (root.value!.src) URL.revokeObjectURL(root.value!.src);

  if (preview.value) root.value!.src = URL.createObjectURL(preview.value);
  else root.value!.src = "";
}

defineExpose({ root, hasPreview, setPreview });
</script>
