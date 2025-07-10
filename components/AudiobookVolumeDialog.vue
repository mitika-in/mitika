<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Volume')"
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
              v-model="volumeInput"
              class="radio"
              name="volume"
              type="radio"
              :value="0"
              @change="$emit('change', 0)"
            />
            {{ $t("Mute") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="volumeInput"
              class="radio"
              name="volume"
              type="radio"
              :value="0.25"
              @change="$emit('change', 0.25)"
            />
            {{ $t("25%") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="volumeInput"
              class="radio"
              name="volume"
              type="radio"
              :value="0.5"
              @change="$emit('change', 0.5)"
            />
            {{ $t("50%") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="volumeInput"
              class="radio"
              name="volume"
              type="radio"
              :value="0.75"
              @change="$emit('change', 0.75)"
            />
            {{ $t("75%") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="volumeInput"
              class="radio"
              name="volume"
              type="radio"
              :value="1"
              @change="$emit('change', 1)"
            />
            {{ $t("100%") }}
          </label>
        </li>
      </ul>
      <div class="join w-full">
        <button
          class="join-item btn"
          :disabled="volume <= Constants.AUDIOBOOK_MIN_VOLUME"
          @click="$emit('change', volume - STEP)"
        >
          <MinusIcon class="size-4" />
        </button>
        <input
          class="join-item input w-[4rem] grow"
          :value="Math.floor(volume * 100)"
          @change="onChange"
        />
        <button
          class="join-item btn"
          :disabled="volume >= Constants.AUDIOBOOK_MAX_VOLUME"
          @click="$emit('change', volume + STEP)"
        >
          <PlusIcon class="size-4" />
        </button>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";

interface Props {
  volume: number;
}

interface Emits {
  change: [volume: number];
}

const { volume } = defineProps<Props>();
const emit = defineEmits<Emits>();

const volumeInput = ref(volume);
const dialog = useTemplateRef("dialog");

function onChange(event: Event) {
  let newVolume = Number((event.target as HTMLInputElement).value) / 100;
  if (isNaN(newVolume)) {
    (event.target as HTMLInputElement).value = Math.floot(volume * 100);
    return;
  }
  newVolume = Math.min(
    Math.max(newVolume, Constants.AUDIOBOOK_MIN_VOLUME),
    Constants.AUDIOBOOK_MAX_VOLUME,
  );
  emit("change", newVolume);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => volume,
  () => {
    volumeInput.value = volume;
  },
);
</script>
