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
          'btn-error': button.type == ButtonType.Destructive,
          'btn-primary': button.type == ButtonType.Suggested,
        }"
        @click="respond(button.action)"
      >
        {{ button.text }}
      </button>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { ButtonType } from "@/components/buttonType";

interface Button {
  action: string;
  text: string;
  type: ButtonType;
}

type ActionCallback = (action: string) => Promise<void>;

const dialog = useTemplateRef("dialog");

const dialogButtons: Ref<Button[]> = ref([]);
let dialogCallback: ActionCallback | null;
const dialogMessage = ref("");
const dialogTitle = ref("");

async function hide() {
  dialog.value!.hide();
}

async function show(title: string, message: string, buttons: Button[], callback: ActionCallback) {
  dialogTitle.value = title;
  dialogMessage.value = message;
  dialogButtons.value = buttons;
  dialogCallback = callback;
  dialog.value!.show();
}

defineExpose({
  hide,
  show,
});

async function respond(action: string) {
  await hide();
  await dialogCallback!(action);
}
</script>
