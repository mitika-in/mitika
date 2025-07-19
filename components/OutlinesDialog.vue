<template>
  <Dialog ref="dialog">
    <div class="flex h-[75vh] flex-col gap-4">
      <div class="flex flex-row gap-4">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Outlines')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <input
        v-model="search"
        class="input w-full"
        :placeholder="$t('Search…')"
      />
      <div class="flex h-0 grow flex-col overflow-scroll">
        <ol class="menu peer w-full">
          <OutlinesDialogRow
            v-for="outline in outlines"
            :key="outline.id"
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
import { type Outline } from "@/backends";
import { StatusType } from "@/components/statusType";

interface Props {
  outlines: Outline[];
}

interface Emits {
  openOutline: [outline: Outline];
}

defineProps<Props>();
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
