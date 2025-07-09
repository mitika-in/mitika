<template>
  <div class="flex flex-col justify-center text-center">
    <div
      v-if="title.length != 0"
      class="flex flex-row"
    >
      <h1 class="w-0 grow truncate font-bold">
        {{ title }}
      </h1>
    </div>
    <div
      v-if="subtitle.length != 0"
      class="flex flex-row"
    >
      <span class="w-0 grow truncate italic">
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  title: string;
  subtitle: string;
}

defineProps<Props>();
</script>
