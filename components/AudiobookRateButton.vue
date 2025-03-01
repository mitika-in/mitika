<template>
  <Dropdown :ghostBtn="false">
    <template #button>
      {{ `${prettyRate}x` }}
    </template>
    <template #content>
      <div class="flex flex-col gap-2 p-2 bg-base-100 rounded-box w-64 shadow-sm">
        <ul class="menu w-full">
          <li>
            <button @click="emitChange(0.25)">
              {{ $t("0.25x") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(0.5)">
              {{ $t("0.5x") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(1)">
              {{ $t("Original") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(1.5)">
              {{ $t("1.5x") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(2)">
              {{ $t("2x") }}
            </button>
          </li>
        </ul>
        <div class="join w-full">
          <button
            class="join-item btn"
            :disabled="rate <= MIN"
            @click="emitChange(rate - STEP)"
          >
            <MinusIcon class="size-4" />
          </button>
          <input
            class="join-item input grow w-[4rem]"
            :value="prettyRate"
            @change="onChange"
          />
          <button
            class="join-item btn"
            :disabled="rate >= MAX"
            @click="emitChange(rate + STEP)"
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
  rate: number;
}

interface Emits {
  change: [rate: number];
}

const { rate } = defineProps<Props>();

const emit = defineEmits<Emits>();

const prettyRate = computed(() => rate.toFixed(2));

const MIN = 0.1;
const STEP = 0.25;
const MAX = 4;

function emitChange(rate) {
  const validRate = Math.min(Math.max(rate, MIN), MAX);
  emit("change", validRate);
}

function onChange(event) {
  const rate = Number(event.target.value);
  if (isNaN(rate)) {
    event.target.value = prettyRate.value;
    return;
  }
  emitChange(rate);
}
</script>
