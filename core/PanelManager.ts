import {createApp} from "vue";
import App from "@/entrypoints/panel/App.vue";
import {withTimeout} from "async-mutex";
import {OTTPlugin, OTTType} from "@/types";


export class PanelManager {

    private static instance: PanelManager;

    private readonly PANEL_CONTAINER = 'panel-container';

    private constructor() {
    }

    public static getInstance(): PanelManager {
        if (!PanelManager.instance) {
            PanelManager.instance = new PanelManager();
        }
        return PanelManager.instance;
    }

    public isOpen(): boolean {
        return !!document.getElementById(this.PANEL_CONTAINER);
    }

    public async openPanel(ottPlugin: OTTPlugin) {
        if (this.isOpen()) {
            return;
        }
        this.createPanel(ottPlugin);
    }

    public async removeModal() {
        document.getElementById(this.PANEL_CONTAINER)?.remove();
    }

    private createPanel(ottPlugin: OTTPlugin) {
        const container = document.createElement("div");
        container.classList.add('syncparty-panel-wrapper');

        const panelContainer = document.getElementById(this.PANEL_CONTAINER) || this.createPanelContainer(ottPlugin);
        panelContainer.appendChild(container);

        createApp(App)
            .mount(container);
    }

    private createPanelContainer(ottPlugin: OTTPlugin): HTMLElement {
        const container = document.createElement("div");
        container.id = this.PANEL_CONTAINER;
        container.style.width = '400px'; // 픽셀로 고정
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.flexShrink = '0'; // flex로 인한 크기 변경 방지

        // Resizer 추가 (왼쪽 border)
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

        ottPlugin.locationContainer(container);

        return container;
    }

}

export const panelManager = PanelManager.getInstance();
