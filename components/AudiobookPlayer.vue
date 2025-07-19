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
            class="btn btn-ghost hidden @3xs:flex"
            @click="outlinesDialog!.toggle()"
          >
            <ListIcon class="size-4" />
          </button>
          <MarkButton
            class="hidden @3xs:flex"
            :button="true"
            :item="audiobook"
          />
          <button
            class="btn btn-ghost hidden @2xs:flex"
            @click="volumeDialog!.toggle()"
          >
            <VolumeXIcon
              v-if="audiobook.volume == 0"
              class="size-4"
            />
            <Volume1Icon
              v-else-if="audiobook.volume <= 0.5"
              class="size-4"
            />
            <Volume2Icon
              v-else
              class="size-4"
            />
          </button>
          <button
            class="btn btn-ghost hidden @xs:flex"
            @click="rateDialog!.toggle()"
          >
            <WatchIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @sm:flex"
            @click="addNoteDialog!.toggle()"
          >
            <FilePlusIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @md:flex"
            @click="marksDialog!.toggle()"
          >
            <TagIcon class="size-4" />
          </button>
          <button
            class="btn btn-ghost hidden @md:flex"
            @click="notesDialog!.toggle()"
          >
            <LayersIcon class="size-4" />
          </button>
          <Dropdown
            buttonClass="btn-ghost @md:hidden"
            dropdownClass="dropdown-end"
            popoverId="audiobookPlayerPo"
          >
            <template #button>
              <MoreVerticalIcon class="size-4" />
            </template>
            <template #content>
              <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
                <li class="@3xs:hidden">
                  <button @click="outlinesDialog!.toggle()">
                    {{ $t("Outlines") }}
                  </button>
                </li>
                <li class="@3xs:hidden">
                  <MarkButton
                    :button="false"
                    :item="audiobook"
                  />
                </li>
                <li class="@2xs:hidden">
                  <button @click="volumeDialog!.toggle()">
                    {{ $t("Volume") }}
                  </button>
                </li>
                <li class="@xs:hidden">
                  <button @click="rateDialog!.toggle()">
                    {{ $t("Rate") }}
                  </button>
                </li>
                <li class="@sm:hidden">
                  <button @click="addNoteDialog!.toggle()">
                    {{ $t("Add note") }}
                  </button>
                </li>
                <li class="@md:hidden">
                  <button @click="marksDialog!.toggle()">
                    {{ $t("Marks") }}
                  </button>
                </li>
                <li class="@md:hidden">
                  <button @click="notesDialog!.toggle()">
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
    <AudiobookRateDialog
      ref="rateDialog"
      :rate="audiobook.rate"
      @change="onRateChange"
    />
    <AudiobookVolumeDialog
      ref="volumeDialog"
      :volume="audiobook.volume"
      @change="onVolumeChange"
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
import {
  useAudiobookBackend,
  type AudiobookBackend,
  type Metadata,
  type AudiobookOutline,
} from "@/backends";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { type Audiobook, type Mark, type Note, type AudiobookPosition } from "@/models";
import { useSource } from "@/sources";
import { formatToTimestamp } from "@/utils";
import { QUERY_POSITION_NAME } from "@/components/keys";

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

const outlines: Ref<AudiobookOutline[]> = ref([]);
const playing = ref(false);
let backend: AudiobookBackend | null = null;

const hoursLength = computed(() => Math.floor(Math.log10(audiobook.length / 3600) + 1));

const addNoteDialog = useTemplateRef("addNoteDialog");
const marksDialog = useTemplateRef("marksDialog");
const notesDialog = useTemplateRef("notesDialog");
const outlinesDialog = useTemplateRef("outlinesDialog");
const rateDialog = useTemplateRef("rateDialog");
const volumeDialog = useTemplateRef("volumeDialog");

async function onOpenMark(mark: Mark) {
  debug(`Opening mark: ${mark.name}`);
  await backend!.setPosition(mark.position.value);
}

async function onOpenNote(note: Note) {
  debug(`Opening note: ${note.name}`);
  await backend!.setPosition(note.position.value);
}

async function onOpenOutline(outline: AudiobookOutline) {
  debug(`Opening outline: ${outline.name}`);
  await backend!.setPosition(outline.position);
}

async function onPositionChanged(value: number) {
  audiobook!.position.value = value;
}

async function onEnd() {
  debug("Playback ended");
  playing.value = false;
  await backend!.pause();
  await backend!.setPosition(0);
}

async function onPositionChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  debug(`Changing to position: ${value}`);
  await backend!.setPosition(value);
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

async function open(audiobook: Audiobook) {
  debug(f`Opening: ${audiobook}`);

  backend = useAudiobookBackend(audiobook.file.type);
  debug(f`Using backend: ${backend.constructor.name}`);

  if (audiobook.openingFirstTime) {
    audiobook.openingFirstTime = false;
  }

  const blob = await source.readFile(audiobook.file);
  await backend!.open(blob, audiobook.file.type, {
    passwordCb: console.error,
    positionCb: onPositionChanged,
    endedCb: onEnd,
  });

  audiobook.length = await backend!.getLength();
  backend!.setPosition(audiobook.position.value);
  backend!.setRate(audiobook.rate);
  backend!.setVolume(audiobook.volume);

  window.setTimeout(async () => (outlines.value = await backend!.getOutlines()));
  window.setTimeout(async () => emit("metadata", await backend!.getMetadata()));
}

async function close(audiobook: Audiobook) {
  debug(f`Closing: ${audiobook}`);
  playing.value = false;
  await backend!.close();
  backend = null;
  await database.putItem(toRaw(audiobook));
}

function queryPositionName(position: AudiobookPosition): string {
  return formatToTimestamp(position.value, hoursLength.value);
}

provide(QUERY_POSITION_NAME, queryPositionName);

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
