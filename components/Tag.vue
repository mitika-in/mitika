<template>
  <button
    class="btn btn-ghost flex flex-row gap-2 items-center badge badge-secondary"
    @click.prevent="emitRemove"
  >
    <span>
      {{ text }}
    </span>
    <XIcon
      v-if="removable"
      class="size-4"
    />
  </button>
</template>
<script lang="ts" setup>
interface Props {
  text: string;
  removable: boolean;
}

interface Emits {
  remove: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

async function emitRemove() {
  if (props.removable) emit("remove");
}
</script>
