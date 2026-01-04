import { WebSocketClient } from '@/core/WebSocketClient';
import type { ChatMessage } from '@/components/dto/ChatMessage';

export type ChatMessageHandler = (message: ChatMessage) => void;

interface ServerChatMessage {
    roomCode: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string; // LocalDateTime from server
    type: 'CHAT' | 'JOIN' | 'LEAVE' | 'SYSTEM';
}

/**
 * 채팅 서비스
 * Panel과 독립적으로 동작하며, WebSocket을 통한 채팅 기능을 제공
 */
export class ChatService {
    private wsClient: WebSocketClient;
    private roomCode: string | null = null;
    private userId: string | null = null;
    private username: string | null = null;
    private chatSubscriptionId: string | null = null;
    private messageHandlers: Set<ChatMessageHandler> = new Set();

    constructor(serverUrl: string = 'http://localhost:8080/ws') {
        this.wsClient = new WebSocketClient(serverUrl);
    }

    /**
     * 채팅 서비스 초기화 및 방 입장
     */
    async initialize(roomCode: string, userId: string, username: string): Promise<void> {
        this.roomCode = roomCode;
        this.userId = userId;
        this.username = username;

        // WebSocket 연결
        await this.wsClient.connect();

        // 채팅 토픽 구독
        this.subscribeToChatTopic();

        // 입장 메시지 전송
        this.sendJoinMessage();
    }

    /**
     * 채팅 토픽 구독
     */
    private subscribeToChatTopic() {
        if (!this.roomCode) {
            throw new Error('Room code is not set');
        }

        const destination = `/topic/room.${this.roomCode}.chat`;

        this.chatSubscriptionId = this.wsClient.subscribe(destination, (serverMessage: ServerChatMessage) => {
            // 서버 메시지를 클라이언트 포맷으로 변환
            const clientMessage: ChatMessage = {
                id: `${serverMessage.userId}-${new Date(serverMessage.timestamp).getTime()}`,
                userId: serverMessage.userId,
                userName: serverMessage.username,
                profileImage: '', // 프로필 이미지는 별도로 관리
                message: serverMessage.message,
                timestamp: new Date(serverMessage.timestamp).getTime(),
            };

            // 모든 핸들러에게 메시지 전달
            this.messageHandlers.forEach((handler) => handler(clientMessage));
        });
    }

    /**
     * 채팅 메시지 핸들러 등록
     */
    onMessage(handler: ChatMessageHandler): () => void {
        this.messageHandlers.add(handler);

        // 구독 해제 함수 반환
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    /**
     * 채팅 메시지 전송
     */
    sendMessage(message: string) {
        if (!this.roomCode || !this.userId || !this.username) {
            throw new Error('Chat service is not initialized');
        }

        const payload = {
            roomCode: this.roomCode,
            userId: this.userId,
            username: this.username,
            message: message,
            type: 'CHAT',
        };

        this.wsClient.send('/app/chat.send', payload);
    }

    /**
     * 입장 메시지 전송
     */
    private sendJoinMessage() {
        if (!this.roomCode || !this.userId || !this.username) {
            return;
        }

        const payload = {
            roomCode: this.roomCode,
            userId: this.userId,
            username: this.username,
            type: 'JOIN',
        };

        this.wsClient.send('/app/room.join', payload);
    }

    /**
     * 퇴장 메시지 전송 및 정리
     */
    async leave() {
        if (this.roomCode && this.userId && this.username) {
            const payload = {
                roomCode: this.roomCode,
                userId: this.userId,
                username: this.username,
                type: 'LEAVE',
            };

            try {
                this.wsClient.send('/app/room.leave', payload);
            } catch (error) {
                console.error('[ChatService] Failed to send leave message:', error);
            }
        }

        // 구독 취소
        if (this.chatSubscriptionId) {
            this.wsClient.unsubscribe(this.chatSubscriptionId);
            this.chatSubscriptionId = null;
        }

        // WebSocket 연결 해제
        await this.wsClient.disconnect();

        // 상태 초기화
        this.messageHandlers.clear();
        this.roomCode = null;
        this.userId = null;
        this.username = null;
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.wsClient.isConnected();
    }
}

// 싱글톤 인스턴스
let chatServiceInstance: ChatService | null = null;

/**
 * ChatService 싱글톤 가져오기
 */
export function getChatService(): ChatService {
    if (!chatServiceInstance) {
        chatServiceInstance = new ChatService();
    }
    return chatServiceInstance;
}

/**
 * ChatService 싱글톤 초기화 (주로 테스트나 재설정용)
 */
export function resetChatService() {
    if (chatServiceInstance) {
        chatServiceInstance.leave().catch(console.error);
        chatServiceInstance = null;
    }
}