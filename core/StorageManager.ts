/**
 * StorageManager - 간소화된 스토리지 관리
 *
 * 역할:
 * - browser.storage.local 래핑
 * - 타입 안전성
 * - 모든 컨텍스트(background, content, popup)에서 사용 가능
 *
 * 원칙:
 * - 단일 책임: 스토리지 읽기/쓰기만 담당
 * - 캡슐화: browser API 감춤
 * - 싱글톤: 모든 컨텍스트에서 동일 인스턴스
 */

import { browser } from 'wxt/browser';

/**
 * 세션 데이터 타입
 */
export interface SessionData {
  roomId?: string;
  inviteCode?: string;
  userId?: string;
  isHost?: boolean;
  profileImage?: string;
  pendingJoin?: boolean;
  currentVideoUrl?: string;
  chatMessages?: string; // JSON stringified ChatMessage[]
}

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 단일 값 가져오기 (타입 안전)
   */
  public async getItem<T>(key: string): Promise<T | null> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return null;
      }

      const result = await browser.storage.local.get(key);
      return result[key] !== undefined ? (result[key] as T) : null;
    } catch (error) {
      console.error(`[StorageManager] Failed to get item "${key}":`, error);
      return null;
    }
  }

  /**
   * 단일 값 저장
   */
  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return;
      }

      await browser.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`[StorageManager] Failed to set item "${key}":`, error);
      throw error;
    }
  }

  /**
   * 단일 값 삭제
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return;
      }

      await browser.storage.local.remove(key);
    } catch (error) {
      console.error(`[StorageManager] Failed to remove item "${key}":`, error);
      throw error;
    }
  }

  /**
   * 여러 값 한번에 가져오기
   */
  public async getItems(keys: string[]): Promise<Record<string, any>> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return {};
      }

      return await browser.storage.local.get(keys);
    } catch (error) {
      console.error('[StorageManager] Failed to get items:', error);
      return {};
    }
  }

  /**
   * 여러 값 한번에 저장
   */
  public async setItems(items: Record<string, any>): Promise<void> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return;
      }

      await browser.storage.local.set(items);
    } catch (error) {
      console.error('[StorageManager] Failed to set items:', error);
      throw error;
    }
  }

  /**
   * 세션 데이터 전체 가져오기
   */
  public async getSessionData(): Promise<SessionData> {
    const keys = [
      'session:roomId',
      'session:inviteCode',
      'session:userId',
      'session:isHost',
      'session:profileImage',
      'session:pendingJoin',
      'session:currentVideoUrl',
      'session:chatMessages'
    ];

    const result = await this.getItems(keys);

    return {
      roomId: result['session:roomId'],
      inviteCode: result['session:inviteCode'],
      userId: result['session:userId'],
      isHost: result['session:isHost'],
      profileImage: result['session:profileImage'],
      pendingJoin: result['session:pendingJoin'],
      currentVideoUrl: result['session:currentVideoUrl'],
      chatMessages: result['session:chatMessages']
    };
  }

  /**
   * 세션 데이터 전체 저장
   */
  public async setSessionData(data: Partial<SessionData>): Promise<void> {
    const items: Record<string, any> = {};

    if (data.roomId !== undefined) items['session:roomId'] = data.roomId;
    if (data.inviteCode !== undefined) items['session:inviteCode'] = data.inviteCode;
    if (data.userId !== undefined) items['session:userId'] = data.userId;
    if (data.isHost !== undefined) items['session:isHost'] = data.isHost;
    if (data.profileImage !== undefined) items['session:profileImage'] = data.profileImage;
    if (data.pendingJoin !== undefined) items['session:pendingJoin'] = data.pendingJoin;
    if (data.currentVideoUrl !== undefined) items['session:currentVideoUrl'] = data.currentVideoUrl;
    if (data.chatMessages !== undefined) items['session:chatMessages'] = data.chatMessages;

    await this.setItems(items);
  }

  /**
   * 세션 데이터 전체 삭제
   */
  public async clearSessionData(): Promise<void> {
    const keys = [
      'session:roomId',
      'session:inviteCode',
      'session:userId',
      'session:isHost',
      'session:profileImage',
      'session:pendingJoin',
      'session:currentVideoUrl',
      'session:chatMessages'
    ];

    for (const key of keys) {
      await this.removeItem(key);
    }

    console.log('[StorageManager] Session data cleared');
  }

  /**
   * 전체 스토리지 초기화 (위험!)
   */
  public async clear(): Promise<void> {
    try {
      if (typeof browser === 'undefined' || !browser?.storage) {
        console.warn('[StorageManager] Browser API not available');
        return;
      }

      await browser.storage.local.clear();
      console.warn('[StorageManager] All storage cleared');
    } catch (error) {
      console.error('[StorageManager] Failed to clear storage:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
export const storageManager = StorageManager.getInstance();
