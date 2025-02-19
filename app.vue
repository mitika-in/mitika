<template>
  <div class="flex flex-col">
    <NuxtPage />
    <MessageDialog ref="dialog" />
  </div>
</template>
<script setup lang="ts">
const dialog = useTemplateRef("dialog");
provide("dialog", dialog);
</script>
