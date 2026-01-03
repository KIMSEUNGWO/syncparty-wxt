<template>
  <button @click="copyToClipboard" class="copy-button" :class="{ copied }" :title="copied ? '복사됨!' : '초대 링크 복사'">
    <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </button>
</template>

<script setup lang="ts">
import {ref} from "vue";

interface Props {
  text: string
}

const props = defineProps<Props>()
const copied = ref(false)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('복사 실패:', err)
  }
}
</script>

<style scoped>
.copy-button {
  background-color: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-button:hover {
  background-color: rgba(100, 108, 255, 0.1);
  border-color: #646cff;
  color: #646cff;
}

.copy-button.copied {
  background-color: rgba(76, 175, 80, 0.1);
  border-color: #4caf50;
  color: #4caf50;
}

.copy-button svg {
  display: block;
}
</style>
