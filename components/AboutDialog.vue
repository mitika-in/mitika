<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-2">
      <div class="flex w-full flex-row justify-end gap-4">
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <InfoIcon class="size-16 self-center" />
      <TitleBar
        :title="Constants.NAME"
        :subtitle="Constants.VERSION"
      />
      <p class="text-center">{{ $t(Constants.AUTHORS) }}</p>
      <a
        class="link text-center"
        :href="Constants.WEBSITE"
        >{{ Constants.WEBSITE }}</a
      >
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";

const dialog = useTemplateRef("dialog");

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });
</script>
