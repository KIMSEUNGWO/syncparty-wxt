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

        // observer를 외부 스코프에서 추적
        let playerViewObserver: MutationObserver | null = null;

        const watchHasPlayerView = async () => {
            return new Promise<void>((resolve, reject) => {
                const view = document.querySelector('.watch-video--player-view');
                if (view) {
                    console.log('이미 있음! 바로 추가할 수 있음');
                    resolve();
                    return;
                }

                // MutationObserver로 DOM 변화를 비동기적으로 감지
                playerViewObserver = new MutationObserver(() => {
                    const view = document.querySelector('.watch-video--player-view');
                    if (view) {
                        console.log('이제 찾았음');
                        playerViewObserver?.disconnect();
                        playerViewObserver = null;
                        resolve();
                    }
                });

                playerViewObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // 타임아웃 설정: 10초 후에도 못 찾으면 reject
                setTimeout(() => {
                    if (playerViewObserver) {
                        playerViewObserver.disconnect();
                        playerViewObserver = null;
                        reject(new Error('Timeout: .watch-video--player-view not found'));
                    }
                }, 10000);
            });
        }

        watchHasPlayerView().then(() => {
            console.log('추가한다~');
            watchVideo.appendChild(container);
        }).catch((error) => {
            console.error('[Netflix] Failed to find player view:', error);
        });

        // 비디오가 리사이즈를 감지하도록 강제로 resize 이벤트 발생
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        // cleanup 함수 반환: Observer 해제
        return () => {
            console.log('[Netflix] Cleanup: Observer disconnected');
            if (playerViewObserver) {
                playerViewObserver.disconnect();
                playerViewObserver = null;
            }
        };
    }
}
