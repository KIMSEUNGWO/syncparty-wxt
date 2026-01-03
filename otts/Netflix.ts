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
        watchVideo.appendChild(style);
        watchVideo.appendChild(container);

        // MutationObserver로 자식 변화를 감지하여 container가 항상 마지막에 위치하도록 보장
        const observer = new MutationObserver(() => {
            // container가 마지막 자식이 아니면 다시 마지막으로 이동
            if (watchVideo.lastElementChild !== container) {
                watchVideo.appendChild(container);
            }
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
    }
}