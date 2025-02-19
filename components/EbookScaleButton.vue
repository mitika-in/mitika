<template>
  <Dropdown :ghostBtn="false">
    <template #button>
      {{ `${prettyScale}%` }}
    </template>
    <template #content>
      <div class="flex flex-col gap-2 bg-base-200 rounded-box w-64 p-2 shadow">
        <ul class="menu">
          <li>
            <button @click="$emit('change', 1)">
              {{ $t("Original") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitHeight')">
              {{ $t("Fit height") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitWidth')">
              {{ $t("Fit width") }}
            </button>
          </li>
          <li>
            <button @click="$emit('fitPage')">
              {{ $t("Fit page") }}
            </button>
          </li>
        </ul>
        <div class="join w-full">
          <button
            class="join-item btn btn-outline border-neutral"
            :disabled="scale <= MIN"
            @click="emitChange(scale - STEP)"
          >
            <MinusIcon class="size-4" />
          </button>
          <input
            class="join-item input input-bordered border-neutral grow w-[4rem]"
            :value="prettyScale"
            @change="onChange"
          />
          <button
            class="join-item btn btn-outline border-neutral"
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
interface Props {
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

function emitChange(scale) {
  const validScale = Math.min(Math.max(scale, MIN), MAX);
  emit("change", validScale);
}

function onChange(event) {
  const scale = Number(event.target.value);
  if (isNaN(scale)) {
    event.target.value = prettyScale.value;
    return;
  }
  emitChange(scale / 100);
}
</script>
