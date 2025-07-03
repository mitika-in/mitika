<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-4">
        <input
          v-model="search"
          class="input grow"
          :placeholder="$t('Search…')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <div class="flex h-[75vh] grow flex-col overflow-scroll">
        <ol class="menu peer w-full">
          <OutlinesDialogRow
            v-for="outline in outlines"
            :key="outline.id"
            :type="item.type"
            :outline="outline"
            :search="search"
            @click="onClick"
          />
        </ol>
        <Status
          class="m-auto hidden peer-empty:flex"
          :description="$t(emptyStateDescription)"
          :title="$t('No outlines found')"
          :type="StatusType.Info"
        />
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { type Outline } from "@/backends/outline";
import { StatusType } from "@/components/statusType";
import { type Item } from "@/models";

interface Props {
  item: Item;
  outlines: Outline[];
}

interface Emits {
  openOutline: [outline: Outline];
}

const { item, outlines } = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialog = useTemplateRef("dialog");
const search = ref("");

const emptyStateDescription = computed(() =>
  search.value.length == 0 ? "Item has no outlines." : "No matching outline exists.",
);

function onClick(outline: Outline) {
  emit("openOutline", outline);
  dialog.value!.hide();
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });
</script>
