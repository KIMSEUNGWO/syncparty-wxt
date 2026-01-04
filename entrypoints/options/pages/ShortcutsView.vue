<template>
  <div class="shortcuts-view">
    <div class="shortcuts-header">
      <h1>Shortcuts</h1>
      <p class="subtitle">Customize keyboard shortcuts for each plugin</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.shortcuts-view {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.shortcuts-header {
  margin-bottom: 32px;
}

.shortcuts-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--font-color-1, #1a1a1a);
}

.subtitle {
  font-size: 16px;
  color: var(--font-color-2, #666);
  margin: 0;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.plugin-shortcut-section {
  background: var(--card-bg-color, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plugin-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plugin-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.plugin-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--font-color-1, #1a1a1a);
}

.plugin-version {
  font-size: 12px;
  color: var(--font-color-2, #666);
  background: var(--border-color, #e5e7eb);
  padding: 2px 8px;
  border-radius: 4px;
}

.shortcuts-grid {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
