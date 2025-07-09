<template>
  <Dropdown
    popoverId="ebookScaleButtonPo"
    styleClass="btn-ghost"
  >
    <template #button>
      <EyeIcon class="size-4" />
    </template>
    <template #content>
      <div class="bg-base-100 flex w-64 flex-col gap-2 rounded-sm p-2 shadow-sm">
        <ul class="menu w-full">
          <li>
            <button @click="$emit('change', 1)">
              {{ $t("Original") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitHeight')">
              <CheckIcon
                v-show="resizePolicy == EbookResizePolicy.FitHeight"
                class="size-4"
              />
              {{ $t("Fit height") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitWidth')">
              <CheckIcon
                v-show="resizePolicy == EbookResizePolicy.FitWidth"
                class="size-4"
              />
              {{ $t("Fit width") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitPage')">
              <CheckIcon
                v-show="resizePolicy == EbookResizePolicy.FitPage"
                class="size-4"
              />
              {{ $t("Fit page") }}
            </button>
          </li>
        </ul>
        <div class="join w-full">
          <button
            class="join-item btn"
            :disabled="scale <= MIN"
            @click="emitChange(scale - STEP)"
          >
            <MinusIcon class="size-4" />
          </button>
          <input
            class="join-item input w-[4rem] grow"
            :value="prettyScale"
            @change="onChange"
          />
          <button
            class="join-item btn"
            :disabled="scale >= MAX"
            @click="emitChange(scale + STEP)"
          >
            <PlusIcon class="size-4" />
          </button>
        </div>
      </div>
    </template>
  </Dropdown>
</template>
<script setup lang="ts">
import { EbookResizePolicy } from "@/models";

interface Props {
  resizePolicy: EbookResizePolicy;
  scale: number;
}

interface Emits {
  change: [scale: number];
  fitHeight: [];
  fitWidth: [];
  fitPage: [];
}

const { scale } = defineProps<Props>();
const emit = defineEmits<Emits>();

const prettyScale = computed(() => Math.floor(scale * 100));

const MIN = 0.01;
const MAX = 4;
const STEP = 0.01;

function emitChange(scale: number) {
  const validScale = Math.min(Math.max(scale, MIN), MAX);
  emit("change", validScale);
}

function onChange(event: Event) {
  const scale = Number((event.target as HTMLInputElement).value);
  if (isNaN(scale)) {
    (event.target as HTMLInputElement).value = prettyScale.value.toString();
    return;
  }
  emitChange(scale / 100);
}
</script>
