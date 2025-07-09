<template>
  <button
    class="btn"
    :class="styleClass"
    :classx="{ 'btn-ghost': ghostBtn, 'w-full md:w-64': responsive }"
    :popovertarget="popoverId"
    :style="`anchor-name:--anchor-${popoverId}`"
  >
    <slot name="button"></slot>
  </button>
  <div
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
  ghostBtn?: boolean;
  styleClass?: string;
  popoverId: string;
  responsive?: boolean;
}

const { ghostBtn = true, responsive = false } = defineProps<Props>();
</script>
