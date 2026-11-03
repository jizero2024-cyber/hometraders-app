// 직원 전용 표 site_inbox 한 줄 읽기 — 큰 자료(통화 전문 · 단가표)는 누를 때만 (11/03)
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const memo = {};
function token() {
  try { const k = Object.keys(localStorage).find((x) => /^sb-.*-auth-token$/.test(x)); return k ? JSON.parse(localStorage.getItem(k)).access_token : ''; } catch (_) { return ''; }
}
export function inboxBody(id, fresh) {
  if (!fresh && memo[id]) return memo[id];
  memo[id] = fetch(`${SUPABASE_URL}/rest/v1/site_inbox?id=eq.${encodeURIComponent(id)}&select=body,updated_at`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token() || SUPABASE_KEY}` } })
    .then((r) => r.json()).then((j) => (Array.isArray(j) && j[0] ? JSON.parse(j[0].body || 'null') : null))
    .catch((e) => { delete memo[id]; throw e; });
  return memo[id];
}
