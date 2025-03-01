<template>
  <button
    class="btn"
    :class="{ 'btn-ghost': ghostBtn }"
    :popovertarget="`popover-${id}`"
    :style="`anchor-name:--anchor-${id}`"
  >
    <slot name="button"></slot>
  </button>
  <div
    class="dropdown"
    :id="`popover-${id}`"
    popover
    :style="`position-anchor:--anchor-${id}`"
  >
    <slot name="content"></slot>
  </div>
</template>
<script setup lang="ts">
interface Props {
  ghostBtn?: boolean;
}

const { ghostBtn = true } = defineProps<Props>();

const id = Math.ceil(Math.random() * 100).toString();
</script>
