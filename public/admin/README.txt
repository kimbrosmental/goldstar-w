관리자 어드민 모듈 구조
- index.html: 관리자 SPA 진입점
- dashboard.js: SPA 라우팅 및 메뉴 처리
- dashboard.css: 관리자 UI 스타일(기존 사이트와 일치)

기능별 구현은 각 영역별 JS/HTML 분리 예정
- 회원관리(users), 주문관리(orders), 문의관리(inquiries), 보안/설정(security)
- 인증/권한/암호화/감사로그 등은 별도 모듈로 추가

feature flag(ADMIN_MODULE=on)로 활성화/비활성화 가능
