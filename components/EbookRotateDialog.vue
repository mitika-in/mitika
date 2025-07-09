<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Rotate')"
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
          <button @click="onClick(0)">
            {{ $t("Original") }}
          </button>
        </li>
        <li>
          <button @click="onClick(rotate - 90)">
            {{ $t("Rotate left") }}
          </button>
        </li>
        <li>
          <button @click="onClick(rotate + 90)">
            {{ $t("Rotate right") }}
          </button>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
interface Props {
  rotate: number;
}

interface Emits {
  change: [rotate: number];
}

const { rotate } = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialog = useTemplateRef("dialog");

function onClick(rotate: number) {
  const validRotate = rotate % 360;
  emit("change", validRotate);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });
</script>
