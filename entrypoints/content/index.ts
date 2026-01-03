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

    // URL 변화 감지 및 패널 모드 전환
    const handleUrlChange = async () => {
      console.log('[ContentScript] URL changed:', window.location.href);

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