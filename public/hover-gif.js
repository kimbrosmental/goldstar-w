document.addEventListener("DOMContentLoaded", function () {
    const socialIcon = document.querySelector('.social-icon');
    const hoverGif = socialIcon.querySelector('.kakao-hover');
    const staticImg = socialIcon.querySelector('.kakao-static');

    let isPlaying = false;

    // GPU 가속 스타일 적용
    if (hoverGif) {
        hoverGif.style.willChange = 'transform, opacity';
        hoverGif.style.transform = 'translateZ(0)';
        hoverGif.style.backfaceVisibility = 'hidden';
        hoverGif.style.imageRendering = 'auto';
    }

    socialIcon.addEventListener('mouseenter', () => {
        if (isPlaying) return;
        isPlaying = true;
        // requestAnimationFrame으로 렌더링 최적화
        const gifSrc = hoverGif.getAttribute('src');
        hoverGif.setAttribute('src', '');
        hoverGif.offsetHeight;
        requestAnimationFrame(() => {
            hoverGif.setAttribute('src', gifSrc);
        });
        socialIcon.classList.add('playing');
        setTimeout(() => {
            socialIcon.classList.remove('playing');
            isPlaying = false;
        }, 4000);
    });
});
