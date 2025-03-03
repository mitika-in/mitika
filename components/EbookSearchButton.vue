<template>
  <div>
    <button
      class="btn btn-ghost"
      @click="dialog.show()"
    >
      <SearchIcon class="size-4" />
    </button>
    <Dialog
      ref="dialog"
      :autoWidth="true"
    >
      <div class="flex flex-col gap-4 w-[75vw]">
        <div class="flex flex-row gap-4">
          <input
            v-model="search"
            class="input grow"
            :placeholder="$t('Search…')"
            @keyup.enter="onEnter"
          />
          <button
            class="btn btn-ghost"
            @click="dialog.hide()"
          >
            <XIcon class="size-4" />
          </button>
        </div>
        <div class="grow h-[75vh] overflow-scroll">
          <div
            v-if="results.length != 0"
            class="flex flex-col gap-4"
          ></div>
          <Status
            v-else
            class="h-full"
            :description="statusDescription"
            :title="statusTitle"
            type="info"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { useLogger } from "@/logging";
import { EbookPosition } from "@/models";
import { EbookBackend } from "@/backends";

const { f, debug } = useLogger("ebook-search-button");

const { t } = useI18n();

interface Emits {
  change: [position: EbookPosition];
}

const emit = defineEmits<Emits>();

const dialog = useTemplateRef("dialog");
const search = ref("");
const results = ref([]);

const statusDescription = computed(() =>
  search.value.length == 0 ? t("Search pages for a phrase.") : t("Try a different phrase."),
);
const statusTitle = computed(() =>
  search.value.length == 0 ? t("Search pages") : t("No results found"),
);

function emitChange(position) {
  emit("change", position);
  dialog.value.hide();
}

function onEnter() {
  if (results.value.length == 0) return;
  emitChange(results.value[0]);
}
</script>
