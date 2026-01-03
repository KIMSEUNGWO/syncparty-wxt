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