<template>
  <div class="flex flex-col text-center">
    <div class="flex flex-row">
      <h1 class="w-0 grow truncate font-bold">
        {{ title }}
      </h1>
    </div>
    <div class="flex flex-row">
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
