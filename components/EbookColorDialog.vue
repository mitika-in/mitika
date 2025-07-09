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
              :value="entry[1]"
              @change="onChange(entry[1])"
            />
            {{ $t(entry[0]) }}
          </label>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { ColorScheme, type EbookColor } from "@/models";

interface Props {
  color: EbookColor;
}

interface Emits {
  change: [color: EbookColor];
}

const { color } = defineProps<Props>();
const emit = defineEmits<Emits>();

const colorInput = ref(color);
const dialog = useTemplateRef("dialog");

function onChange(color: EbookColor) {
  emit("change", color);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => color,
  () => {
    colorInput.value = color;
  },
);
</script>
