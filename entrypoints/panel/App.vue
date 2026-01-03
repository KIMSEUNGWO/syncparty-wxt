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
      <!-- Top Section: Invite Code -->
      <div class="invite-section">
        <div class="invite-header">
          <div class="invite-code-label">초대 코드</div>
          <div class="invite-code">{{ inviteCode }}</div>
        </div>
        <div class="invite-actions">
          <CopyButton :text="inviteUrl" />
          <button @click="leaveRoom" class="leave-button">
            나가기
          </button>
        </div>
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
import { generateUUID } from '@/components/utils/uuid'
import { getRandomProfileImage } from '@/components/utils/profileImages'
import { storageManager } from '@/core/StorageManager'
import { panelManager } from '@/core/PanelManager'

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
    // inviteUrl.value = `https://syncparty.com/join?code=${sessionData.inviteCode}`
    inviteUrl.value = `http://localhost:8080/join?inviteCode=${sessionData.inviteCode}`
    currentUserId.value = sessionData.userId

    // Load or assign profile image
    let profile = sessionData.profileImage
    if (!profile) {
      profile = getRandomProfileImage()
      await storageManager.setItem('session:profileImage', profile)
    }
    profileImage.value = profile

    // Load existing messages
    if (sessionData.chatMessages) {
      try {
        messages.value = JSON.parse(sessionData.chatMessages)
        // Auto-scroll to bottom after loading messages
        await nextTick()
        scrollToBottom()
      } catch (err) {
        console.error('Failed to parse saved messages:', err)
        messages.value = []
      }
    }
  } catch (err) {
    console.error('Error loading session data:', err)
    showErrorState.value = true
    errorMessage.value = '세션 데이터 로드 중 오류가 발생했습니다.'
  }
})

const sendMessage = async () => {
  if (!currentMessage.value.trim()) return

  const newMessage: ChatMessageType = {
    id: generateUUID(),
    userId: currentUserId.value,
    userName: '나',
    profileImage: profileImage.value,
    message: currentMessage.value,
    timestamp: Date.now()
  }

  messages.value.push(newMessage)
  currentMessage.value = ''

  // Save to storage
  try {
    await storageManager.setItem('session:chatMessages', JSON.stringify(messages.value))
  } catch (err) {
    console.error('Failed to save messages:', err)
  }

  // Auto-scroll to bottom
  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const leaveRoom = async () => {
  try {
    // 세션 데이터 삭제
    await storageManager.clearSessionData()

    // 패널 닫기
    await panelManager.removeModal()

    console.log('방을 나갔습니다')
  } catch (err) {
    console.error('방 나가기 실패:', err)
    errorMessage.value = '방 나가기에 실패했습니다.'
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
  background-color: #242424;
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

/* Top Section: Invite Code */
.invite-section {
  background-color: #1a1a1a;
  padding: 16px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.invite-header {
  flex: 1;
  min-width: 0;
}

.invite-code-label {
  font-size: 0.75em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.invite-code {
  font-size: 1.2em;
  font-weight: 700;
  color: #646cff;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.invite-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.leave-button {
  background-color: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  font-size: 0.85em;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 500;
  white-space: nowrap;
}

.leave-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.87);
}

/* Chat Messages Section */
.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.4);
}

/* Input Section */
.input-section {
  background-color: #1a1a1a;
  padding: 16px;
  border-top: 1px solid #333;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.message-input {
  flex: 1;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.95em;
  font-family: inherit;
  transition: border-color 0.25s;
}

.message-input:focus {
  outline: none;
  border-color: #646cff;
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  background-color: #646cff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.25s;
}

.send-button:hover:not(:disabled) {
  background-color: #535bf2;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #646cff;
}
</style>
