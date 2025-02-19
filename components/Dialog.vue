<template>
  <dialog
    ref="dialog"
    class="modal"
  >
    <div
      class="modal-box"
      :class="{ 'w-auto max-w-none': autoWidth }"
    >
      <slot />
    </div>
  </dialog>
</template>
<script setup lang="ts">
interface Props {
  autoWidth?: boolean;
}

defineProps<Props>();

const dialog = useTemplateRef("dialog");

async function hide() {
  dialog.value.close();
}

async function show() {
  dialog.value.showModal();
}

defineExpose({
  hide,
  show,
});
</script>
