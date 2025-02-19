<template>
  <dialog
    class="modal"
    ref="dialog"
  >
    <div class="modal-box">
      <div class="flex flex-row gap-2 items-center">
        <input
          class="input input-bordered grow"
          placeholder="Go to page number"
        />
        <div class="modal-action m-0">
          <form method="dialog">
            <button class="btn btn-ghost">
              <XIcon class="size-4" />
            </button>
          </form>
        </div>
      </div>
      <div>Results</div>
    </div>
  </dialog>
</template>
<script setup lang="ts">
const dialog = useTemplateRef("dialog");

function show() {
  dialog.value.showModal();
}

function hide() {
  dialog.value.close();
}

defineExpose({
  show,
  hide,
});
</script>
