import {MessageType} from "@/core/MessageType";
import {panelManager} from "@/core/PanelManager";
import {urlHelper} from "@/core/UrlHelper";
import {OTTPlugin, OTTType} from "@/types";

export default defineContentScript({
  matches: [
    'https://www.netflix.com/*'
  ],
  runAt: 'document_idle',
  async main() {
    console.log('Hello content.')

    let lastUrl = window.location.href;
    let lastPanelOpen = false;

    // 이전 포커스된 요소를 추적
    let lastFocusedElement: HTMLElement | null = null;
    let isInputElement = false;
    let lastUserInteractionTime = 0;

    // 요소가 입력 가능한 요소인지 확인
    const isEditableElement = (element: Element | null): boolean => {
      if (!element) return false;

      const tagName = element.tagName.toLowerCase();
      const isEditable = (element as HTMLElement).isContentEditable === 'true';
      const isInput = tagName === 'input' || tagName === 'textarea';

      return isInput || isEditable;
    };

    // 사용자 클릭/터치 감지 (최근 interaction 추적)
    document.addEventListener('mousedown', () => {
      lastUserInteractionTime = Date.now();
    }, true);

    document.addEventListener('touchstart', () => {
      lastUserInteractionTime = Date.now();
    }, true);

    // 전역 포커스 추적
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;

      // 플레이어가 아닌 요소로 포커스가 이동하면 기록
      if (!target.matches('[data-uia="player"]')) {
        lastFocusedElement = target;
        isInputElement = isEditableElement(target);
      }
    }, true);

    // Netflix 플레이어 자동 포커스 방지 (사용자 입력 중일 때만)
    const preventPlayerAutoFocus = () => {
      const playerElement = document.querySelector('[data-uia="player"]') as HTMLElement;

      if (playerElement) {
        // 플레이어로 포커스가 이동하는 것을 감지
        playerElement.addEventListener('focusin', (e) => {
          const timeSinceLastInteraction = Date.now() - lastUserInteractionTime;

          console.log('[ContentScript] Player received focus');
          console.log('[ContentScript] Time since last click:', timeSinceLastInteraction + 'ms');
          console.log('[ContentScript] Was typing in input?', isInputElement);

          // 최근 500ms 이내에 클릭이 있었다면 사용자가 직접 클릭한 것으로 간주
          if (timeSinceLastInteraction < 500) {
            console.log('[ContentScript] User clicked player - allowing focus');
            return;
          }

          // 바로 직전에 입력 요소에 포커스가 있었고, 자동 포커스인 경우만 막음
          if (isInputElement && lastFocusedElement) {
            console.log('[ContentScript] Auto-focus detected - restoring to input');
            e.stopPropagation();

            // 플레이어 포커스 해제하고 원래 요소로 복원
            setTimeout(() => {
              playerElement.blur();
              lastFocusedElement?.focus();
            }, 0);
          }
        }, true);

        console.log('[ContentScript] Player auto-focus prevention enabled (smart mode)');
      }
    };

    // 플레이어가 로드될 때까지 기다렸다가 포커스 방지 활성화
    const waitForPlayer = () => {
      const observer = new MutationObserver(() => {
        const playerElement = document.querySelector('[data-uia="player"]');
        if (playerElement) {
          preventPlayerAutoFocus();
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // 이미 플레이어가 있다면 즉시 실행
      if (document.querySelector('[data-uia="player"]')) {
        preventPlayerAutoFocus();
        observer.disconnect();
      }
    };

    // 시청 페이지에서만 포커스 방지 활성화
    if (window.location.href.includes('/watch/')) {
      waitForPlayer();
    }

    // URL 변화 감지 및 패널 모드 전환
    const handleUrlChange = async () => {
      console.log('[ContentScript] URL changed:', window.location.href);

      // 시청 페이지로 이동하면 플레이어 포커스 방지 재활성화
      if (window.location.href.includes('/watch/')) {
        waitForPlayer();
      }

      if (!panelManager.isOpen()) {
        console.log('[ContentScript] Panel not open, skipping mode switch');
        return;
      }

      const currentPlugin = urlHelper.toPlugin(window.location.href);
      if (!currentPlugin) {
        // 다른 도메인으로 이동 시 패널 삭제
        console.log('[ContentScript] Different domain, removing panel');
        panelManager.removeModal();
        return;
      }

      // 같은 도메인 내에서 페이지 변화 감지
      const isWatchPage = currentPlugin.isWatchPage(window.location.href);
      console.log('[ContentScript] Is watch page:', isWatchPage);

      if (isWatchPage) {
        console.log('[ContentScript] Switching to EMBEDDED mode');
        await panelManager.switchToEmbeddedMode();
      } else {
        console.log('[ContentScript] Switching to FLOATING mode');
        panelManager.switchToFloatingMode();
      }
    };

    // URL 변화 감지 (Polling 방식 - Netflix SPA 네비게이션 감지)
    setInterval(() => {
      const currentUrl = window.location.href;
      const isPanelOpen = panelManager.isOpen();

      if (currentUrl !== lastUrl) {
        console.log('[ContentScript] URL polling detected change:', currentUrl);
        lastUrl = currentUrl;
        handleUrlChange();
      }

      // 패널이 예기치 않게 제거되었는지 확인
      if (lastPanelOpen && !isPanelOpen) {
        console.warn('[ContentScript] Panel was unexpectedly removed!');
      }
      lastPanelOpen = isPanelOpen;
    }, 500);

    // SPA 네비게이션 감지 (백업)
    // 1. popstate 이벤트 (뒤로/앞으로 가기)
    window.addEventListener('popstate', () => {
      console.log('[ContentScript] popstate event fired');
      handleUrlChange();
    });

    // 2. pushState/replaceState 오버라이드
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      console.log('[ContentScript] pushState called');
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      console.log('[ContentScript] replaceState called');
      handleUrlChange();
    };

    // Check if URL contains joinRoom parameter
    const urlParams = new URLSearchParams(window.location.search)
    const inviteCode = urlParams.get('inviteCode')

    if (inviteCode) {
      console.log('Join room detected:', inviteCode)
      const ottPlugin: OTTPlugin = urlHelper.toPlugin(window.location.href);
      await panelManager.openPanel(ottPlugin);
      const url = new URL(window.location.href)
      url.searchParams.delete('inviteCode')
      window.history.replaceState({}, '', url.toString())
    }

    browser.runtime.onMessage.addListener(async (message) => {

      switch (message.type) {
        case MessageType.OPEN_PANEL:
          console.log('컨텐츠스크립트에서 OPEN_PANEL 메세지 받음')
          const ottPlugin: OTTPlugin = urlHelper.toPlugin(window.location.href);
          await panelManager.openPanel(ottPlugin);
          break;
      }
    })
  },
});