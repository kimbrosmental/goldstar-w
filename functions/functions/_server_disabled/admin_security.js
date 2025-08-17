// SECURITY_HARDENING feature flag 적용
const SECURITY_HARDENING = process.env.SECURITY_HARDENING === 'on';
if (!SECURITY_HARDENING) return;

const argon2 = require('argon2');
const crypto = require('crypto');
const fs = require('fs');

// Admin DB (메모리/파일 기반 예시)
const ADMIN_DB_PATH = './admin_db.json';
const IP_ALLOWLIST_PATH = './admin_ip_allowlist.json';
const AUDIT_LOG_PATH = './admin_audit_logs.json';
const APP_DATA_KEY = Buffer.from(process.env.APP_DATA_KEY, 'base64');

function loadJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return fallback; }
}
function saveJson(path, data) { fs.writeFileSync(path, JSON.stringify(data, null, 2)); }

// 암호화/복호화
function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', APP_DATA_KEY, iv);
  let enc = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  enc += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc };
}
function decrypt({ iv, tag, data }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', APP_DATA_KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  let dec = decipher.update(data, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return JSON.parse(dec);
}

// 관리자 계정 관리
const admins = loadJson(ADMIN_DB_PATH, []);
function createAdmin(username, password) {
  if (admins.length >= 3) throw new Error('최대 3개 계정만 생성 가능');
  if (!validatePassword(password)) throw new Error('비밀번호 정책 불일치');
  const hash = argon2.hash(password, { type: argon2.argon2id });
  admins.push({ id: admins.length+1, username, password_hash: hash, status: 'active', created_at: Date.now() });
  saveJson(ADMIN_DB_PATH, admins);
}
function validatePassword(pw) {
  return pw.length >= 10 && !/password|123456|qwerty/i.test(pw);
}
function changeAdminPassword(id, newPw) {
  const admin = admins.find(a => a.id === id);
  if (!admin) throw new Error('존재하지 않는 계정');
  if (!validatePassword(newPw)) throw new Error('비밀번호 정책 불일치');
  admin.password_hash = argon2.hash(newPw, { type: argon2.argon2id });
  admin.updated_at = Date.now();
  saveJson(ADMIN_DB_PATH, admins);
}
function disableAdmin(id) {
  const admin = admins.find(a => a.id === id);
  if (admin) { admin.status = 'disabled'; admin.updated_at = Date.now(); saveJson(ADMIN_DB_PATH, admins); }
}

// IP Allowlist 관리
const ipAllowlist = loadJson(IP_ALLOWLIST_PATH, []);
function addAllowIp(cidr, label) {
  ipAllowlist.push({ id: ipAllowlist.length+1, cidr, label, enabled: true, created_at: Date.now() });
  saveJson(IP_ALLOWLIST_PATH, ipAllowlist);
}
function removeAllowIp(id) {
  const idx = ipAllowlist.findIndex(ip => ip.id === id);
  if (idx >= 0) { ipAllowlist.splice(idx, 1); saveJson(IP_ALLOWLIST_PATH, ipAllowlist); }
}
function toggleAllowIp(id, enabled) {
  const ip = ipAllowlist.find(ip => ip.id === id);
  if (ip) { ip.enabled = enabled; saveJson(IP_ALLOWLIST_PATH, ipAllowlist); }
}

// 감사 로그
const auditLogs = loadJson(AUDIT_LOG_PATH, []);
function logAudit(event_type, actor, target, ip, ua, reason) {
  const payload = encrypt({ event_type, actor, target, ip, ua, reason });
  auditLogs.push({ id: auditLogs.length+1, event_type, actor, target, ip, ua, payload, created_at: Date.now() });
  saveJson(AUDIT_LOG_PATH, auditLogs);
}
function getAuditLogs(filter) {
  // filter: {event_type, actor, ip, dateRange}
  return auditLogs.filter(log => {
    if (filter.event_type && log.event_type !== filter.event_type) return false;
    if (filter.actor && log.actor !== filter.actor) return false;
    if (filter.ip && log.ip !== filter.ip) return false;
    if (filter.dateRange && (log.created_at < filter.dateRange[0] || log.created_at > filter.dateRange[1])) return false;
    return true;
  });
}
function exportAuditLogsCSV(filter) {
  const logs = getAuditLogs(filter);
  const rows = logs.map(log => {
    const dec = decrypt(log.payload);
    return `${log.id},${dec.event_type},${dec.actor},${dec.target},${dec.ip},${dec.ua},${dec.reason},${new Date(log.created_at).toISOString()}`;
  });
  return ['id,event_type,actor,target,ip,ua,reason,created_at', ...rows].join('\n');
}

module.exports = {
  createAdmin, changeAdminPassword, disableAdmin,
  addAllowIp, removeAllowIp, toggleAllowIp,
  logAudit, getAuditLogs, exportAuditLogsCSV,
  admins, ipAllowlist, auditLogs
};
