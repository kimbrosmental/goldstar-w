/**
 * intro_kill.js — 강제 인트로 종료 & 메인 진입 보증
 * - DOMContentLoaded 전에 실행되어도 동작
 * - 오버레이/풀스크린 엘리먼트를 탐지해서 제거
 * - /intro(.html) 경로면 /index.html 로 강제 이동
 * - 3초 내 무조건 진행, 실패 시 8초에 2차 강제
 * - 한 번 본 뒤에는 localStorage로 스킵
 */
(function () {
  try {
    if (typeof window === 'undefined') return;
    const LS_FLAG = 'introSeen';
    const NOW = Date.now();
    const FIRST_TIMEOUT = 3000;  // 3초 내 1차 강제 종료
    const SECOND_TIMEOUT = 8000; // 8초 내 2차 강제 종료
    const MIN_FADE = 400;

    // intro 페이지면 즉시 메인으로
    (function ensurePath() {
      const p = (location.pathname || '').toLowerCase();
      if (/\/intro(\.html)?$/.test(p)) {
        location.replace('/index.html');
      }
    })();

    // 이미 본 적 있으면 바로 종료
    if (localStorage.getItem(LS_FLAG) === '1') {
      killIntro(true);
    }

    // DOM 파싱이 끝나면 즉시 시도
    document.addEventListener('DOMContentLoaded', () => {
      killIntro();
    }, { once: true });

    // load 이후에도 혹시 남아있으면 재시도
    window.addEventListener('load', () => {
      setTimeout(killIntro, 50);
    });

    // 동적으로 생성되는 인트로 감지
    const mo = new MutationObserver(() => {
      killIntro();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // 시간 제한 강제 종료
    setTimeout(() => killIntro(true), FIRST_TIMEOUT);
    setTimeout(() => killIntro(true), SECOND_TIMEOUT);

    function isFullScreen(el) {
      try {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        const fixed = st.position === 'fixed' || st.position === 'sticky';
        const abs = st.position === 'absolute';
        const big = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
        const zi = parseInt(st.zIndex || '0', 10);
        const blocks = st.pointerEvents !== 'none' && (st.opacity === '' || parseFloat(st.opacity) > 0.02);
        return (fixed || abs) && big && zi >= 10 && blocks;
      } catch { return false; }
    }

    function findIntroCandidates() {
      const selectors = [
        '#intro', '#splash', '.intro', '.splash', '[data-intro]', '[data-splash]',
        '.loading', '.overlay', '.preloader', '.loader', '.modal-backdrop'
      ];
      let arr = [];
      selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => arr.push(el)));
      // 풀스크린 후보도 추가
      document.querySelectorAll('body *').forEach(el => {
        if (isFullScreen(el)) arr.push(el);
      });
      // 중복 제거
      return Array.from(new Set(arr));
    }

    function hideAndRemove(el) {
      try {
        el.style.transition = 'opacity .25s ease';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        setTimeout(() => { try { el.remove(); } catch {} }, MIN_FADE + 100);
      } catch {}
    }

    function killIntro(force) {
      try {
        // 콘솔 디버그
        // console.debug('[intro_kill] try, force=', !!force);

        const cands = findIntroCandidates();
        if (cands.length) {
          cands.forEach(hideAndRemove);
          document.documentElement.classList.remove('intro-active');
          localStorage.setItem(LS_FLAG, '1');
          return true;
        }
        // GIF가 단독으로 떠 있으면 그 부모 제거
        const gifs = Array.from(document.images || []).filter(img => /\.gif(\?|$)/i.test(img.src));
        let removed = false;
        gifs.forEach(img => {
          const p = img.closest('.intro, .splash, .overlay, .loading, .preloader') || img.parentElement;
          if (p && isFullScreen(p)) { hideAndRemove(p); removed = true; }
        });
        if (removed) {
          localStorage.setItem(LS_FLAG, '1');
          return true;
        }

        if (force) {
          // 가장 위 z-index인 풀스크린 엘리먼트를 끝내 제거
          let topEl = null, topZ = 9;
          document.querySelectorAll('body *').forEach(el => {
            const st = getComputedStyle(el);
            const zi = parseInt(st.zIndex || '0', 10);
            if (isFullScreen(el) && zi >= topZ) { topZ = zi; topEl = el; }
          });
          if (topEl) {
            topEl.remove();
            localStorage.setItem(LS_FLAG, '1');
            return true;
          }
        }
      } catch {}
      return false;
    }
  } catch {}
})();
