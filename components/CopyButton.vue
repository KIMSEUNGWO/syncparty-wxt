<template>
  <button @click="copyToClipboard" class="copy-button" :disabled="copied">
    {{ copied ? '복사됨!' : '복사하기' }}
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
  background-color: #1a1a1a;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #646cff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  font-size: 14px;
  font-weight: 500;
}

.copy-button:hover:not(:disabled) {
  background-color: #646cff;
  color: white;
  border-color: #535bf2;
}

.copy-button:disabled {
  opacity: 0.6;
  cursor: default;
  background-color: #2a2a2a;
}
</style>
