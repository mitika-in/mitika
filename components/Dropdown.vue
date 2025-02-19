<template>
  <div
    class="dropdown"
    :class="{ 'dropdown-end': alignEnd, 'dropdown-top': alignTop }"
  >
    <div
      class="btn"
      :class="{ 'btn-ghost': ghostBtn }"
      role="button"
      tabindex="0"
    >
      <slot name="button"></slot>
    </div>
    <div class="z-10 m-2 dropdown-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  ghostBtn?: boolean;
  alignEnd?: boolean;
  alignTop?: boolean;
}

const { ghostBtn = true, alignEnd = true, alignTop = false } = defineProps<Props>();
</script>
