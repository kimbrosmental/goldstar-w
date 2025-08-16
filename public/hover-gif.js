document.addEventListener("DOMContentLoaded", function () {
    const socialIcon = document.querySelector('.social-icon');
    const hoverGif = socialIcon.querySelector('.kakao-hover');
    const staticImg = socialIcon.querySelector('.kakao-static');

    let isPlaying = false;

    socialIcon.addEventListener('mouseenter', () => {
        if (isPlaying) return;

        isPlaying = true;

        const gifSrc = hoverGif.getAttribute('src');
        hoverGif.setAttribute('src', '');
        hoverGif.offsetHeight;
        hoverGif.setAttribute('src', gifSrc);

        socialIcon.classList.add('playing');

        setTimeout(() => {
            socialIcon.classList.remove('playing');
            isPlaying = false;
        }, 4000);
    });
});
