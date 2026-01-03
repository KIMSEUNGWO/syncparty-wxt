import {OTTPlugin} from "@/types";


export const netflix : OTTPlugin = {
    name: 'Netflix',
    isWatchPage: (url: string) => {
        return url.includes('/watch/');
    },
    locationContainer: (container: HTMLElement) => {
        const watchVideo = document.querySelector('.watch-video') as HTMLElement;
        watchVideo.style.display = 'flex';

        const style = document.createElement('style');
        style.innerText = '.watch-video--player-view { position: relative;}';
        container.appendChild(style);
        watchVideo.appendChild(container);

        // MutationObserver로 자식 변화를 감지하여 container가 항상 마지막에 위치하도록 보장
        let restoreTimeout: number | null = null;

        const observer = new MutationObserver(() => {
            // debounce: 너무 자주 실행되지 않도록
            if (restoreTimeout) {
                clearTimeout(restoreTimeout);
            }

            restoreTimeout = window.setTimeout(() => {
                // container가 DOM에서 완전히 제거되었거나, 마지막 자식이 아닌 경우에만 복원
                if (!watchVideo.contains(container)) {
                    console.log('[Netflix] Container removed, restoring');
                    watchVideo.appendChild(container);
                } else if (watchVideo.lastElementChild !== container) {
                    // 이미 DOM에 있지만 위치가 바뀐 경우
                    // appendChild는 자동으로 이동시키므로 호출하지 않음
                    console.log('[Netflix] Container position changed, but not moving to avoid flicker');
                }
            }, 50);
        });

        observer.observe(watchVideo, {
            childList: true,  // 자식 노드의 추가/제거 감지
            subtree: false    // 직계 자식만 감지
        });

        // 비디오가 리사이즈를 감지하도록 강제로 resize 이벤트 발생
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        // 추가로 requestAnimationFrame으로도 한번 더 시도
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });

        // cleanup 함수 반환: Observer 해제
        return () => {
            console.log('[Netflix] Observer disconnected');
            observer.disconnect();
        };
    }
}
