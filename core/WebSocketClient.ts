import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type MessageHandler = (message: any) => void;

export class WebSocketClient {
    private client: Client | null = null;
    private subscriptions: Map<string, StompSubscription> = new Map();
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;

    constructor(private url: string) {}

    /**
     * WebSocket 연결
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                resolve();
                return;
            }

            this.client = new Client({
                webSocketFactory: () => new SockJS(this.url) as any,
                debug: (str) => {
                    console.log('[STOMP Debug]', str);
                },
                reconnectDelay: this.reconnectDelay,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = (frame) => {
                console.log('[WebSocket] Connected:', frame);
                this.connected = true;
                this.reconnectAttempts = 0;
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('[WebSocket] STOMP Error:', frame);
                reject(new Error(frame.headers['message'] || 'STOMP connection error'));
            };

            this.client.onWebSocketClose = () => {
                console.log('[WebSocket] Disconnected');
                this.connected = false;
                this.handleReconnect();
            };

            this.client.onWebSocketError = (error) => {
                console.error('[WebSocket] Error:', error);
                reject(error);
            };

            this.client.activate();
        });
    }

    /**
     * 재연결 처리
     */
    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect().catch(console.error);
            }, this.reconnectDelay);
        } else {
            console.error('[WebSocket] Max reconnect attempts reached');
        }
    }

    /**
     * 토픽 구독
     */
    subscribe(destination: string, callback: MessageHandler): string {
        if (!this.client || !this.connected) {
            throw new Error('WebSocket is not connected');
        }

        const subscriptionId = `sub-${Date.now()}-${Math.random()}`;

        const subscription = this.client.subscribe(destination, (message: IMessage) => {
            try {
                const payload = JSON.parse(message.body);
                callback(payload);
            } catch (error) {
                console.error('[WebSocket] Failed to parse message:', error);
            }
        });

        this.subscriptions.set(subscriptionId, subscription);
        console.log('[WebSocket] Subscribed to:', destination);

        return subscriptionId;
    }

    /**
     * 구독 취소
     */
    unsubscribe(subscriptionId: string) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionId);
            console.log('[WebSocket] Unsubscribed:', subscriptionId);
        }
    }

    /**
     * 메시지 전송
     */
    send(destination: string, body: any) {
        if (!this.client || !this.connected) {
            throw new Error('WebSocket is not connected');
        }

        this.client.publish({
            destination,
            body: JSON.stringify(body),
        });

        console.log('[WebSocket] Message sent to:', destination);
    }

    /**
     * 연결 해제
     */
    async disconnect() {
        // 모든 구독 취소
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();

        if (this.client) {
            await this.client.deactivate();
            this.client = null;
        }

        this.connected = false;
        console.log('[WebSocket] Disconnected and cleaned up');
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.connected;
    }
}