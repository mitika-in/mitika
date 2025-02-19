<template>
  <div
    v-if="audiobook"
    class="flex flex-col gap-4"
  >
    <div class="flex flex-row gap-4 items-center">
      <span>{{ formatTime(audiobook.position, hoursLength) }}</span>
      <input
        class="range"
        :max="audiobook.length"
        min="0"
        step="1"
        type="range"
        :value="audiobook.position"
        @change="onPositionChange"
      />
      <span>
        {{ formatTime(audiobook.length, hoursLength) }}
      </span>
    </div>
    <div class="flex flex-row gap-4 justify-center items-center join">
      <button class="join-item btn btn-ghost">
        <RewindIcon class="size-4" />
      </button>
      <button class="join-item btn btn-ghost">
        <SkipBackIcon class="size-4" />
      </button>
      <label class="join-item swap swap-rotate btn btn-ghost">
        <input
          :checked="playing"
          type="checkbox"
          @change="onStateChange"
        />
        <PauseIcon class="swap-on size-4" />
        <PlayIcon class="swap-off size-4" />
      </label>
      <button class="join-item btn btn-ghost">
        <SkipForwardIcon class="size-4" />
      </button>
      <button class="join-item btn btn-ghost">
        <FastForwardIcon class="size-4" />
      </button>
    </div>
    <div class="flex flex-row gap-4 items-center">
      <button class="btn btn-ghost">
        <BookmarkIcon class="size-4" />
      </button>
      <AudiobookRateButton
        :rate="audiobook.rate"
        @change="onRateChange"
      />
      <TitleBar
        class="grow"
        :subtitle="audiobook.file.name"
        title=""
      />
      <AudiobookVolumeButton
        :volume="audiobook.volume"
        @change="onVolumeChange"
      />
      <button class="btn btn-ghost">
        <MoreVerticalIcon class="size-4" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDatabase } from "@/database";
import { useAudiobookBackend } from "@/backends/index";
import { Outline } from "@/backends/outline";
import { Audiobook } from "@/models";
import { useStorage } from "@/storages";
import { useLogger } from "@/logging";

const { f, debug } = useLogger("audiobook-player");

interface Emits {
  metadata: [name: string, authors: string[], cover: Blob | null];
  outlines: [outlines: Outline[]];
}

const emit = defineEmits<Emits>();

const audiobook = ref(null);
const playing = ref(false);
let hoursLength = ref(2);

let backend = null;
let database = null;
let storage = null;

async function open(item: Audiobook) {
  debug(f`Opening: ${item}`);
  audiobook.value = item;

  const ctor = useAudiobookBackend(item.file.type);
  debug(f`Using backend: ${ctor.name}`);

  const blob = await storage.readFile(item.file);
  backend = new ctor();
  await backend.open(blob, onPositionChanged, onEnd);

  audiobook.value.length = await backend.getLength();
  hoursLength.value = Math.floor(Math.log10(audiobook.value.length / 3600) + 1);

  await backend.setPosition(audiobook.value.position);

  emit("metadata", await backend.getName(), await backend.getAuthors(), await backend.getCover());
  emit("outlines", await backend.getOutlines());
}

async function close() {
  if (!backend) return;

  debug(f`Closing: ${audiobook.value}`);

  playing.value = false;

  await backend.close();
  backend = null;

  await database.putItem(toRaw(audiobook.value));
  audiobook.value = null;
}

defineExpose({ open, close });

database = await useDatabase();
storage = await useStorage();

onUnmounted(async () => {
  await close();
});

async function onPositionChanged(position) {
  audiobook.value.position = position;
}

async function onEnd() {
  debug(`Playback ended`);
  playing.value = false;
  await backend.pause();
  await backend.seek(0);
}

async function onPositionChange(event) {
  debug(`Changing to position: ${event.target.value}`);
  await backend.setPosition(event.target.value);
}

async function onRateChange(rate: number) {
  debug(`Changing to rate: ${rate}`);
  await backend.setRate(rate);
  audiobook.value.rate = rate;
}

async function onStateChange() {
  if (playing.value) {
    debug("Pausing playback");
    await backend.pause();
  } else {
    debug("Resuming playback");
    await backend.play();
  }
  playing.value = !playing.value;
}

async function onVolumeChange(volume: number) {
  debug(`Changing to volume: ${volume}`);
  await backend.setVolume(volume);
  audiobook.value.volume = volume;
}

function formatTime(position: number, hoursLength: number): string {
  let delta = position;
  const hours = Math.floor(delta / 3600);
  delta = delta % 3600;
  const minutes = Math.floor(delta / 60);
  delta = delta % 60;
  const seconds = Math.floor(delta);

  const hoursStr = hours.toString().padStart(hoursLength, 0);
  const minsStr = minutes.toString().padStart(2, "0");
  const secsStr = seconds.toString().padStart(2, "0");

  return `${hoursStr}:${minsStr}:${secsStr}`;
}
</script>
