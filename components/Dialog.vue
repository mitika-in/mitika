<template>
  <dialog
    ref="dialog"
    class="modal @container"
  >
    <div
      :class="styleClass"
      class="modal-box"
    >
      <slot />
    </div>
  </dialog>
</template>
<script setup lang="ts">
interface Props {
  styleClass?: string;
}

defineProps<Props>();

const dialog = useTemplateRef("dialog");

function isShown(): boolean {
  return dialog.value!.open;
}

function hide() {
  dialog.value!.close();
}

function show() {
  dialog.value!.showModal();
}

function toggle() {
  if (isShown()) hide();
  else show();
}

defineExpose({
  isShown,
  hide,
  show,
  toggle,
});
</script>
