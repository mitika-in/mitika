<template>
  <div class="flex flex-col justify-between text-center">
    <h1 class="font-bold truncate">
      {{ title }}
    </h1>
    <span class="italic truncate">
      {{ subtitle }}
    </span>
  </div>
</template>
<script setup lang="ts">
interface Props {
  title: string;
  subtitle: string;
}

defineProps<Props>();
</script>
