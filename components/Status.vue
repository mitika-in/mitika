<template>
  <div class="flex flex-col items-center justify-center gap-2">
    <template v-if="compact != true">
      <XCircleIcon
        v-if="type == StatusType.Error"
        class="size-20"
      />
      <InfoIcon
        v-else
        class="size-20"
      />
    </template>
    <h2 class="text-xl font-bold">
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
import { StatusType } from "@/components/statusType";

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
