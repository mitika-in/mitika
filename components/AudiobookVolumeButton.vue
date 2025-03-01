<template>
  <Dropdown :ghostBtn="false">
    <template #button>
      {{ `${prettyVolume}%` }}
    </template>
    <template #content>
      <div class="flex flex-col gap-2 bg-base-200 rounded-box w-64 p-2 shadow-sm">
        <ul class="menu w-full">
          <li>
            <button @click="emitChange(0)">
              {{ $t("Mute") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(0.25)">
              {{ $t("25%") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(0.5)">
              {{ $t("50%") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(0.75)">
              {{ $t("75%") }}
            </button>
          </li>
          <li>
            <button @click="emitChange(1)">
              {{ $t("100%") }}
            </button>
          </li>
        </ul>
        <div class="join w-full">
          <button
            class="join-item btn"
            :disabled="volume <= MIN"
            @click="emitChange(volume - STEP)"
          >
            <MinusIcon class="size-4" />
          </button>
          <input
            class="join-item input grow w-[4rem]"
            :value="prettyVolume"
            @change="onChange"
          />
          <button
            class="join-item btn"
            :disabled="volume >= MAX"
            @click="emitChange(volume + STEP)"
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
  volume: number;
}

interface Emits {
  change: [volume: number];
}

const { volume } = defineProps<Props>();

const emit = defineEmits<Emits>();

const MIN = 0;
const STEP = 0.01;
const MAX = 1;

const prettyVolume = computed(() => Math.floor(volume * 100));

function emitChange(volume) {
  const validVolume = Math.min(Math.max(volume, MIN), MAX);
  emit("change", validVolume);
}

function onChange(event) {
  const volume = Math.floor(Number(event.target.value));
  if (isNaN(volume)) {
    event.target.value = prettyVolume.value;
    return;
  }
  emitChange(volume / 100);
}
</script>
