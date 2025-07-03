<template>
  <div class="flex grow flex-col justify-center gap-4 lg:flex-row">
    <div class="join">
      <label
        class="join-item input"
        :class="{ 'input-error': failed }"
      >
        <div
          v-show="loading"
          class="loading loading-spinner"
        />
        <input
          v-model="needle"
          :disabled="loading"
          placeholder="Search pages…"
          type="search"
          @keyup.enter="doSearch"
        />
      </label>
      <button
        class="join-item btn"
        @click="onActionClick"
      >
        <SearchIcon
          v-show="!loading"
          class="size-4"
        />
        <XCircleIcon
          v-show="loading"
          class="size-4"
        />
      </button>
    </div>
    <div class="join place-self-center">
      <button
        class="btn btn-ghost join-item"
        :disabled="loading || needle == '' || startIndex <= 0"
        @click="doEagerSearch(-1)"
      >
        <ChevronLeftIcon class="size-4" />
      </button>

      <button
        class="btn btn-ghost join-item"
        :disabled="loading || needle == '' || (startIndex <= 0 && matchIndex == 0)"
        @click="onStepClick(-1)"
      >
        <ChevronUpIcon class="size-4" />
      </button>
      <button
        class="btn"
        disabled="true"
      >
        {{ status }}
      </button>
      <button
        class="btn btn-ghost join-item"
        :disabled="
          loading ||
          needle == '' ||
          (endIndex >= pages.length - 1 && (matchesLength == 0 || matchIndex >= matchesLength - 1))
        "
        @click="onStepClick(1)"
      >
        <ChevronDownIcon class="size-4" />
      </button>
      <button
        class="btn btn-ghost join-item"
        :disabled="loading || needle == '' || endIndex >= pages.length - 1"
        @click="doEagerSearch(1)"
      >
        <ChevronRightIcon class="size-4" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Page } from "@/backends/ebook";
import { useLogger } from "@/logging";
import type { EbookPosition } from "@/models";

const { debug } = useLogger("ebookSearchBar");

interface Props {
  startIndex: number;
  endIndex: number;
  pages: Page[];
}

interface Emits {
  change: [position: EbookPosition];
  search: [];
  step: [index: number];
  query: [index: number, needle: string, doneCb: (matchesFound: boolean) => void];
}

const { startIndex, endIndex, pages } = defineProps<Props>();
const emit = defineEmits<Emits>();

const cancel = ref(false);
const failed = ref(false);
const loading = ref(false);

const needle = ref("");

const matchIndex = ref(0);
const matchesLength = ref(-1);

const status = computed(() => {
  if (matchesLength.value == -1) return "";
  if (matchesLength.value == 0) return "0";
  return `${matchIndex.value + 1} / ${matchesLength.value}`;
});

function onActionClick() {
  if (loading.value) onCancel();
  else doSearch();
}

function onCancel() {
  debug("Requesting search to cancel");
  cancel.value = true;
}

async function doEagerSearch(direction: -1 | 1) {
  cancel.value = false;
  failed.value = false;
  loading.value = true;

  let matchesFound = false;
  let i = (direction == -1 ? startIndex : endIndex) + direction;

  for (i; 0 <= i && i < pages.length; i += direction) {
    const promise = new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        emit("query", i, needle.value, (matchesFound) => {
          resolve(matchesFound);
        });
      });
    });
    matchesFound = await promise;

    if (matchesFound) break;

    if (cancel.value) {
      debug("Not continuing search as cancel requested");
      break;
    }
  }

  if (matchesFound) {
    debug(`Found first match at ${i}`);
    emit("change", { name: "", value: i, x: 0, y: 0 });
  } else {
    debug("Found no more results");
    failed.value = true;
  }

  cancel.value = false;
  loading.value = false;
}

function doSearch() {
  cancel.value = false;
  loading.value = true;

  emit("search");
}

function onStepClick(direction: -1 | 1) {
  if (direction == -1) {
    if (matchIndex.value == 0) {
      doEagerSearch(-1);
      return;
    }
  } else {
    if (matchesLength.value == 0 || matchIndex.value == matchesLength.value - 1) {
      doEagerSearch(1);
      return;
    }
  }

  matchIndex.value += direction;
  emit("step", matchIndex.value);
}

function reset() {
  needle.value = "";
  matchIndex.value = 0;
  matchesLength.value = 0;
}

function getNeedle(): string {
  return needle.value;
}

function setMatchesLength(newMatchesLength: number) {
  cancel.value = true;
  failed.value = false;
  loading.value = false;

  matchIndex.value = 0;
  matchesLength.value = newMatchesLength;

  if (matchesLength.value > 0) emit("step", matchIndex.value);
  else failed.value = matchesLength.value == 0;
}

defineExpose({ setMatchesLength, getNeedle, reset });
</script>
