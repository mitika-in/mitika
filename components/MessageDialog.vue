<template>
  <Dialog ref="dialog">
    <h3 class="text-lg font-bold">
      {{ dialogTitle }}
    </h3>
    <p>
      {{ dialogMessage }}
    </p>
    <div class="modal-action">
      <button
        v-for="button of dialogButtons"
        :key="button.action"
        class="btn"
        :class="{
          'btn-error': button.type == ButtonType.DESTRUCTIVE,
          'btn-primary': button.type == ButtonType.SUGGESTED,
        }"
        @click="respond(button.action)"
      >
        {{ button.text }}
      </button>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
enum ButtonType {
  DESTRUCTIVE = "destructive",
  NORMAL = "normal",
  SUGGESTED = "suggested",
}

interface Button {
  action: string;
  text: string;
  type: ButtonType;
}

const dialog = useTemplateRef("dialog");

const dialogButtons = ref([]);
const dialogCallback = ref("");
const dialogMessage = ref("");
const dialogTitle = ref("");

async function hide() {
  dialog.value.hide();
}

async function show(
  title: string,
  message: string,
  buttons: Button[],
  callback: (action: string) => Promise<void>,
) {
  dialogTitle.value = title;
  dialogMessage.value = message;
  dialogButtons.value = buttons;
  dialogCallback.value = callback;
  dialog.value.show();
}

defineExpose({
  hide,
  show,
});

async function respond(action: string) {
  await hide();
  await dialogCallback.value(action);
}
</script>
