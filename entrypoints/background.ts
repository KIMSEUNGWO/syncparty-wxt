import { roomController } from '@/components/RoomController'
import { generateUUID } from '@/components/utils/uuid'
import { getRandomProfileImage } from '@/components/utils/profileImages'
import { MessageType } from "@/core/MessageType"
import { storageManager } from '@/core/StorageManager'
import { ChatService } from '@/services/ChatService'
import type { ChatMessage } from '@/components/dto/ChatMessage'

// ChatService 인스턴스 (background에서 관리)
let chatService: ChatService | null = null
let activePanelTabId: number | null = null

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  // Listen for notification clicks
  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'join-room-notification') {
      console.log('Join room notification clicked')
      // The badge is already set, user will click the extension icon
    }
  })

  // Listen for messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch (message.type) {
      case MessageType.JOIN_ROOM:
        handleJoinRoom(message.inviteCode)
          .then((result) => {
            sendResponse({ success: true, data: result })
          })
          .catch((error) => {
            console.error('Failed to join room:', error)
            sendResponse({ success: false, error: error.message })
          })
        break;

      case MessageType.OPEN_PANEL:
        // Use tabId from message if provided (from popup), otherwise use sender.tab.id (from content script)
        const targetTabId = message.tabId || sender.tab?.id

        handleOpenSidePanel(targetTabId)
          .then(() => {
            sendResponse({ success: true })
          })
          .catch((error) => {
            console.error('Failed to open side panel:', error)
            sendResponse({ success: false, error: error.message })
          })
        break;

      case MessageType.CHAT_INIT:
        handleChatInit(message.roomCode, message.userId, message.username, sender.tab?.id)
          .then(() => {
            sendResponse({ success: true })
          })
          .catch((error) => {
            console.error('Failed to initialize chat:', error)
            sendResponse({ success: false, error: error.message })
          })
        break;

      case MessageType.CHAT_SEND_MESSAGE:
        handleChatSendMessage(message.text)
          .then(() => {
            sendResponse({ success: true })
          })
          .catch((error) => {
            console.error('Failed to send message:', error)
            sendResponse({ success: false, error: error.message })
          })
        break;

      case MessageType.CHAT_LEAVE:
        handleChatLeave()
          .then(() => {
            sendResponse({ success: true })
          })
          .catch((error) => {
            console.error('Failed to leave chat:', error)
            sendResponse({ success: false, error: error.message })
          })
        break;
    }

    return true
  })
})

async function handleOpenSidePanel(tabId: number | undefined) {
  console.log('Opening side panel for tab:', tabId)

  if (!tabId) {
    throw new Error('Tab ID is required')
  }

  // Send OPEN_PANEL message to content script
  await browser.tabs.sendMessage(tabId, {
    type: MessageType.OPEN_PANEL
  })

  console.log('OPEN_PANEL message sent to content script')
}

async function handleJoinRoom(inviteCode: string) {
  console.log('Joining room with code:', inviteCode)

  try {
    // Fetch room data from API
    const roomData = await roomController.getRoomByCode(inviteCode)
    console.log('Room data fetched:', roomData)

    // Generate user ID for the joining user
    const userId = generateUUID()
    const profileImage = getRandomProfileImage()

    // Store room data in session storage
    await storageManager.setSessionData({
      roomId: roomData.roomId,
      inviteCode: roomData.inviteCode,
      userId: userId,
      isHost: false,
      profileImage: profileImage,
      pendingJoin: true
    })

    console.log('Room data stored in session storage')

    // Show notification
    await browser.notifications.create('join-room-notification', {
      type: 'basic',
      iconUrl: '/icon/128.png',
      title: 'SyncParty 초대',
      message: `방에 초대되었습니다! 확장 아이콘을 클릭하여 입장하세요.`,
      priority: 2
    })

    // Show badge on extension icon
    await browser.action.setBadgeText({ text: '!' })
    await browser.action.setBadgeBackgroundColor({ color: '#646cff' })

    console.log('Notification and badge set - user should click extension icon')

    return { roomData, userId, profileImage }
  } catch (error) {
    console.error('Error joining room:', error)
    throw error
  }
}

async function handleChatInit(roomCode: string, userId: string, username: string, tabId: number | undefined) {
  console.log('[Background] Initializing chat:', { roomCode, userId, username, tabId })

  if (!tabId) {
    throw new Error('Tab ID is required')
  }

  activePanelTabId = tabId

  // 기존 ChatService가 있으면 정리
  if (chatService) {
    await chatService.leave()
    chatService = null
  }

  // 새로운 ChatService 생성 및 초기화
  chatService = new ChatService()
  await chatService.initialize(roomCode, userId, username)

  // 메시지 핸들러 등록
  chatService.onMessage((message: ChatMessage) => {
    // Panel에 메시지 전달
    if (activePanelTabId) {
      browser.tabs.sendMessage(activePanelTabId, {
        type: MessageType.CHAT_MESSAGE_RECEIVED,
        message: message
      }).catch((error) => {
        console.error('[Background] Failed to send message to panel:', error)
      })
    }
  })

  console.log('[Background] Chat initialized successfully')
}

async function handleChatSendMessage(text: string) {
  if (!chatService) {
    throw new Error('Chat service is not initialized')
  }

  chatService.sendMessage(text)
  console.log('[Background] Message sent:', text)
}

async function handleChatLeave() {
  if (chatService) {
    await chatService.leave()
    chatService = null
    activePanelTabId = null
    console.log('[Background] Chat service cleaned up')
  }
}

