<template>
  <div :class="['chat-message', { 'own-message': isOwn }]">
    <!-- Profile Avatar (left for others, right for own) -->
    <div v-if="!isOwn" class="profile-avatar">
      <img :src="profileImageUrl" :alt="message.userName" />
    </div>

    <div class="message-content">
      <div class="message-header">
        <span class="user-name">{{ message.userName }}</span>
        <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-bubble">
        {{ message.message }}
      </div>
    </div>

    <div v-if="isOwn" class="profile-avatar">
      <img :src="profileImageUrl" :alt="message.userName" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/components/dto/ChatMessage'
import {getProfileImageUrl} from "@/components/utils/profileImages";

interface Props {
  message: ChatMessage
  isOwn: boolean
}

const props = defineProps<Props>()

// 프로필 이미지 URL 생성 (WXT 확장 프로그램용)
const profileImageUrl = computed(() => {
  // profileImage가 있으면 사용, 없으면 기본 이미지
  const imageName = props.message.profileImage || 'P1.png'

  // browser.runtime.getURL()로 확장 프로그램 리소스 경로 생성
  return browser.runtime.getURL(`/profile/${imageName}`)
})

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.own-message {
  flex-direction: row-reverse;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: #2a2a2a;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  min-width: 120px;
}

.message-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.own-message .message-header {
  flex-direction: row-reverse;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
}

.timestamp {
  font-size: 12px;
}

.message-bubble {
  background: #1a1a1a;
  padding: 10px 14px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.87);
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 15px;
}

.own-message .message-bubble {
  background: #646cff;
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message:not(.own-message) .message-bubble {
  border-bottom-left-radius: 4px;
}
</style>
