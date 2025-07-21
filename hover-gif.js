document.addEventListener("DOMContentLoaded", function () {
    const socialIcon = document.querySelector('.social-icon');
    const hoverGif = socialIcon.querySelector('.kakao-hover');
    const staticImg = socialIcon.querySelector('.kakao-static');

    let isPlaying = false;

    socialIcon.addEventListener('mouseenter', () => {
        if (isPlaying) return; // 재생 중이면 무시

        isPlaying = true;

        // GIF 이미지 재로드를 위해 src를 강제로 다시 설정
        const gifSrc = hoverGif.getAttribute('src');
        hoverGif.setAttribute('src', '');
        hoverGif.offsetHeight; // 강제 리플로우 (브라우저가 다시 그리게 함)
        hoverGif.setAttribute('src', gifSrc);

        socialIcon.classList.add('playing');

        // 5.5초 후 static으로 복귀
        setTimeout(() => {
            socialIcon.classList.remove('playing');
            isPlaying = false;
        }, 5500); // GIF 재생 시간과 동일
    });
});
