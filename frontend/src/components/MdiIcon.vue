<script setup lang="ts">
defineProps<{
  path: string;
  size?: number | string;
  color?: string;
}>();
</script>

<template>
  <svg
    class="mdi-icon"
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    :fill="color ?? 'currentColor'"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.mdi-icon {
  display: block;
  flex-shrink: 0;
}
</style>
