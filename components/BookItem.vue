<template>
  <div class="bg-base-200 flex w-full flex-row items-center gap-2 rounded p-2 shadow">
    <button
      class="flex grow cursor-pointer flex-row gap-2"
      @click="$emit('open')"
    >
      <figure>
        <img
          :alt="book.name"
          :src="coverUrl"
          class="h-16 w-16 object-scale-down"
        />
      </figure>
      <div class="flex w-0 grow flex-col gap-2 text-start">
        <h2 class="truncate font-bold">
          {{ book.name }}
        </h2>
        <p class="truncate">
          {{ book.authors.length == 0 ? $t("Unknown") : book.authors.join(", ") }}
        </p>
      </div>
    </button>
    <Dropdown
      buttonClass="btn-ghost"
      dropdownClass="dropdown-end"
      :popoverId="`bookRowPo_${book.id}`"
    >
      <template #button>
        <MoreVerticalIcon class="size-4" />
      </template>
      <template #content>
        <ul class="menu bg-base-200 w-64 rounded-sm shadow-sm">
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
import { type Book } from "@/models";
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

let coverUrl = FALLBACK_COVER;
debug(`Trying to get cover of ${book.id}`);
const cover = await storage.read(`/covers/${book.id}.png`);
if (cover) coverUrl = URL.createObjectURL(cover);
else debug(`Cover not found, using fallback for ${book.id}`);

onUnmounted(() => {
  if (coverUrl != FALLBACK_COVER) URL.revokeObjectURL(coverUrl);
});
</script>
