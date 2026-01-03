<template>
  <div class="popup-container">
    <div class="header">
      <h1>SyncParty</h1>
      <p class="subtitle">함께 보는 즐거움</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="close-error">×</button>
    </div>

    <!-- Before room creation -->
    <div v-if="!roomData" class="initial-state">
      <button @click="createRoom" :disabled="loading" class="create-room-button">
        {{ loading ? '방 만드는 중...' : '방 만들기' }}
      </button>
    </div>

    <!-- After room creation -->
    <div v-else class="room-created-state">
      <div class="invite-section">
        <div class="invite-label">초대 코드</div>
        <div class="invite-code">{{ roomData.inviteCode }}</div>

        <div class="invite-label">초대 링크</div>
        <div class="invite-url">{{ inviteUrl }}</div>

        <CopyButton :text="inviteUrl" />
      </div>

      <div class="button-group">
        <button @click="openPanel" class="enter-button">
          입장하기
        </button>
        <button @click="leaveRoom" class="leave-button">
          나가기
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CopyButton from '@/components/CopyButton.vue'
import { roomController } from '@/components/RoomController'
import type { RoomResponse } from '@/components/dto/RoomResponse'
import { generateUUID } from '@/components/utils/uuid'
import { ref } from "vue"
import { MessageType } from "@/core/MessageType"
import { storageManager } from '@/core/StorageManager'

const roomData = ref<RoomResponse | null>(null)
const inviteUrl = ref<string>('')
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

// Check if there's a pending join or existing room on mount
onMounted(async () => {
  const sessionData = await storageManager.getSessionData()

  // 방에 입장 중이거나 pendingJoin이 있으면 초대 코드 표시
  if (sessionData.roomId && sessionData.inviteCode) {
    // Set room data to show the invite code
    roomData.value = {
      roomId: sessionData.roomId,
      inviteCode: sessionData.inviteCode,
      currentVideoUrl: sessionData.currentVideoUrl || '',
      currentTime: 0,
      isPlaying: false
    } as RoomResponse

    inviteUrl.value = `http://localhost:8080/join?inviteCode=${sessionData.inviteCode}`

    // pendingJoin이 있으면 자동으로 패널 열기
    if (sessionData.pendingJoin) {
      // Clear the pending flag and badge
      await storageManager.removeItem('session:pendingJoin')
      await browser.action.setBadgeText({ text: '' })

      console.log('Auto-joining room:', sessionData.inviteCode)
      await openPanel()
    } else {
      console.log('Room already joined:', sessionData.inviteCode)
    }
  }
})

const createRoom = async () => {
  loading.value = true
  error.value = null

  try {
    // Get current active tab URL
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    const currentUrl = tabs[0]?.url || ''

    console.log('Current tab URL:', currentUrl)

    const hostId = generateUUID()
    const response = await roomController.createRoom(hostId, currentUrl)

    // Store in session storage
    await storageManager.setSessionData({
      roomId: response.roomId,
      inviteCode: response.inviteCode,
      userId: hostId,
      isHost: true,
      currentVideoUrl: currentUrl
    })

    roomData.value = response
    inviteUrl.value = `http://localhost:8080/join?inviteCode=${response.inviteCode}`
    // inviteUrl.value = `https://syncparty.com/join?code=${response.inviteCode}`
  } catch (err) {
    console.error('방 생성 실패:', err)
    error.value = '방 생성에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

const openPanel = async () => {
  // Get current active tab
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const tabId = tabs[0]?.id

  if (!tabId) {
    console.error('No active tab found')
    return
  }

  browser.runtime.sendMessage({
    type: MessageType.OPEN_PANEL,
    tabId: tabId
  })

  // Popup 닫기
  window.close()
}

const leaveRoom = async () => {
  try {
    // 세션 데이터 삭제
    await storageManager.clearSessionData()

    // 상태 초기화
    roomData.value = null
    inviteUrl.value = ''

    console.log('방을 나갔습니다')
  } catch (err) {
    console.error('방 나가기 실패:', err)
    error.value = '방 나가기에 실패했습니다.'
  }
}
</script>

<style scoped>
.popup-container {
  width: 400px;
  min-height: 500px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 2em;
  color: #646cff;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9em;
}

.error-message {
  background-color: #ff4444;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
}

.close-error {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5em;
  padding: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  line-height: 1;
}

.close-error:hover {
  opacity: 0.8;
}

.initial-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-room-button {
  background-color: #646cff;
  color: white;
  border: none;
  padding: 16px 48px;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 600;
}

.create-room-button:hover:not(:disabled) {
  background-color: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.create-room-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.room-created-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.invite-section {
  background-color: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-label {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invite-code {
  font-size: 1.5em;
  font-weight: 700;
  color: #646cff;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.invite-url {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.87);
  word-break: break-all;
  padding: 8px;
  background-color: #242424;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.enter-button {
  background-color: #1a1a1a;
  color: rgba(255, 255, 255, 0.87);
  border: 2px solid #646cff;
  padding: 16px 48px;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 600;
  margin-top: auto;
}

.enter-button:hover {
  background-color: #646cff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
}

.leave-button {
  background-color: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  font-size: 0.95em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 500;
}

.leave-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.87);
}
</style>
