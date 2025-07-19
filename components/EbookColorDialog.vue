<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Color')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <ul class="menu w-full">
        <li v-for="entry of Object.entries(ColorScheme)">
          <label class="label">
            <input
              v-model="colorInput"
              class="radio"
              name="color"
              type="radio"
              :value="[entry[1].background, entry[1].foreground]"
              @change="onChange(entry[1].background, entry[1].foreground)"
            />
            {{ $t(entry[0]) }}
          </label>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { ColorScheme } from "@/data";

interface Props {
  background: string;
  foreground: string;
}

interface Emits {
  change: [background: string, foreground: string];
}

const { background, foreground } = defineProps<Props>();
const emit = defineEmits<Emits>();

const colorInput = ref([background, foreground]);
const dialog = useTemplateRef("dialog");

function onChange(background: string, foreground: string) {
  emit("change", background, foreground);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch([() => background, () => foreground], () => {
  colorInput.value = [background, foreground];
});
</script>
