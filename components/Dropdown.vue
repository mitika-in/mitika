<template>
  <button
    :class="buttonClass"
    class="btn"
    :popovertarget="popoverId"
    :style="`anchor-name:--anchor-${popoverId}`"
  >
    <slot name="button"></slot>
  </button>
  <div
    :class="dropdownClass"
    class="dropdown"
    :id="popoverId"
    popover
    :style="`position-anchor:--anchor-${popoverId}`"
  >
    <slot name="content"></slot>
  </div>
</template>
<script setup lang="ts">
interface Props {
  buttonClass: string;
  dropdownClass: string;
  popoverId: string;
}

const { dropdownClass } = defineProps<Props>();
</script>
