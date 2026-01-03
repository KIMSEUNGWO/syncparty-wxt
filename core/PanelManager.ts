import {createApp} from "vue";
import App from "@/entrypoints/panel/App.vue";
import {withTimeout} from "async-mutex";
import {OTTPlugin, OTTType} from "@/types";

enum PanelMode {
    EMBEDDED = 'embedded',  // 페이지 내에 통합
    FLOATING = 'floating'   // 오른쪽 하단에 떠있는 형태
}

export class PanelManager {

    private static instance: PanelManager;

    private readonly PANEL_CONTAINER = 'panel-container';
    private currentMode: PanelMode = PanelMode.EMBEDDED;
    private currentPlugin: OTTPlugin | null = null;
    private panelObserver: MutationObserver | null = null;
    private shouldMaintainPanel: boolean = false;
    private cleanupFn: (() => void) | null = null;

    private constructor() {
    }

    public static getInstance(): PanelManager {
        if (!PanelManager.instance) {
            PanelManager.instance = new PanelManager();
        }
        return PanelManager.instance;
    }

    private startPanelProtection() {
        // 이미 감시 중이면 리턴
        if (this.panelObserver) {
            return;
        }

        this.shouldMaintainPanel = true;

        let debounceTimer: number | null = null;

        // MutationObserver로 패널이 제거되는지 감시
        this.panelObserver = new MutationObserver((mutations) => {
            // debounce: 너무 자주 실행되지 않도록
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = window.setTimeout(() => {
                if (this.shouldMaintainPanel && !this.isOpen() && this.currentPlugin) {
                    console.warn('[PanelManager] Panel was removed, restoring...');

                    // 현재 URL에 따라 적절한 모드로 복구
                    const isWatchPage = this.currentPlugin.isWatchPage(window.location.href);
                    this.currentMode = isWatchPage ? PanelMode.EMBEDDED : PanelMode.FLOATING;

                    console.log('[PanelManager] Restoring in', this.currentMode, 'mode');
                    this.createPanel(this.currentPlugin);
                }
            }, 100); // 100ms 디바운스
        });

        // body의 직접 자식만 감시 (subtree: false)
        this.panelObserver.observe(document.body, {
            childList: true,
            subtree: false  // body의 직접 자식만 감지
        });

        // Embedded 모드일 경우 watch-video도 감시
        if (this.currentMode === PanelMode.EMBEDDED) {
            const watchVideo = document.querySelector('.watch-video');
            if (watchVideo) {
                this.panelObserver.observe(watchVideo, {
                    childList: true,
                    subtree: false
                });
            }
        }
    }

    private stopPanelProtection() {
        this.shouldMaintainPanel = false;
        if (this.panelObserver) {
            this.panelObserver.disconnect();
            this.panelObserver = null;
        }
    }

    public isOpen(): boolean {
        return !!document.getElementById(this.PANEL_CONTAINER);
    }

    public async openPanel(ottPlugin: OTTPlugin) {
        if (this.isOpen()) {
            return;
        }
        this.currentPlugin = ottPlugin;
        const isWatchPage = ottPlugin.isWatchPage(window.location.href);
        this.currentMode = isWatchPage ? PanelMode.EMBEDDED : PanelMode.FLOATING;
        this.createPanel(ottPlugin);

        // 패널 보호 시작
        this.startPanelProtection();
    }

    public async removeModal() {
        console.log('[PanelManager] removeModal called');

        // 먼저 플래그 비활성화 (Observer 콜백이 실행되더라도 복구 안 되도록)
        this.shouldMaintainPanel = false;

        // Observer 즉시 해제
        if (this.panelObserver) {
            this.panelObserver.disconnect();
            this.panelObserver = null;
            console.log('[PanelManager] Panel observer disconnected');
        }

        // Netflix Observer cleanup 함수 호출
        if (this.cleanupFn) {
            this.cleanupFn();
            this.cleanupFn = null;
            console.log('[PanelManager] Cleanup function executed');
        }

        // currentPlugin도 먼저 null로 설정
        this.currentPlugin = null;

        // 그 다음 DOM 제거
        const container = document.getElementById(this.PANEL_CONTAINER);
        if (container) {
            container.remove();
            console.log('[PanelManager] Panel container removed');
        }
        window.dispatchEvent(new Event('resize'));
    }

    public async switchToEmbeddedMode() {
        if (!this.isOpen() || !this.currentPlugin || this.currentMode === PanelMode.EMBEDDED) {
            console.log('[PanelManager] switchToEmbeddedMode: 조건 미충족', {
                isOpen: this.isOpen(),
                hasPlugin: !!this.currentPlugin,
                currentMode: this.currentMode
            });
            return;
        }

        console.log('[PanelManager] Switching to EMBEDDED mode');

        const container = document.getElementById(this.PANEL_CONTAINER);
        if (!container) return;

        // 기존 패널 제거하고 embedded 모드로 재생성
        container.remove();
        this.currentMode = PanelMode.EMBEDDED;

        // Watch 페이지 요소가 로드될 때까지 대기
        await this.waitForWatchPageElements();

        if (this.currentPlugin) {
            this.createPanel(this.currentPlugin);
        }
    }

    private async waitForWatchPageElements(maxAttempts = 20): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            const watchVideo = document.querySelector('.watch-video');
            if (watchVideo) {
                console.log('[PanelManager] Watch page elements found');
                return;
            }
            console.log(`[PanelManager] Waiting for watch page elements... (${i + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.warn('[PanelManager] Watch page elements not found after waiting');
    }

    public switchToFloatingMode() {
        if (!this.isOpen() || this.currentMode === PanelMode.FLOATING) {
            console.log('[PanelManager] switchToFloatingMode: 조건 미충족', {
                isOpen: this.isOpen(),
                currentMode: this.currentMode
            });
            return;
        }

        console.log('[PanelManager] Switching to FLOATING mode');

        const container = document.getElementById(this.PANEL_CONTAINER);
        if (!container) return;

        // Floating 모드 스타일 적용
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.bottom = '20px';
        container.style.width = '400px';
        container.style.height = '600px';
        container.style.zIndex = '999999';
        container.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.5)';
        container.style.borderRadius = '12px';
        container.style.overflow = 'hidden';

        this.currentMode = PanelMode.FLOATING;
        console.log('[PanelManager] FLOATING mode activated');
    }

    private createPanel(ottPlugin: OTTPlugin) {
        // 이미 패널이 있고 wrapper도 있으면 재생성하지 않음
        const existingPanel = document.getElementById(this.PANEL_CONTAINER);
        if (existingPanel && existingPanel.querySelector('.syncparty-panel-wrapper')) {
            console.log('[PanelManager] Panel already exists, skipping creation');
            return;
        }

        console.log('[PanelManager] Creating new panel');

        const container = document.createElement("div");
        container.classList.add('syncparty-panel-wrapper');

        const panelContainer = existingPanel || this.createPanelContainer(ottPlugin);
        panelContainer.appendChild(container);

        createApp(App)
            .mount(container);
    }

    private createPanelContainer(ottPlugin: OTTPlugin): HTMLElement {
        const container = document.createElement("div");
        container.id = this.PANEL_CONTAINER;

        // 모드에 따라 다르게 설정
        if (this.currentMode === PanelMode.FLOATING) {
            // Floating 모드: body에 추가하고 fixed position
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.bottom = '20px';
            container.style.width = '400px';
            container.style.height = '600px';
            container.style.zIndex = '999999';
            container.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.5)';
            container.style.borderRadius = '12px';
            container.style.overflow = 'hidden';

            document.body.appendChild(container);
        } else {
            // Embedded 모드: 페이지 내에 통합
            container.style.width = '400px';
            container.style.height = '100%';
            container.style.position = 'relative';
            container.style.flexShrink = '0';

            // Resizer 추가 (Embedded 모드에만)
            const resizer = document.createElement("div");
            resizer.style.position = 'absolute';
            resizer.style.left = '0';
            resizer.style.top = '0';
            resizer.style.width = '8px';
            resizer.style.height = '100%';
            resizer.style.cursor = 'ew-resize';
            resizer.style.backgroundColor = 'rgba(100, 108, 255, 0.3)';
            resizer.style.transition = 'background-color 0.2s';
            resizer.style.zIndex = '10000';

            // Hover 효과
            resizer.addEventListener('mouseenter', () => {
                resizer.style.backgroundColor = 'rgba(100, 108, 255, 0.6)';
            });
            resizer.addEventListener('mouseleave', () => {
                resizer.style.backgroundColor = 'rgba(100, 108, 255, 0.3)';
            });

            container.appendChild(resizer);

            // Resize 로직
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = container.getBoundingClientRect().width;

                // 드래그 중 텍스트 선택 방지
                e.preventDefault();
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const deltaX = startX - e.clientX; // 왼쪽으로 드래그하면 양수
                const newWidth = startWidth + deltaX;

                // 화면 전체 width 기준
                const screenWidth = window.innerWidth;

                // 최소/최대 너비 제한 (10% ~ 50%)
                const minWidth = screenWidth * 0.1;
                const maxWidth = screenWidth * 0.5;
                const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

                container.style.width = `${clampedWidth}px`;
                window.dispatchEvent(new Event('resize'));
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.userSelect = '';

                    // 드래그 완료 후에만 비디오 리사이즈 트리거
                    window.dispatchEvent(new Event('resize'));
                }
            });

            // Embedded 모드에서만 ottPlugin.locationContainer 호출
            const cleanup = ottPlugin.locationContainer(container);
            if (cleanup) {
                this.cleanupFn = cleanup;
                console.log('[PanelManager] Cleanup function registered');
            }
        }

        return container;
    }

}

export const panelManager = PanelManager.getInstance();
