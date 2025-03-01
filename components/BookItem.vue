<template>
  <div class="flex flex-row gap-2 p-2 shadow rounded bg-base-200 items-center w-full">
    <button
      class="cursor-pointer flex flex-row gap-2 grow"
      @click="$emit('open')"
    >
      <figure>
        <img
          :alt="book.name"
          :src="cover_url"
          class="object-scale-down h-16 w-16"
        />
      </figure>
      <div class="flex flex-col gap-2 grow text-start w-12">
        <h2 class="truncate font-bold">
          {{ book.name }}
        </h2>
        <p class="truncate">
          {{ book.authors.length == 0 ? $t("Unknown") : book.authors.join(", ") }}
        </p>
      </div>
    </button>
    <Dropdown>
      <template #button>
        <MoreVerticalIcon class="size-4" />
      </template>
      <template #content>
        <ul class="w-64 menu bg-base-200 rounded-box shadow-sm">
          <li>
            <button @click="$emit('open')">
              {{ $t("Open") }}
            </button>
          </li>
          <li>
            <button @click="$emit('edit')">
              {{ $t("Edit") }}
            </button>
          </li>
          <li>
            <button @click="$emit('remove')">
              {{ $t("Remove") }}
            </button>
          </li>
        </ul>
      </template>
    </Dropdown>
  </div>
</template>
<script lang="ts" setup>
import { useLogger } from "@/logging";

import { Book } from "@/models";
import { useStorage } from "@/storages";

const { debug } = useLogger("bookItem");

interface Props {
  book: Book;
}

interface Emits {
  open: [];
  edit: [];
  remove: [];
}

const { book } = defineProps<Props>();
defineEmits<Emits>();

const FALLBACK_COVER = "fallback.webp";
const storage = await useStorage();

let cover_url = FALLBACK_COVER;
debug(`Trying to get cover of ${book.id}`);
const cover = await storage.readCache(`${book.id}_cover.png`);
if (cover) cover_url = URL.createObjectURL(cover);
else debug(`Cover not found, using fallback for ${book.id}`);

onUnmounted(() => {
  if (cover_url != FALLBACK_COVER) URL.revokeObjectURL(cover_url);
});
</script>
