/**
 * intro_fix.js
 * - Hides/removes intro/splash overlays
 * - Forces navigation from /intro(.html) -> /index.html after a timeout
 * - Never blocks on network; resilient to other script errors
 */
(function () {
  const MIN_SHOWN_MS = 800;   // 최소 표시 시간 (부드러운 페이드아웃용)
  const TIMEOUT_MS   = 5000;  // 최대 대기 시간 (강제 진행)
  const t0 = Date.now();
  let done = false;

  function qIntro() {
    return (
      document.getElementById('intro') ||
      document.querySelector('#splash, .splash, .intro, [data-intro]')
    );
  }

  function killIntro() {
    if (done) return;
    done = true;
    try {
      const el = qIntro();
      if (el) {
        el.style.transition = 'opacity .4s ease';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        setTimeout(() => {
          try { el.remove(); } catch {}
        }, 450);
      }
      const path = (location.pathname || '').toLowerCase();
      if (/\/intro(\.html)?$/.test(path)) {
        // intro 페이지였으면 메인으로 이동
        location.replace('/index.html');
      }
      document.documentElement.classList.remove('intro-active');
    } catch {}
  }

  // 스킵 버튼이 있다면 즉시 종료
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches('#skip-intro, .skip-intro, [data-skip-intro]')) {
      killIntro();
    }
  });

  // window load 후 최소 표시시간 보장 뒤 종료
  window.addEventListener('load', () => {
    const remain = Math.max(0, MIN_SHOWN_MS - (Date.now() - t0));
    setTimeout(killIntro, remain);
  });

  // 어떤 이유로 load가 안 오더라도 TIMEOUT_MS 뒤에는 강제 종료
  setTimeout(killIntro, TIMEOUT_MS);

  // 혹시 초기 상태에서 intro를 알리기 위해 클래스가 붙는 경우 정리
  document.documentElement.classList.add('intro-active');
})();
