// 뉴하우징 페이지(/newhousing/) 전용 공유 DB 연결 — 우리 업무 앱(store-supabase.js)과 따로 (공간제작소 gonggan-store.js 와 같은 방식, 10/28)
//   뉴하우징 표(nh_sales · nh_docs · nh_sites)와 로그인만. 뉴하우징 계정은 DB 규칙(2026-10-28-newhousing.sql)으로 이 세 표 말고는 못 봄.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
export const ID_DOMAIN = '@hometraders.local';

export async function getSession() { const { data } = await sb.auth.getSession(); return data.session; }
export function onAuthChange(cb) { sb.auth.onAuthStateChange((_e, session) => cb(session)); }
export async function signIn(id, password) {
  const { error } = await sb.auth.signInWithPassword({ email: id.trim().toLowerCase() + ID_DOMAIN, password });
  if (error) throw error;
}
export async function signOut() { await sb.auth.signOut(); }
export async function myAccess() {   // {staff, partner, role} — DB(보안 1단계)가 정함
  const { data, error } = await sb.rpc('my_access');
  return error ? null : data;
}

const noTable = (e) => new Error(/does not exist|relation|schema cache|could not find/i.test(e.message) ? '공유 DB 에 뉴하우징 표가 아직 없어요.' : e.message);
export async function getSales() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('nh_sales').select('id,ymd,slip,partner,name,qty,price,supply,vat,site,reg,updated_at').order('id').range(from, from + 999);
    if (error) throw noTable(error);
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}
export async function getSites() {
  const { data, error } = await sb.from('nh_sites').select('id,set_name,span,order_file,rows,sj,updated_at').limit(1000);
  if (error) throw noTable(error);
  return data || [];
}
export async function getDocs() {
  const { data, error } = await sb.from('nh_docs').select('id,status,tax_name,tax_no,reason,manual,paid,drafted_at,updated_by,updated_at').limit(5000);
  if (error) throw noTable(error);
  return data || [];
}
export async function getDocFull(id) {
  const { data, error } = await sb.from('nh_docs').select('tax_data,stmt_data').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data || {};
}
export async function saveDoc(row) {   // 실패하면 글자, 되면 null
  const { error } = await sb.from('nh_docs').upsert(row);
  return error ? error.message : null;
}
