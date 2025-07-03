<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-2">
      <h3 class="text-lg font-bold">Do you want to open this URI?</h3>
      <p
        class="border-base-content max-h-[50vh] overflow-scroll rounded-sm border-2 border-solid p-2 font-mono"
      >
        {{ uri }}
      </p>
      <p>
        Please check the URI in a website like
        <a
          class="link"
          href="https://virustotal.com"
          target="_blank"
          >virustotal.com</a
        >
        if you are not sure.
      </p>
      <div class="modal-action">
        <a
          class="btn btn-warning"
          :href="uri"
          target="_blank"
        >
          Open
        </a>
        <button
          class="btn"
          @click="dialog!.hide()"
        >
          Close
        </button>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
const dialog = useTemplateRef("dialog");
const uri = ref("");

function open(newUri: string) {
  uri.value = newUri;
  dialog.value!.show();
}

defineExpose({ open });
</script>
