<template>
  <div class="tools-view">
    <div class="tools-header">
      <h1>Tools</h1>
      <p class="subtitle">Configure and customize each tool's behavior and settings</p>
    </div>

  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.tools-view {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.tools-header {
  margin-bottom: 32px;
}

.tools-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--font-color-1);
}

.subtitle {
  font-size: 16px;
  color: var(--font-color-2);
}

.plugins-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
