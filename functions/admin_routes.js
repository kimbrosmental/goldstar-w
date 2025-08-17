// SECURITY_HARDENING feature flag 적용
const SECURITY_HARDENING = process.env.SECURITY_HARDENING === 'on';
if (!SECURITY_HARDENING) return;

const express = require('express');
const router = express.Router();
const adminSec = require('./admin_security');

// 미들웨어: IP Allowlist, 세션, 권한 체크
function ipAllowlistMiddleware(req, res, next) {
  const clientIp = req.headers['cf-connecting-ip'] || req.ip;
  const allowed = adminSec.ipAllowlist.some(ip => ip.enabled && matchCidr(clientIp, ip.cidr));
  if (!allowed) return res.status(403).send('관리자 접근 허용 IP가 아닙니다');
  next();
}
function matchCidr(ip, cidr) {
  // 간단한 IPv4 CIDR 매칭 (실제 배포시 라이브러리 사용 권장)
  if (!cidr.includes('/')) return ip === cidr;
  const [base, bits] = cidr.split('/');
  const ipNum = ipToNum(ip), baseNum = ipToNum(base);
  return (ipNum >> (32 - bits)) === (baseNum >> (32 - bits));
}
function ipToNum(ip) { return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0); }

function sessionMiddleware(req, res, next) {
  // 세션/쿠키 체크 (실제 배포시 express-session 등 사용)
  if (!req.session || !req.session.adminId) return res.status(401).send('관리자 인증 필요');
  next();
}
function adminAuthMiddleware(req, res, next) {
  // 관리자 권한 체크
  const admin = adminSec.admins.find(a => a.id === req.session.adminId && a.status === 'active');
  if (!admin) return res.status(403).send('관리자 권한 없음');
  next();
}

// 라우트
router.post('/admin/login', (req, res) => {
  // 로그인 처리
  // ... (비밀번호 검증, 세션 발급, 감사 로그 기록 등)
  res.send('로그인 처리');
});
router.get('/admin', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  res.send('관리자 대시보드');
});
router.get('/admin/security/admins', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  res.json(adminSec.admins);
});
router.post('/admin/security/admins', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  // 관리자 계정 생성/비활성/비번변경
  res.send('관리자 계정 관리');
});
router.get('/admin/security/ip-allowlist', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  res.json(adminSec.ipAllowlist);
});
router.post('/admin/security/ip-allowlist', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  // 허용 IP 추가/삭제/토글
  res.send('IP 허용 목록 관리');
});
router.get('/admin/logs', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  res.json(adminSec.getAuditLogs(req.query));
});
router.get('/admin/logs/export', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  const csv = adminSec.exportAuditLogsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});
router.get('/admin/logs/:id', ipAllowlistMiddleware, sessionMiddleware, adminAuthMiddleware, (req, res) => {
  const log = adminSec.auditLogs.find(l => l.id === parseInt(req.params.id));
  res.json(log);
});

module.exports = router;
