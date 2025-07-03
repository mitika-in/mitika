<template>
  <div class="flex h-dvh flex-col items-center justify-center gap-8 p-4">
    <header class="flex flex-row items-center gap-4">
      <TitleBar
        class="grow"
        :subtitle="$t('An unexpected error occured')"
        :title="title"
      />
    </header>
    <main class="flex max-w-lg flex-col gap-4">
      <p>
        Something went wrong. You can try restarting the application and if the issue persists,
        please check the logs and report it to the developers.
      </p>
      <div class="flex flex-col items-center gap-4">
        <NuxtLink
          class="btn btn-primary w-full lg:w-64"
          to="/"
          >Restart</NuxtLink
        >
        <NuxtLink
          class="btn btn-secondary w-full lg:w-64"
          to="/console/logs"
          >Logs</NuxtLink
        >
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import type { NuxtError } from "#app";

interface Props {
  error: NuxtError;
}

const { error } = defineProps<Props>();

const title = computed(() =>
  error ? (error.statusMessage ?? error.statusCode.toString()) : "Unknown error",
);
</script>
