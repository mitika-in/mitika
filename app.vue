<template>
  <div class="flex h-dvh flex-col">
    <NuxtPage class="grow" />
  </div>
</template>
<script setup lang="ts">
import { useLogger } from "@/logging";

const { f, error } = useLogger("app");

useRuntimeHook("app:error", (err) => {
  error(err);
});
</script>
