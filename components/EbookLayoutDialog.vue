<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Layout')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <ul class="menu w-full">
        <li>
          <label class="label">
            <input
              v-model="layoutInput"
              class="radio"
              name="layout"
              type="radio"
              :value="EbookLayout.Single"
              @change="$emit('change', EbookLayout.Single)"
            />
            {{ $t("Single") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="layoutInput"
              class="radio"
              name="layout"
              type="radio"
              :value="EbookLayout.DualStart"
              @change="$emit('change', EbookLayout.DualStart)"
            />
            {{ $t("Dual start") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="layoutInput"
              class="radio"
              name="layout"
              type="radio"
              :value="EbookLayout.DualEnd"
              @change="$emit('change', EbookLayout.DualEnd)"
            />
            {{ $t("Dual end") }}
          </label>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { EbookLayout } from "@/models";

interface Props {
  layout: EbookLayout;
}

interface Emits {
  change: [layout: EbookLayout];
}

const { layout } = defineProps<Props>();
const emit = defineEmits<Emits>();

const layoutInput = ref(layout);
const dialog = useTemplateRef("dialog");

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => layout,
  () => {
    layoutInput.value = layout;
  },
);
</script>
