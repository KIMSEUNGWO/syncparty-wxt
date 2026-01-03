<template>
  <div :class="['chat-message', { 'own-message': isOwn }]">
    <!-- Profile Image (left for others, right for own) -->
    <img
      v-if="!isOwn"
      :src="`/profile/${message.profileImage}`"
      :alt="`${message.userName} profile`"
      class="profile-avatar"
      @error="handleImageError"
    />

    <div class="message-content">
      <div class="message-header">
        <span class="user-name">{{ message.userName }}</span>
        <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-bubble">
        {{ message.message }}
      </div>
    </div>

    <img
      v-if="isOwn"
      :src="`/profile/${message.profileImage}`"
      :alt="`${message.userName} profile`"
      class="profile-avatar"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/components/dto/ChatMessage'

interface Props {
  message: ChatMessage
  isOwn: boolean
}

const props = defineProps<Props>()

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const handleImageError = (event: Event) => {
  // Fallback to default profile image
  const target = event.target as HTMLImageElement
  target.src = '/profile/P1.svg'
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
  object-fit: cover;
  border: 2px solid #1a1a1a;
}

.message-content {
  max-width: 70%;
  min-width: 120px;
}

.message-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.own-message .message-header {
  flex-direction: row-reverse;
}

.user-name {
  font-weight: 600;
}

.timestamp {
  font-size: 0.8rem;
}

.message-bubble {
  background: #1a1a1a;
  padding: 10px 14px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.87);
  word-wrap: break-word;
  line-height: 1.5;
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
