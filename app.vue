<template>
  <div class="flex h-dvh flex-col">
    <NuxtPage class="grow" />
  </div>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";
import { useLogger } from "@/logging";

const { f, error } = useLogger("app");

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | ${Constants.NAME}` : Constants.NAME;
  },
});

useRuntimeHook("app:error", (err) => {
  error(err);
});
</script>
