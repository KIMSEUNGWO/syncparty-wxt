<template>
  <div class="sidepanel-container" @keydown.stop @keyup.stop @keypress.stop>
    <!-- Error State -->
    <div v-if="showErrorState" class="error-state">
      <h3>오류 발생</h3>
      <p>{{ errorMessage }}</p>
      <p class="error-hint">팝업에서 방을 생성한 후 다시 시도해주세요.</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Top Action Bar -->
      <div class="action-bar">
        <CopyButton :text="inviteUrl" />
        <button @click="leaveRoom" class="leave-button" title="나가기">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Chat Messages Section -->
      <div class="chat-container" ref="chatContainerRef">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <p>메시지가 없습니다</p>
          <p class="empty-hint">첫 메시지를 보내보세요!</p>
        </div>

        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :isOwn="message.userId === currentUserId"
        />
      </div>

      <!-- Input Section -->
      <div class="input-section">
        <input
          v-model="currentMessage"
          @keyup.enter="sendMessage"
          placeholder="메시지를 입력하세요..."
          class="message-input"
          :disabled="showErrorState"
        />
        <button
          @click="sendMessage"
          class="send-button"
          :disabled="!currentMessage.trim() || showErrorState"
        >
          전송
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChatMessage from '@/components/ChatMessage.vue'
import CopyButton from '@/components/CopyButton.vue'
import type { ChatMessage as ChatMessageType } from '@/components/dto/ChatMessage'
import { getRandomProfileImage } from '@/components/utils/profileImages'
import { storageManager } from '@/core/StorageManager'
import { panelManager } from '@/core/PanelManager'
import { MessageType } from '@/core/MessageType'

const inviteCode = ref<string>('')
const inviteUrl = ref<string>('')
const currentUserId = ref<string>('')
const messages = ref<ChatMessageType[]>([])
const currentMessage = ref<string>('')
const profileImage = ref<string>('')
const chatContainerRef = ref<HTMLElement | null>(null)
const showErrorState = ref<boolean>(false)
const errorMessage = ref<string>('')

onMounted(async () => {
  try {
    // Load session data using storageManager
    const sessionData = await storageManager.getSessionData()

    console.log(sessionData.roomId, sessionData.inviteCode, sessionData.userId)

    if (!sessionData.roomId || !sessionData.inviteCode || !sessionData.userId) {
      showErrorState.value = true
      errorMessage.value = '세션 데이터가 없습니다.'
      return
    }

    inviteCode.value = sessionData.inviteCode
    inviteUrl.value = `http://localhost:8080/join?inviteCode=${sessionData.inviteCode}`
    currentUserId.value = sessionData.userId

    // Load or assign profile image
    let profile = sessionData.profileImage
    if (!profile) {
      profile = getRandomProfileImage()
      await storageManager.setItem('session:profileImage', profile)
    }
    profileImage.value = profile

    // Background script에 채팅 초기화 요청
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.CHAT_INIT,
        roomCode: sessionData.inviteCode,
        userId: sessionData.userId,
        username: '나'
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to initialize chat')
      }

      console.log('[Panel] Chat initialized via background script')
    } catch (err) {
      console.error('[Panel] Failed to initialize chat:', err)
      showErrorState.value = true
      errorMessage.value = '채팅 서버에 연결할 수 없습니다.'
    }

    // Background에서 오는 메시지 수신 리스너
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.CHAT_MESSAGE_RECEIVED) {
        const receivedMessage = message.message as ChatMessageType

        // 프로필 이미지 설정 (본인 메시지인 경우)
        if (receivedMessage.userId === currentUserId.value) {
          receivedMessage.profileImage = profileImage.value
        }

        messages.value.push(receivedMessage)

        // Auto-scroll to bottom
        nextTick(() => scrollToBottom())
      }
    })
  } catch (err) {
    console.error('Error loading session data:', err)
    showErrorState.value = true
    errorMessage.value = '세션 데이터 로드 중 오류가 발생했습니다.'
  }
})

onUnmounted(async () => {
  // Background script에 채팅 종료 알림
  try {
    await browser.runtime.sendMessage({
      type: MessageType.CHAT_LEAVE
    })
  } catch (err) {
    console.error('[Panel] Failed to notify background about leaving:', err)
  }
})

const sendMessage = async () => {
  if (!currentMessage.value.trim()) return

  try {
    // Background script를 통해 메시지 전송
    const response = await browser.runtime.sendMessage({
      type: MessageType.CHAT_SEND_MESSAGE,
      text: currentMessage.value
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to send message')
    }

    currentMessage.value = ''
  } catch (err) {
    console.error('[Panel] Failed to send message:', err)
    errorMessage.value = '메시지 전송에 실패했습니다.'
  }
}

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const leaveRoom = async () => {
  try {
    // Background script에 채팅 종료 알림
    await browser.runtime.sendMessage({
      type: MessageType.CHAT_LEAVE
    })

    // 패널 닫기
    await panelManager.removeModal()

    console.log('[Panel] 패널을 닫고 채팅방을 나갔습니다')
  } catch (err) {
    console.error('[Panel] 패널 닫기 실패:', err)
    errorMessage.value = '패널 닫기에 실패했습니다.'
    showErrorState.value = true
  }
}
</script>

<style scoped>
.sidepanel-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #242424 0%, #1a1a1a 100%);
}

/* Error State */
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.error-state h3 {
  color: #ff4444;
  margin: 0 0 16px 0;
  font-size: 1.5em;
}

.error-state p {
  color: rgba(255, 255, 255, 0.87);
  margin: 8px 0;
}

.error-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9em;
}

/* Top Action Bar */
.action-bar {
  background-color: #1a1a1a;
  padding: 12px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.leave-button {
  background-color: transparent;
  color: rgba(255, 107, 107, 0.8);
  border: 1px solid rgba(255, 107, 107, 0.3);
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

.leave-button:hover {
  background-color: rgba(255, 107, 107, 0.15);
  border-color: rgba(255, 107, 107, 0.6);
  color: rgba(255, 107, 107, 1);
}

.leave-button svg {
  display: block;
}

/* Chat Messages Section */
.chat-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: linear-gradient(180deg, #242424 0%, #1e1e1e 100%);
}

.chat-container::-webkit-scrollbar {
  width: 6px;
}

.chat-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  gap: 8px;
}

.empty-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
  opacity: 0.4;
  filter: grayscale(0.3);
}

.empty-state p {
  margin: 0;
  font-size: 15px;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
}

/* Input Section */
.input-section {
  background: linear-gradient(180deg, #1e1e1e 0%, #1a1a1a 100%);
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.message-input {
  flex: 1;
  background-color: #2a2a2a;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 11px 18px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s;
  line-height: 1.4;
}

.message-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.6);
  background-color: #2d2d2d;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 11px 22px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.3);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
