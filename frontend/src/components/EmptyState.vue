<script setup lang="ts">
import MdiIcon from './MdiIcon.vue';

defineProps<{
  icon: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <MdiIcon :path="icon" :size="56" color="var(--color-text-tertiary)" />
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  min-height: 240px;
  padding: var(--space-6);
  gap: var(--space-2);
  animation: fadeIn var(--transition-slow) var(--ease-out) both;
}

.empty-state__icon {
  margin-bottom: var(--space-2);
  opacity: 0.85;
}

.empty-state__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
}

.empty-state__description {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  max-width: 36ch;
  line-height: var(--leading-normal);
}
</style>
