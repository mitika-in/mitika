<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-row items-center gap-4">
      <label
        v-show="focus"
        class="join-item swap swap-rotate btn btn-ghost"
      >
        <input
          :checked="playing"
          type="checkbox"
          @change="onPlayingChange"
        />
        <PauseIcon class="swap-on size-4" />
        <PlayIcon class="swap-off size-4" />
      </label>
      <span>{{ formatToTimestamp(audiobook.position.value, hoursLength) }}</span>
      <input
        class="range grow"
        :max="audiobook.length"
        min="0"
        step="1"
        type="range"
        :value="audiobook.position.value"
        @change="onPositionChange"
      />
      <span>{{ formatToTimestamp(audiobook.length, hoursLength) }}</span>
    </div>
    <div
      class="collapse"
      :class="{ 'collapse-open': !focus }"
    >
      <div class="collapse-content flex flex-col gap-4">
        <div class="join flex flex-row items-center justify-center gap-4">
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
              @change="onPlayingChange"
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
        <div class="@container flex flex-row items-center justify-center gap-4">
          <button
            class="btn btn-ghost"
            @click="outlinesDialog!.toggle()"
          >
            <ListIcon class="size-4" />
          </button>
          <MarkButton :item="audiobook" />
          <AudiobookRateButton
            :rate="audiobook.rate"
            @change="onRateChange"
          />
          <AudiobookVolumeButton
            :volume="audiobook.volume"
            @change="onVolumeChange"
          />
          <button
            class="btn btn-ghost hidden @sm:flex"
            @click="addNoteDialog.toggle()"
          >
            <FilePlusIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @md:flex"
            @click="marksDialog.toggle()"
          >
            <TagIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @lg:flex"
            @click="notesDialog.toggle()"
          >
            <LayersIcon class="size-4" />
          </button>
          <Dropdown
            popoverId="audiobookPlayerPo"
            styleClass="btn-ghost @lg:hidden"
          >
            <template #button>
              <MoreVerticalIcon class="size-4" />
            </template>
            <template #content>
              <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
                <li class="@sm:hidden">
                  <button @click="addNoteDialog.toggle()">
                    {{ $t("Add note") }}
                  </button>
                </li>
                <li class="@md:hidden">
                  <button @click="marksDialog.toggle()">
                    {{ $t("Marks") }}
                  </button>
                </li>
                <li class="@lg:hidden">
                  <button @click="notesDialog.toggle()">
                    {{ $t("Notes") }}
                  </button>
                </li>
              </ul>
            </template>
          </Dropdown>
        </div>
        <TitleBar
          :subtitle="audiobook.file.name"
          title=""
        />
      </div>
    </div>
    <AddNoteDialog
      ref="addNoteDialog"
      :item="audiobook"
    />

    <MarksDialog
      ref="marksDialog"
      :item="audiobook"
      @openMark="onOpenMark"
    />
    <NotesDialog
      ref="notesDialog"
      :item="audiobook"
      @openNote="onOpenNote"
    />
    <OutlinesDialog
      ref="outlinesDialog"
      :item="audiobook"
      :outlines="outlines"
      @openOutline="onOpenOutline"
    />
  </div>
</template>
<script setup lang="ts">
import { useAudiobookBackend, type AudiobookBackend } from "@/backends";
import { type Metadata } from "@/backends/metadata";
import { type Outline } from "@/backends/outline";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { type Audiobook, type Mark, type Note, type Position } from "@/models";
import { useSource } from "@/sources";
import { formatToTimestamp } from "@/utils";

const { f, debug } = useLogger("audiobookPlayer");

interface Props {
  audiobook: Audiobook;
  focus: boolean;
}

interface Emits {
  metadata: [metadata: Metadata];
}

const { audiobook } = defineProps<Props>();
const emit = defineEmits<Emits>();

const database = await useDatabase();
const source = await useSource();

const outlines: Ref<Outline[]> = ref([]);
const playing = ref(false);
let backend: AudiobookBackend | null = null;

const hoursLength = computed(() => Math.floor(Math.log10(audiobook.length / 3600) + 1));

const addNoteDialog = useTemplateRef("addNoteDialog");
const marksDialog = useTemplateRef("marksDialog");
const notesDialog = useTemplateRef("notesDialog");
const outlinesDialog = useTemplateRef("outlinesDialog");

async function onOpenMark(mark: Mark) {
  debug(`Opening mark: ${mark.name}`);
  await backend!.setPosition(mark.position);
}

async function onOpenNote(note: Note) {
  debug(`Opening note: ${note.name}`);
  await backend!.setPosition(note.position);
}

async function onOpenOutline(outline: Outline) {
  debug(`Opening outline: ${outline.name}`);
  await backend!.setPosition(outline.position);
}

async function onPositionChanged(position: Position) {
  audiobook!.position = position;
}

async function onEnd() {
  debug(`Playback ended`);
  playing.value = false;
  await backend!.pause();
  await backend!.setPosition({ value: 0 });
}

async function onPositionChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  debug(`Changing to position: ${value}`);
  await backend!.setPosition({ value });
}

async function onRateChange(rate: number) {
  debug(`Changing to rate: ${rate}`);
  await backend!.setRate(rate);
  audiobook.rate = rate;
}

async function onPlayingChange() {
  if (playing.value) {
    debug("Pausing playback");
    await backend!.pause();
  } else {
    debug("Resuming playback");
    await backend!.play();
  }
  playing.value = !playing.value;
}

async function onVolumeChange(volume: number) {
  debug(`Changing to volume: ${volume}`);
  await backend!.setVolume(volume);
  audiobook.volume = volume;
}

function onAddNoteClick() {
  addNoteDialog.value!.show();
}

function onMarksClick() {
  marksDialog.value!.show();
}

function onNotesClick() {
  notesDialog.value!.show();
}

async function open(audiobook: Audiobook) {
  debug(f`Opening: ${audiobook}`);
  const ctor = useAudiobookBackend(audiobook.file.type);
  debug(f`Using backend: ${ctor.name}`);
  if (audiobook.openingFirstTime) {
    audiobook.openingFirstTime = false;
  }
  backend = new ctor(
    {
      passwordCb: console.error,
      positionCb: onPositionChanged,
      endedCb: onEnd,
    },
    {
      position: audiobook.position,
      rate: audiobook.rate,
      volume: audiobook.volume,
    },
  );
  const blob = await source.readFile(audiobook.file);
  await backend!.open(blob, audiobook.file.type);
  audiobook.length = await backend!.getLength();
  outlines.value = await backend!.getOutlines();
  emit("metadata", await backend!.getMetadata());
}

async function close(audiobook: Audiobook) {
  debug(f`Closing: ${audiobook}`);
  playing.value = false;
  await backend!.close();
  backend = null;
  await database.putItem(toRaw(audiobook));
}

watch(
  () => audiobook,
  async (newAudiobook, oldAudiobook) => {
    if (oldAudiobook) {
      await close(oldAudiobook);
    }
    await open(newAudiobook);
  },
  { immediate: true },
);

onUnmounted(async () => {
  await close(audiobook);
});
</script>
