<template>
  <div class="flex flex-col gap-2 items-center justify-center">
    <template v-if="compact != true">
      <XCircleIcon
        v-if="type == StatusType.ERROR"
        class="size-20"
      />
      <InfoIcon
        v-else
        class="size-20"
      />
    </template>
    <h2 class="font-bold text-xl">
      {{ title }}
    </h2>
    <p>
      {{ description }}
    </p>
    <button
      v-if="action"
      class="btn btn-primary"
      @click="$emit('click')"
    >
      {{ action }}
    </button>
  </div>
</template>
<script lang="ts" setup>
enum StatusType {
  ERROR = "error",
  INFO = "info",
}

interface Props {
  type: StatusType;
  title: string;
  description: string;
  action?: string;
  compact?: boolean;
}

interface Emits {
  click: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>
