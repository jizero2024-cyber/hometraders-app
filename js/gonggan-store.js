// 공간제작소 페이지(/gonggan/) 전용 공유 DB 연결 — 우리 업무 앱(store-supabase.js)과 따로 (10/23 대표 "공간제작소 관련된 건 분리")
//   공간제작소 표(gonggan_sales · gonggan_docs)와 로그인만. 직원이 직접 등록할 때 쓰는 출고 번호·전표 찾기도 여기 —
//   공간제작소 계정은 DB 에서 막혀 있어(2026-10-23-gonggan-lockdown.sql) 빈 값만 받음.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
export const ID_DOMAIN = '@hometraders.local';

// ── 로그인 ──
// DB 정책 login_after_1430: 이 시각(10/25 14:30) 전에 받은 로그인 열쇠로는 자료가 0건으로 보임 → 그런 로그인은 끊고 로그인 화면으로 (10/25 대표 "내역이 다 삭제됐어")
const MIN_IAT = 1792906200;
const tokenIat = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).iat || 0; } catch { return 0; } };
export async function getSession() {
  const { data } = await sb.auth.getSession();
  const s = data.session;
  if (s && tokenIat(s.access_token) < MIN_IAT) {
    const { data: r } = await sb.auth.refreshSession().catch(() => ({ data: {} }));
    if (r && r.session && tokenIat(r.session.access_token) >= MIN_IAT) return r.session;
    await sb.auth.signOut().catch(() => {});
    return null;
  }
  return s;
}
export function onAuthChange(cb) { sb.auth.onAuthStateChange((_e, session) => cb(session)); }
export async function signIn(id, password) {
  const email = id.includes('@') ? id.trim() : id.trim().toLowerCase() + ID_DOMAIN;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signOut() { await sb.auth.signOut(); }

// ── 공간제작소 명세 (gonggan_sales · gonggan_docs) ──
const noTable = (e, what) => new Error(/does not exist|relation|schema cache|could not find/i.test(e.message) ? `공유 DB 에 ${what} 표가 아직 없어요.` : e.message);
export async function getGongganSales(biz) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const cols = 'id,ymd,slip,partner,name,qty,price,supply,vat,logi,reg,updated_at';
    let { data, error } = await sb.from('gonggan_sales').select(cols + ',board_no').eq('biz', biz).order('id').range(from, from + 999);   // board_no = 출고일보 출고번호 (10/26) — 칸이 아직 없으면 빼고 다시
    if (error && /board_no/.test(error.message)) ({ data, error } = await sb.from('gonggan_sales').select(cols).eq('biz', biz).order('id').range(from, from + 999));
    if (error) throw noTable(error, '공간제작소');
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}
// 올릴 전표 → 목록으로 (10/27 대표 "출고일보 체크해도 바로 안 돼") — 맥이 올려 둔 biz=homt_wait 줄('w:' id)을 biz=homt 줄로 넣고 대기 줄은 지움
export async function putWaitRows(rows, reg) {
  const live = rows.map((r) => ({ id: r.id.replace(/^w:/, ''), ymd: r.ymd, slip: r.slip, partner: r.partner, name: r.name, qty: r.qty, price: r.price, supply: r.supply, vat: r.vat,
    logi: r.logi || false, biz: 'homt', reg, updated_at: new Date().toISOString(), ...(r.board_no ? { board_no: r.board_no } : {}) }));
  const { error } = await sb.from('gonggan_sales').upsert(live, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  const { error: e2 } = await sb.from('gonggan_sales').delete().in('id', rows.map((r) => r.id));
  if (e2) throw new Error(e2.message);
}
export async function skipWait(slips, rowIds, who) {   // 올릴 전표 [빼기] — 이미 올라간 것 (10/27). 맥은 waitskip: 문서를 보고 다시 안 올림
  const now = new Date().toISOString();
  const { error } = await sb.from('gonggan_docs').upsert(slips.map((sl) => ({ id: `waitskip:${sl}`, biz: 'homt_wait', manual: { slip: sl }, updated_by: who, updated_at: now })), { onConflict: 'id' });
  if (error) throw new Error(error.message);
  const { error: e2 } = await sb.from('gonggan_sales').delete().in('id', rowIds);
  if (e2) throw new Error(e2.message);
}
export async function getGongganDocs(biz) {
  const cols = 'id,biz,status,tax_name,tax_no,manual,delivered,reason,drafted_at,updated_by,updated_at';
  let { data, error } = await sb.from('gonggan_docs').select(cols + ',paid').eq('biz', biz).limit(5000);   // paid = 입금일 (10/25) — 칸이 아직 없으면 빼고 다시
  if (error && /paid/.test(error.message)) ({ data, error } = await sb.from('gonggan_docs').select(cols).eq('biz', biz).limit(5000));
  if (error) throw new Error(error.message);
  return data || [];
}
export async function getGongganDocFull(id) {
  const { data, error } = await sb.from('gonggan_docs').select('tax_data,stmt_data').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data || {};
}
export async function saveGongganDoc(row) {   // 실패하면 글자, 되면 null
  const { error } = await sb.from('gonggan_docs').upsert(row);
  return error ? error.message : null;
}

// ── 직원 직접 등록용 — 출고 번호(공간제작소-261020-01)·전표 번호 → 판매전표 줄 ──
export async function getBoardSlips(nos) {
  if (!nos.length) return [];
  const { data, error } = await sb.from('board_slips').select('no,slips').in('no', nos);
  if (error) throw noTable(error, '출고 번호');
  return data || [];
}
export async function getSlipRowsBySlip(slips) {   // 같은 전표가 링크 둘로 올라온 것은 하나로
  if (!slips.length) return [];
  const { data, error } = await sb.from('slip_rows').select('kind,slip,partner,rows').in('slip', slips);
  if (error) throw new Error(error.message);
  const seen = new Set();
  return (data || []).filter((g) => { const k = `${g.kind}|${g.slip}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
export async function getSlipRowsByDrive(ids) {   // 출고일보 전표 링크(드라이브)
  if (!ids.length) return [];
  const { data, error } = await sb.from('slip_rows').select('drive_id,kind,slip,partner,rows').in('drive_id', ids);
  if (error) throw new Error(error.message);
  return data || [];
}
