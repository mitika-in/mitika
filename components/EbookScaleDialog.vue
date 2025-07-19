<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Scale')"
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
              v-model="resizePolicyInput"
              class="radio"
              name="resize"
              type="radio"
              :value="EbookResizePolicy.FitWidth"
              @change="$emit('change', -1, EbookResizePolicy.FitWidth)"
            />
            {{ $t("Fit Width") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="resizePolicyInput"
              class="radio"
              name="resize"
              type="radio"
              :value="EbookResizePolicy.FitHeight"
              @change="$emit('change', -1, EbookResizePolicy.FitHeight)"
            />
            {{ $t("Fit Height") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="resizePolicyInput"
              class="radio"
              name="resize"
              type="radio"
              :value="EbookResizePolicy.FitPage"
              @change="$emit('change', -1, EbookResizePolicy.FitPage)"
            />
            {{ $t("Fit Page") }}
          </label>
        </li>
        <li>
          <button @click="$emit('change', 1, EbookResizePolicy.None)">
            {{ $t("Original") }}
          </button>
        </li>
      </ul>
      <div class="join w-full">
        <button
          class="join-item btn"
          :disabled="scale <= Constants.EBOOK_MAX_SCALE"
          @click="emit('change', scale - STEP, EbookResizePolicy.None)"
        >
          <MinusIcon class="size-4" />
        </button>
        <input
          class="join-item input w-[4rem] grow"
          :value="Math.floor(scale * 100)"
          @change="onChange"
        />
        <button
          class="join-item btn"
          :disabled="scale >= Constants.EBOOK_MAX_SCALE"
          @click="emit('change', scale + STEP, EbookResizePolicy.None)"
        >
          <PlusIcon class="size-4" />
        </button>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";
import { EbookResizePolicy } from "@/models";

const STEP = 0.01;

interface Props {
  resizePolicy: EbookResizePolicy;
  scale: number;
}

interface Emits {
  change: [scale: number, resizePolicy: EbookResizePolicy];
}

const { resizePolicy, scale } = defineProps<Props>();
const emit = defineEmits<Emits>();

const resizePolicyInput = ref(resizePolicy);
const dialog = useTemplateRef("dialog");

function onChange(event: Event) {
  let newScale = Number((event.target as HTMLInputElement).value) / 100;
  if (isNaN(newScale)) {
    (event.target as HTMLInputElement).value = Math.floor(scale * 100).toString();
    return;
  }
  newScale = Math.min(Math.max(newScale, Constants.EBOOK_MIN_SCALE), Constants.EBOOK_MAX_SCALE);
  emit("change", newScale, EbookResizePolicy.None);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => resizePolicy,
  () => {
    resizePolicyInput.value = resizePolicy;
  },
);
</script>
