<template>
  <Dropdown
    popoverId="audiobookVolumeButtonPo"
    styleClass="btn-ghost"
  >
    <template #button>
      <VolumeXIcon
        v-if="volume == 0"
        class="size-4"
      />
      <Volume1Icon
        v-else-if="volume <= 0.5"
        class="size-4"
      />
      <Volume2Icon
        v-else
        class="size-4"
      />
    </template>
    <template #content>
      <div class="bg-base-200 flex w-64 flex-col gap-2 rounded-sm p-2 shadow-sm">
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
            class="join-item input w-[4rem] grow"
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

function emitChange(volume: number) {
  const validVolume = Math.min(Math.max(volume, MIN), MAX);
  emit("change", validVolume);
}

function onChange(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const volume = Math.floor(Number(inputEl.value));
  if (isNaN(volume)) {
    inputEl.value = prettyVolume.value.toString();
    return;
  }
  emitChange(volume / 100);
}
</script>
