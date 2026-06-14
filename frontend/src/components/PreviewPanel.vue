<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { mdiDownload, mdiClose, mdiFileOutline, mdiMusicNote } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { nodeApi } from '@/services/nodeApi';
import { previewKind } from '@/utils/previewKind';
import { getNodeIcon } from '@/utils/nodeIcon';
import { formatSize } from '@/utils/formatSize';

const store = useExplorerStore();

const node = computed(() => store.preview.node);
const kind = computed(() => (node.value ? previewKind(node.value) : 'none'));
const url = computed(() => (node.value ? nodeApi.contentUrl(node.value.id) : ''));
const downloadUrl = computed(() =>
  node.value ? nodeApi.contentUrl(node.value.id, 'attachment') : '',
);

const textContent = ref('');
const textLoading = ref(false);

watch(
  () => node.value?.id,
  async (id) => {
    if (kind.value === 'text' && id) {
      textLoading.value = true;
      try {
        textContent.value = await nodeApi.getContentText(id);
      } catch {
        textContent.value = '(unable to load text)';
      } finally {
        textLoading.value = false;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <aside v-if="node" class="preview-panel" aria-label="Preview">
    <header class="preview-panel__header">
      <MdiIcon
        class="preview-panel__file-icon"
        :path="getNodeIcon(node.type, node.extension)"
        :size="20"
      />
      <div class="preview-panel__meta">
        <p class="preview-panel__name" :title="node.name">{{ node.name }}</p>
        <p v-if="node.size !== null" class="preview-panel__size">
          {{ formatSize(node.size) }}
        </p>
      </div>

      <div class="preview-panel__actions">
        <a
          class="preview-panel__btn"
          :href="downloadUrl"
          :download="node.name"
          aria-label="Download"
          title="Download"
        >
          <MdiIcon :path="mdiDownload" :size="18" />
        </a>
        <button
          type="button"
          class="preview-panel__btn"
          aria-label="Close preview"
          title="Close preview"
          @click="store.closePreview()"
        >
          <MdiIcon :path="mdiClose" :size="18" />
        </button>
      </div>
    </header>

    <div class="preview-panel__body">
      <div v-if="kind === 'image'" class="preview-panel__center">
        <img class="preview-panel__image" :src="url" :alt="node.name" />
      </div>

      <iframe
        v-else-if="kind === 'pdf'"
        class="preview-panel__iframe"
        :src="url"
        title="PDF preview"
      />

      <div v-else-if="kind === 'video'" class="preview-panel__center">
        <video class="preview-panel__video" :src="url" controls />
      </div>

      <div v-else-if="kind === 'audio'" class="preview-panel__center preview-panel__audio">
        <div class="preview-panel__audio-icon">
          <MdiIcon :path="mdiMusicNote" :size="64" color="var(--color-text-tertiary)" />
        </div>
        <p class="preview-panel__audio-name" :title="node.name">{{ node.name }}</p>
        <audio class="preview-panel__audio-player" :src="url" controls />
      </div>

      <template v-else-if="kind === 'text'">
        <div v-if="textLoading" class="preview-panel__center preview-panel__loading">
          <span class="preview-panel__spinner" aria-hidden="true" />
          <span>Loading…</span>
        </div>
        <pre v-else class="preview-panel__text">{{ textContent }}</pre>
      </template>

      <div v-else class="preview-panel__center preview-panel__none">
        <MdiIcon
          class="preview-panel__none-icon"
          :path="mdiFileOutline"
          :size="56"
          color="var(--color-text-tertiary)"
        />
        <p class="preview-panel__none-title">No preview available</p>
        <p class="preview-panel__none-name" :title="node.name">{{ node.name }}</p>
        <a
          class="preview-panel__download-link"
          :href="downloadUrl"
          :download="node.name"
        >
          <MdiIcon :path="mdiDownload" :size="16" />
          <span>Download</span>
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-left: 2px solid var(--color-border-strong);
  background-color: var(--color-bg-app);
}

.preview-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-strong);
  background-color: var(--color-bg-app);
  flex-shrink: 0;
}

.preview-panel__file-icon {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.preview-panel__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-panel__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-panel__size {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.preview-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.preview-panel__btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: color var(--transition), background-color var(--transition);
}

.preview-panel__btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.preview-panel__btn:active {
  background-color: var(--color-bg-active);
}

.preview-panel__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background-color: var(--color-bg-app);
}

.preview-panel__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100%;
  padding: var(--space-4);
}

.preview-panel__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.preview-panel__iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.preview-panel__video {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.preview-panel__audio {
  gap: var(--space-4);
}

.preview-panel__audio-icon {
  opacity: 0.85;
}

.preview-panel__audio-name {
  max-width: 90%;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-panel__audio-player {
  width: min(100%, 28rem);
}

.preview-panel__text {
  margin: 0;
  padding: var(--space-4);
  min-height: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  tab-size: 2;
}

.preview-panel__loading {
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.preview-panel__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}

.preview-panel__none {
  gap: var(--space-2);
  text-align: center;
  animation: fadeIn var(--transition-slow) var(--ease-out) both;
}

.preview-panel__none-icon {
  margin-bottom: var(--space-2);
  opacity: 0.85;
}

.preview-panel__none-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
}

.preview-panel__none-name {
  max-width: 36ch;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-panel__download-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-accent-contrast);
  background-color: var(--color-accent);
  transition: background-color var(--transition), transform var(--transition);
}

.preview-panel__download-link:hover {
  background-color: var(--color-accent-hover);
}

.preview-panel__download-link:active {
  background-color: var(--color-accent-active);
  transform: scale(0.98);
}
</style>
