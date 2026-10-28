// 공유 DB(Supabase) 기반 store — 화면 코드는 그대로(동기 읽기).
// 초기 1회 로드→메모리 캐시, 변경은 Supabase upsert + 실시간 동기화.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';
import { seedItems, seedWarehouses, seedPartners } from './data.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let items = [], shipments = [], warehouses = [], partners = [], inbounds = [], quotes = [];
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach((fn) => fn()); }

let _id = 0;
const nid = (p) => `${p}_${Date.now().toString(36)}_${(_id++).toString(36)}`;
const num = (v) => Number(v) || 0;

// ── 저장 래퍼 ─────────────────────────────────────────
// 숫자 컬럼에 빈 문자열('') 등이 들어가 upsert가 거부되던 문제 방지 + 실패를 조용히 넘기지 않고 알림.
const NUMFIELDS = {
  items: ['initial', 'perBox', 'unitPrice'],
  shipments: ['qty', 'freight', 'courierFee'],
  inbounds: ['qty', 'perBox', 'unitPrice'],
};
const errListeners = new Set();
export function onError(fn) { errListeners.add(fn); return () => errListeners.delete(fn); }
function put(tbl, row) {
  const clean = (r) => { const o = { ...r }; (NUMFIELDS[tbl] || []).forEach((k) => { if (o[k] !== undefined && o[k] !== null && o[k] !== '') o[k] = num(o[k]); else if (o[k] === '') o[k] = 0; }); return o; };
  const payload = Array.isArray(row) ? row.map(clean) : clean(row);
  return sb.from(tbl).upsert(payload).then(({ error }) => {
    if (error) { console.error('[저장 실패]', tbl, error.message, payload); errListeners.forEach((fn) => fn(error.message)); }
    return { error };
  });
}
// 삭제 — 실패(RLS 삭제정책 없음 등)를 조용히 넘기지 않고 알림
function del(tbl, col, val) {
  return sb.from(tbl).delete().eq(col, val).then(({ error }) => {
    if (error) { console.error('[삭제 실패]', tbl, error.message); errListeners.forEach((fn) => fn('삭제 실패: ' + error.message + '\n(Supabase 삭제 권한/정책 확인 필요)')); }
    return { error };
  });
}

// ── 초기 로드 + 최초 시드 + 실시간 ─────────────────────
// init()은 토큰 갱신(onAuthChange) 등으로 여러 번 불릴 수 있어 중복/동시 호출을 막는다.
// 실패하면 promise를 비워 다음 재시도를 허용, 성공하면 캐시된 promise를 재사용.
let _initPromise = null;
export function init() {
  if (_initPromise) return _initPromise;
  _initPromise = _init().catch((e) => { _initPromise = null; throw e; });
  return _initPromise;
}
// 기기 시계와 Supabase 서버 시간 차이(clock skew)로 나는 일시적 JWT 오류
// ("JWT issued at future", "token used before issued" 등)는 세션 새로고침 + 짧은 대기 후
// 재시도하면 대부분 사라짐. 사용자에겐 "연결 오류"를 바로 띄우지 않고 조용히 몇 번 재시도.
const isAuthSkewError = (e) => {
  const m = ((e && (e.message || e.msg || e.error_description)) || '').toLowerCase();
  return m.includes('jwt') || m.includes('issued at') || m.includes('before issued')
    || m.includes('token is expired') || m.includes('exp') && m.includes('claim');
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function _init() {
  let w, p, i, n, s, q;
  for (let attempt = 0; ; attempt++) {
    [w, p, i, n, s, q] = await Promise.all([
      sb.from('warehouses').select('*'),
      sb.from('partners').select('*'),
      sb.from('items').select('*'),
      sb.from('inbounds').select('*'),
      sb.from('shipments').select('*'),
      sb.from('quotes').select('*'),
    ]);
    const err = [w, p, i, n, s, q].find((r) => r.error);
    if (!err || !err.error) break;
    // 인증/시계 오차성 오류면 세션 새로고침 후 재시도(최대 3회), 그 외엔 즉시 실패
    if (attempt < 3 && isAuthSkewError(err.error)) {
      try { await sb.auth.refreshSession(); } catch (_) { /* 무시하고 재시도 */ }
      await wait(600 * (attempt + 1));
      continue;
    }
    throw err.error;
  }
  warehouses = w.data || []; partners = p.data || []; items = i.data || [];
  inbounds = n.data || []; shipments = s.data || []; quotes = q.data || [];

  if (!warehouses.length) { warehouses = seedWarehouses(); await put('warehouses', warehouses); }
  if (!items.length) { items = seedItems(); await put('items', items); }
  if (!partners.length) { partners = seedPartners(); await put('partners', partners); }

  setupRealtime();
  notify();
  loadPrevPrices();   // 종전가 표는 따로 — 표가 아직 없어도 로그인·화면은 그대로
  loadItemMap();      // 품목 매핑 사전도 따로 (공개 코드에서 뺀 거래처 표기)
}
// ── 품목 매핑 사전 (item_map) — [거래처, 거래처표기, 우리품목명, 규격] ──
// 10/7부터 사전은 이 표 하나(도우미·ERP·자동화가 같이 씀). 확인 기다리는 제안은 item_map_suggest 에 따로 있어 여기선 안 읽음.
let itemMap = [];
let itemRows = [];
let itemMapState = { ready: false, missing: false, err: '' };
const mapRows = (rows) => rows.filter((r) => (r.status || '확정') === '확정' && r.ours)
  .sort((a, b) => String(a.partner).localeCompare(String(b.partner)) || String(a.raw).localeCompare(String(b.raw)))
  .map((r) => [r.partner || '', r.raw || '', r.ours || '', r.spec || '']);
async function loadItemMap() {
  try {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from('item_map').select('*').range(from, from + 999);
      if (error) {
        itemMapState = { ready: false, missing: /does not exist|relation|schema cache|could not find/i.test(error.message), err: error.message };
        notify(); return;
      }
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    itemRows = all;
    itemMap = mapRows(all);
    itemMapState = { ready: true, missing: false, err: '' };
  } catch (e) {
    itemMapState = { ready: false, missing: false, err: String((e && e.message) || e) };
  }
  notify();
}
export const getItemMap = () => itemMap;
const nfc = (s) => String(s || '').normalize('NFC').trim();
const squash = (s) => nfc(s).replace(/\s+/g, '').toUpperCase();
const head4 = (s) => squash(String(s || '').replace(/\(주\)|주식회사|㈜/g, '')).slice(0, 4);   // '(주)OO'·'OO' 를 같은 거래처로
async function sha16(s) {
  const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
// 사람이 고른 매핑을 공유 사전에 바로 저장 (도우미 없이도 · 어느 PC에서든). items: [{raw, spec, ours, code}]
// 같은 거래처(앞 네 글자)·표기·규격 줄이 이미 있으면 그 줄을 고침 → 같은 표기에 답이 둘 생기지 않게.
export async function saveItemMap(partner, items, by = '') {
  const rows = [];
  for (const it of items) {
    const raw = nfc(it.raw), spec = nfc(it.spec);
    if (!raw || !it.ours) continue;
    const ex = itemRows.find((r) => squash(r.raw) === squash(raw) && squash(r.spec) === squash(spec) && head4(r.partner) === head4(partner));
    const p = ex ? ex.partner : nfc(partner);
    const id = ex ? ex.id : await sha16(`${p}|${raw}` + (spec ? `|${spec}` : ''));
    rows.push({ id, partner: p, raw, spec, ours: nfc(it.ours), code: it.code || '', status: '확정',
      src: 'ERP 화면에서 고름', confirmed_by: by, updated_at: new Date().toISOString() });
  }
  if (!rows.length) return 0;
  const { error } = await sb.from('item_map').upsert(rows);
  if (error) throw new Error(error.message);
  for (const r of rows) itemRows = itemRows.filter((x) => x.id !== r.id).concat([{ ...(itemRows.find((x) => x.id === r.id) || {}), ...r }]);
  itemMap = mapRows(itemRows);
  notify();
  return rows.length;
}
export const getItemMapState = () => ({ ...itemMapState, count: itemMap.length });
// ── 종전가 표 (prev_prices) — 도우미가 켜진 맥이 견적서 종전가를 올리고, 다른 PC는 읽기만 ──
let prevPrices = [];
let prevState = { ready: false, missing: false, err: '' };
async function loadPrevPrices() {
  try {
    const all = [];
    for (let from = 0; ; from += 1000) {   // 한 번에 최대 1000줄이라 나눠 받음
      const { data, error } = await sb.from('prev_prices').select('*').range(from, from + 999);
      if (error) {
        prevState = { ready: false, missing: /does not exist|relation|schema cache|could not find/i.test(error.message), err: error.message };
        notify(); return;
      }
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    prevPrices = all; prevState = { ready: true, missing: false, err: '' };
  } catch (e) {
    prevState = { ready: false, missing: false, err: String((e && e.message) || e) };
  }
  notify();
}
export const getPrevPrices = () => prevPrices;
export const getPrevState = () => ({ ...prevState, count: prevPrices.length });
export async function savePrevPrices(rows) {   // 견적서 원래 줄 → 바뀐 줄만 올리고 견적서에서 없어진 줄은 지움 → 다시 읽음
  const cur = new Map(prevPrices.map((r) => [r.id, r]));
  const same = (a, b) => ['partner', 'raw', 'spec', 'unit', 'date', 'file'].every((k) => String(a[k] ?? '') === String(b[k] ?? '')) && Number(a.price) === Number(b.price) && Number(a.saved) === Number(b.saved);
  const changed = rows.filter((r) => !cur.has(r.id) || !same(cur.get(r.id), r));
  const keep = new Set(rows.map((r) => r.id));
  const gone = prevPrices.filter((r) => !keep.has(r.id)).map((r) => r.id);
  for (let i = 0; i < changed.length; i += 500) {
    const { error } = await put('prev_prices', changed.slice(i, i + 500).map((r) => ({ ...r, updated_at: new Date().toISOString() })));
    if (error) return { error, changed: 0, removed: 0 };
  }
  for (let i = 0; i < gone.length; i += 100) {
    const { error } = await sb.from('prev_prices').delete().in('id', gone.slice(i, i + 100));
    if (error) return { error, changed: changed.length, removed: 0 };
  }
  if (changed.length || gone.length) await loadPrevPrices();
  return { error: null, changed: changed.length, removed: gone.length };
}
// ── 대화 화면 작업 기록 (chat_jobs) — 어느 컴퓨터에서 열어도 같은 기록. 표가 없으면 화면은 이 브라우저 기록만 씀 ──
let chatJobs = [];
let chatState = { ready: false, missing: false, err: '', at: 0, busy: false };
export async function loadChatJobs() {
  if (chatState.busy) return chatState;
  chatState.busy = true;
  try {
    const { data, error } = await sb.from('chat_jobs').select('id,data,created_by,updated_at').order('updated_at', { ascending: false }).limit(200);
    if (error) chatState = { ready: false, missing: /does not exist|relation|schema cache|could not find/i.test(error.message), err: error.message, at: Date.now(), busy: false };
    else { chatJobs = (data || []).map((r) => ({ ...(r.data || {}), id: r.id, by: r.created_by || (r.data || {}).by || '', updated: Date.parse(r.updated_at) || 0 })); chatState = { ready: true, missing: false, err: '', at: Date.now(), busy: false }; }
  } catch (e) { chatState = { ready: false, missing: false, err: String((e && e.message) || e), at: Date.now(), busy: false }; }
  return chatState;
}
export const getChatJobs = () => chatJobs;
export const getChatState = () => ({ ...chatState });
export async function saveChatJob(job) {   // 실패해도 알림창 없이 결과만 돌려줌 (화면은 이 브라우저 기록으로 계속)
  if (!chatState.ready) return { error: { message: chatState.err || '작업 기록 표 없음' } };
  const { error } = await sb.from('chat_jobs').upsert({ id: job.id, title: job.title || '', mode: job.mode || '', data: job, created_by: job.by || '', updated_at: new Date(job.updated || Date.now()).toISOString() });
  if (error) console.error('[작업 기록 저장 실패]', error.message);
  return { error };
}
export async function deleteChatJob(id) {
  if (!chatState.ready) return { error: null };
  const { error } = await sb.from('chat_jobs').delete().eq('id', id);
  if (error) console.error('[작업 기록 삭제 실패]', error.message);
  return { error };
}
// ── 출고일보 전표 링크 → 전표 줄 (slip_rows) — 맥 도우미가 이카운트 전표 PDF 를 읽어 올려 둔 것. 도우미 없이 거래명세표 만들 때 ──
export async function getSlipRows(ids) {
  if (!ids.length) return [];
  const { data, error } = await sb.from('slip_rows').select('drive_id,kind,slip,partner,file,rows,warn').in('drive_id', ids);
  if (error) throw new Error(/does not exist|relation|schema cache|could not find/i.test(error.message) ? '공유 DB 에 전표 표(slip_rows)가 아직 없어요.' : error.message);
  return data || [];
}
// 출고일보 번호(공간제작소-261020-01) → 판매전표 번호 (board_slips — 맥 도우미가 출고일보 입력 칸에서 올림, 10/23)
export async function getBoardSlips(nos) {
  if (!nos.length) return [];
  const { data, error } = await sb.from('board_slips').select('no,slips,partner,ymd').in('no', nos);
  if (error) throw new Error(/does not exist|relation|schema cache|could not find/i.test(error.message) ? '공유 DB 에 출고 번호 표(board_slips)가 아직 없어요.' : error.message);
  return data || [];
}
export async function getSlipRowsBySlip(slips) {   // 전표 번호(20261020-3)로 — 같은 전표가 링크 둘로 올라온 것은 하나로
  if (!slips.length) return [];
  const { data, error } = await sb.from('slip_rows').select('kind,slip,partner,file,rows,warn').in('slip', slips);
  if (error) throw new Error(error.message);
  const seen = new Set();
  return (data || []).filter((g) => { const k = `${g.kind}|${g.slip}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
// ── 공간제작소 BMS (gonggan_sales · gonggan_docs, 2026-10-23) ──
export async function getGongganSales(biz) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('gonggan_sales').select('id,ymd,slip,partner,name,qty,price,supply,vat').eq('biz', biz).order('id').range(from, from + 999);
    if (error) throw new Error(/does not exist|relation|schema cache|could not find/i.test(error.message) ? '공유 DB 에 공간제작소 표가 아직 없어요.' : error.message);
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}
export async function getGongganDocs(biz) {
  const { data, error } = await sb.from('gonggan_docs').select('id,biz,status,tax_name,tax_no,reason,drafted_at,updated_by,updated_at').eq('biz', biz).limit(5000);
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
// ── 새 첫 화면 (site_inbox · fare_unpaid, 2026-10-23) ──
const noTable = (e, what) => new Error(/does not exist|relation|schema cache|could not find/i.test(e.message) ? `공유 DB 에 ${what} 표가 아직 없어요.` : e.message);
export async function getFareUnpaid() {
  const { data, error } = await sb.from('fare_unpaid').select('id,section,sort,urgent,driver,phone,job,amount,bank,account,holder,todo,note,sent').order('sort');
  if (error) throw noTable(error, '운임');
  return data || [];
}
export async function markFareSent(id, by) {   // 실패하면 글자, 되면 null — 도우미가 엑셀 '보냄' 칸에 O
  const { error } = await sb.from('fare_unpaid').update({ sent: true, sent_by: by, sent_at: new Date().toISOString() }).eq('id', id);
  return error ? error.message : null;
}
export async function getGongganWaitCount() {   // 공간 올릴 전표 수 (10/27) — 맥이 올려 둔 올릴 전표 수
  const { count, error } = await sb.from('site_inbox').select('id', { count: 'exact', head: true }).eq('kind', 'gwait').eq('status', 'gwait');   // 직원 전용 표 (10/27)
  if (error) throw new Error(error.message);
  return count || 0;
}
export async function getFlowBoard() {   // 첫 화면 '출고 흐름' (10/28) — 맥 도우미 flow_board.py 가 출고일보 줄을 단계별로 올림 (직원 전용 표)
  const { data, error } = await sb.from('site_inbox').select('body,updated_at').eq('id', 'flow:board').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  try { return JSON.parse(data.body || '{}'); } catch (_) { return null; }
}
export async function getFlowMarks() {   // 출고 흐름에서 누른 표시 — 거래명세표 전달함 (10/28 대표) · site_inbox kind 'flowmark' (직원 전용 표)
  const { data, error } = await sb.from('site_inbox').select('id,name,created_by,created_at').eq('kind', 'flowmark');
  if (error) throw new Error(error.message);
  return (data || []).reduce((a, r) => { a[r.id] = r; return a; }, {});
}
export async function addFlowMark(id, name, by) {
  const { error } = await sb.from('site_inbox').upsert({ id, kind: 'flowmark', status: 'mark', name, created_by: by || null });
  return error ? error.message : null;
}
export async function getSlipLinks(slips) {   // 전표 번호(20261027-3) → 이카운트 전표 PDF 드라이브 링크
  if (!slips.length) return {};
  const { data, error } = await sb.from('slip_rows').select('drive_id,slip,kind').in('slip', slips);
  if (error) throw new Error(error.message);
  return (data || []).reduce((a, r) => { (a[r.slip] = a[r.slip] || []).push(r); return a; }, {});
}
export async function getInboxCounts() {
  const { data, error } = await sb.from('site_inbox').select('status').neq('kind', 'read').in('status', ['wait', 'got', 'check']);   // 'read' = 사진 읽기 부탁 (자료 아님)
  if (error) throw noTable(error, '자료');
  return (data || []).reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
}
export async function listSongjang() {   // 발행한 송장 목록 (10/27) — 서명 그림은 빼고
  const { data, error } = await sb.from('e_songjang').select('id,code,partner,site,ymd,items,checks,signer,signed_at,opened_at,last_opened_at,open_count,checked_at,created_by,created_at').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(/does not exist|relation|schema cache|column/i.test(error.message) ? '전자 송장 표가 아직 없어요 (SQL 실행 필요)' : error.message);
  return data || [];
}
export async function getSongjangSign(id) {
  const { data, error } = await sb.from('e_songjang').select('sign').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data || {}).sign || '';
}
export async function addSongjang(row) {   // 전자 송장 한 장 (10/26) — 실패하면 글자, 되면 null
  const { error } = await sb.from('e_songjang').insert(row);
  return error ? error.message : null;
}
// 사진·PDF 읽기를 인터넷 서버(Edge Function doc-read)에서 — 맥이 꺼져 있어도 (10/27 대표). 서버가 아직 없거나 막히면 throw → 맥으로
async function shrinkB64(name, data) {   // 큰 사진은 긴 변 2400px JPEG 로 (AI 사진 한도)
  if (/\.pdf$/i.test(name) || data.length < 3e6) return { data, mime: /\.pdf$/i.test(name) ? 'application/pdf' : /\.png$/i.test(name) ? 'image/png' : 'image/jpeg' };
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/*;base64,' + data; });
  const k = Math.min(1, 2400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.88).split(',')[1], mime: 'image/jpeg' };
}
export async function readDocCloud(name, data) {
  const f = await shrinkB64(name || '', data);
  const { data: j, error } = await sb.functions.invoke('doc-read', { body: { name, ...f } });
  if (error) { let m = error.message; try { const b = await error.context.json(); m = b.error || m; } catch (_) { /* 그대로 */ } throw new Error(m); }
  if (!j || !j.ok) throw new Error((j && j.error) || '서버에서 읽지 못했어요');
  return j;
}
// 사무실 맥 도우미에 바로 못 닿을 때(다른 컴퓨터·폰·사파리) — site_inbox 에 'read' 로 올리면 맥 도우미가 읽고 note 에 결과 (10/27 대표)
export async function relayHelper(path, body, by) {
  const id = 'read_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const { error } = await sb.from('site_inbox').insert({ id, kind: 'read', name: (body && body.name) || path, status: 'wait', body: JSON.stringify({ path, body }), created_by: by || null });
  if (error) throw new Error(error.message);
  const t0 = Date.now();
  try {
    while (Date.now() - t0 < 240000) {
      await new Promise((ok) => setTimeout(ok, 1500));
      const { data } = await sb.from('site_inbox').select('status,note').eq('id', id).maybeSingle();
      if (data && (data.status === 'done' || data.status === 'check')) {
        let j; try { j = JSON.parse(data.note || '{}'); } catch (_) { j = { ok: false, error: '결과를 읽지 못했어요' }; }
        if (!j.ok) throw new Error(j.error || '읽지 못했어요');
        return j;
      }
      if (data && data.status === 'wait' && Date.now() - t0 > 30000) throw new Error('사무실 맥이 꺼져 있거나 도우미가 안 돌아요');
    }
    throw new Error('사무실 맥이 너무 오래 걸려요');
  } finally { sb.from('site_inbox').delete().eq('id', id).then(() => {}); }
}
export async function addInbox(row) {   // 실패하면 글자, 되면 null
  const { error } = await sb.from('site_inbox').insert(row);
  return error ? error.message : null;
}
// 실시간 구독은 딱 1회만. 이미 붙은 채널이 있으면 제거 후 재구독(재진입 안전) →
// "cannot add postgres_changes callbacks after subscribe()" 방지.
let _realtimeOn = false;
function setupRealtime() {
  if (_realtimeOn) return;
  _realtimeOn = true;
  ['warehouses', 'partners', 'items', 'inbounds', 'shipments', 'quotes'].forEach((tbl) => {
    const topic = 'rt_' + tbl;
    sb.getChannels().filter((c) => c.topic === 'realtime:' + topic).forEach((c) => sb.removeChannel(c));
    sb.channel(topic).on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => refetch(tbl)).subscribe();
  });
}
async function refetch(tbl) {
  const { data } = await sb.from(tbl).select('*');
  if (!data) return;
  if (tbl === 'warehouses') warehouses = data;
  else if (tbl === 'partners') partners = data;
  else if (tbl === 'items') items = data;
  else if (tbl === 'inbounds') inbounds = data;
  else if (tbl === 'shipments') shipments = data;
  else if (tbl === 'quotes') quotes = data;
  notify();
}

// ── 조회 ────────────────────────────────────────────
export const getItems = () => items.slice();
export const getShipments = () => shipments.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
export function findItem(id) { return items.find((x) => x.id === id); }

export function shipLines(s) {
  return (s.lines && s.lines.length) ? s.lines
    : [{ name: s.name, category: s.category, spec: s.spec || '', unit: s.unit, qty: s.qty, unitPrice: s.unitPrice || 0 }];
}
export function shippedQty(item, status) {
  return shipments.filter((s) => s.warehouse === item.warehouse && s.name === item.name && s.status === status)
    .reduce((sum, s) => sum + num(s.qty), 0);
}
function outBase(item, status) {
  const pb = num(item.perBox);
  return shipments.filter((s) => s.warehouse === item.warehouse && s.status === status)
    .reduce((sum, s) => sum + shipLines(s).filter((l) => l.name === item.name)
      .reduce((a, l) => a + ((l.unit === '낱개' && pb > 0) ? num(l.qty) / pb : num(l.qty)), 0), 0);
}
export function reservedQty(item) { return outBase(item, '출고예정') + outBase(item, '배차완료'); }
export function inboundQty(item) {
  return inbounds.filter((r) => r.warehouse === item.warehouse && r.category === item.category && r.name === item.name)
    .reduce((sum, r) => sum + num(r.qty), 0);
}
export function currentStock(item) { return num(item.initial) + inboundQty(item) - outBase(item, '출고완료'); }
export function stockParts(item) {
  const cur = currentStock(item); const pb = num(item.perBox);
  if (pb > 0) {
    const whole = Math.floor(cur + 1e-9); const loose = Math.round((cur - whole) * pb);
    if (loose >= pb) return { whole: whole + 1, loose: 0, unit: item.unit };
    return { whole, loose, unit: item.unit };
  }
  return { whole: Math.round(cur), loose: 0, unit: item.unit };
}
export function stockStatus(item) { const c = currentStock(item); return c <= 0 ? 'out' : (c <= 10 ? 'low' : 'ok'); }

// ── 품목 CRUD ──────────────────────────────────────
export function addItem(o) {
  const it = { id: nid('it'), warehouse: o.warehouse, category: o.category, name: (o.name || '').trim(),
    unit: o.unit, initial: num(o.initial), note: o.note || '', perBox: num(o.perBox), unitPrice: num(o.unitPrice), supplier: o.supplier || '', aliases: o.aliases || '' };
  items.push(it); put('items', it); notify();
}
export function updateItem(id, patch) {
  const it = findItem(id); if (!it) return;
  Object.assign(it, patch); if (patch.initial != null) it.initial = num(patch.initial);
  put('items', it); notify();
}
export function deleteItem(id) { items = items.filter((x) => x.id !== id); del('items', 'id', id); notify(); }
// 현재고를 실사 수량(target)으로 맞춤 — 초기재고를 보정(입고·출고완료는 그대로 유지)
export function setStock(id, target) {
  const it = findItem(id); if (!it) return;
  it.initial = num(it.initial) + (num(target) - currentStock(it));
  put('items', it); notify();
}

// ── 출고 CRUD ──────────────────────────────────────
export function addShipment(o) {
  const lines = (o.lines && o.lines.length)
    ? o.lines.map((l) => ({ name: (l.name || '').trim(), category: l.category || o.category || '', spec: l.spec || '', unit: l.unit || '', qty: num(l.qty), unitPrice: num(l.unitPrice) })) : null;
  const first = lines ? lines[0] : null;
  const sh = { id: nid('sh'), date: o.date, time: o.time || '', warehouse: o.warehouse,
    category: first ? first.category : (o.category || ''), name: first ? first.name : (o.name || ''),
    qty: first ? first.qty : num(o.qty), unit: first ? first.unit : (o.unit || ''), lines: lines || [],
    client: o.client || '', status: o.status || '출고완료', note: o.note || '',
    dispatchVia: o.dispatchVia || '', driverName: o.driverName || '', driverPhone: o.driverPhone || '', vehicle: o.vehicle || '',
    freight: num(o.freight), payment: o.payment || '', docDone: !!o.docDone,
    loadPlace: o.loadPlace || '', loadAddr: o.loadAddr || '', unloadPlace: o.unloadPlace || '', unloadAddr: o.unloadAddr || '',
    method: o.method || '배차', courier: o.courier || '', trackingNo: o.trackingNo || '', courierFee: num(o.courierFee),
    recvName: o.recvName || '', recvPhone: o.recvPhone || '', recvAddr: o.recvAddr || '' };
  shipments.push(sh); put('shipments', sh); notify(); return sh;
}
export function updateShipment(id, patch) {
  const sh = shipments.find((x) => x.id === id); if (!sh) return;
  Object.assign(sh, patch); if (patch.qty != null) sh.qty = num(patch.qty);
  put('shipments', sh); notify();
}
export function deleteShipment(id) { shipments = shipments.filter((x) => x.id !== id); del('shipments', 'id', id); notify(); }

// ── 입고 ────────────────────────────────────────────
export const getInbounds = () => inbounds.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
export function addInbound(o) {
  const rec = { id: nid('in'), date: o.date, warehouse: o.warehouse, category: o.category, name: o.name,
    qty: num(o.qty), unit: o.unit || '', perBox: num(o.perBox), unitPrice: num(o.unitPrice), vatSeparate: !!o.vatSeparate, supplier: o.supplier || '', note: o.note || '' };
  inbounds.push(rec); put('inbounds', rec);
  let it = items.find((x) => x.warehouse === o.warehouse && x.category === o.category && x.name === o.name);
  if (it) { if (rec.perBox) it.perBox = rec.perBox; if (rec.unitPrice) it.unitPrice = rec.unitPrice; if (rec.supplier) it.supplier = rec.supplier; put('items', it); }
  else {
    // 그 창고에 품목 레코드가 없으면 새로 생성 (재고 0에서 시작 → 이 입고분이 곧 재고)
    // ※ items 테이블엔 vatSeparate 컬럼이 없으므로 넣지 않는다
    it = { id: nid('it'), warehouse: o.warehouse, category: o.category, name: o.name, unit: rec.unit || '',
      initial: 0, note: '', perBox: rec.perBox, unitPrice: rec.unitPrice, supplier: rec.supplier || '', aliases: '' };
    items.push(it); put('items', it);
  }
  notify(); return rec;
}
export function deleteInbound(id) { inbounds = inbounds.filter((x) => x.id !== id); del('inbounds', 'id', id); notify(); }

// ── 창고 ────────────────────────────────────────────
export const getWarehouses = () => warehouses.slice();
export const warehouseNames = () => warehouses.map((w) => w.name);
export function addWarehouse(name, icon) {
  const nm = (name || '').trim(); if (!nm || warehouses.some((w) => w.name === nm)) return false;
  const w = { name: nm, icon: icon || 'warehouse', address: '', phone: '' }; warehouses.push(w); put('warehouses', w); notify(); return true;
}
export function setWarehouseIcon(name, icon) { const w = warehouses.find((x) => x.name === name); if (w) { w.icon = icon; put('warehouses', w); notify(); } }
export function setWarehouseInfo(name, patch) { const w = warehouses.find((x) => x.name === name); if (w) { Object.assign(w, patch); put('warehouses', w); notify(); } }
export function renameWarehouse(oldName, newName) {
  const nm = (newName || '').trim(); if (!nm) return false;
  if (warehouses.some((w) => w.name === nm && w.name !== oldName)) return false;
  const w = warehouses.find((x) => x.name === oldName); if (!w) return false;
  sb.from('warehouses').delete().eq('name', oldName);
  w.name = nm; put('warehouses', w);
  items.forEach((it) => { if (it.warehouse === oldName) { it.warehouse = nm; put('items', it); } });
  shipments.forEach((s) => { if (s.warehouse === oldName) { s.warehouse = nm; put('shipments', s); } });
  notify(); return true;
}
export function deleteWarehouse(name) {
  if (items.some((it) => it.warehouse === name)) return false;
  warehouses = warehouses.filter((w) => w.name !== name); del('warehouses', 'name', name); notify(); return true;
}
export function warehouseSummary(name) {
  const its = items.filter((it) => it.warehouse === name);
  const total = Math.floor(its.reduce((s, it) => s + Math.max(0, currentStock(it)), 0));
  const low = its.filter((it) => stockStatus(it) !== 'ok').length;
  return { total, low, itemCount: its.length };
}

// ── 거래처 ──────────────────────────────────────────
export const getPartners = () => partners.slice();
export const findPartner = (name) => partners.find((p) => p.name === name);
export function addPartner(o) {
  const nm = (o.name || '').trim(); if (!nm || partners.some((p) => p.name === nm)) return false;
  const p = { name: nm, address: o.address || '', phone: o.phone || '', note: o.note || '' }; partners.push(p); put('partners', p); notify(); return true;
}
export function updatePartner(origName, o) {
  const p = partners.find((x) => x.name === origName); if (!p) return false;
  const nm = (o.name || '').trim(); if (nm !== origName && partners.some((x) => x.name === nm)) return false;
  if (nm !== origName) sb.from('partners').delete().eq('name', origName);
  p.name = nm; p.address = o.address || ''; p.phone = o.phone || ''; p.note = o.note || '';
  put('partners', p); notify(); return true;
}
export function deletePartner(name) { partners = partners.filter((p) => p.name !== name); del('partners', 'name', name); notify(); }

// ── 견적 ────────────────────────────────────────────
export const getQuotes = () => quotes.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
export const quotesPending = () => quotes.filter((q) => q.status === '견적대기').length;
export function addQuote(o) {
  const q = { id: nid('q'), date: o.date, client: o.client || '', phone: o.phone || '', content: o.content || '', status: o.status || '견적대기', note: o.note || '', calls: [], lines: [] };
  quotes.push(q); put('quotes', q); notify();
}
export function updateQuote(id, patch) { const q = quotes.find((x) => x.id === id); if (q) { Object.assign(q, patch); put('quotes', q); notify(); } }
export function deleteQuote(id) { quotes = quotes.filter((x) => x.id !== id); del('quotes', 'id', id); notify(); }
export function logQuoteCall(id) {
  const q = quotes.find((x) => x.id === id); if (!q) return;
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  q.calls = q.calls || []; q.calls.push(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`);
  put('quotes', q); notify();
}
// 출고 건 거래처 통화 기록 — 누가(who) 언제 눌렀는지
export function logShipCall(id, who) {
  const sh = shipments.find((x) => x.id === id); if (!sh) return;
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  sh.calls = [...(sh.calls || []), `${who || '담당자'} · ${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`];
  put('shipments', sh); notify();
}

// ── 집계 ────────────────────────────────────────────
export function todayStr() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
export function statusCounts() {
  const c = { 전체: shipments.length, 출고예정: 0, 배차완료: 0, 출고완료: 0 };
  shipments.forEach((s) => { if (c[s.status] != null) c[s.status]++; });
  return c;
}
export function summary() {
  const lowItems = items.filter((it) => stockStatus(it) !== 'ok');
  const today = todayStr();
  return { lowItems, todayShip: shipments.filter((s) => s.date === today), planned: shipments.filter((s) => s.status === '출고예정'),
    totalStock: items.reduce((s, it) => s + Math.max(0, currentStock(it)), 0), itemCount: items.length };
}
export function exportData() { return JSON.stringify({ items, shipments, warehouses, partners, inbounds, quotes }, null, 2); }
export async function resetAll() { /* 공유 DB에서는 비활성 (안전) */ }

// 외부에서 로컬(localStorage) 데이터를 한번 올릴 때 사용
export async function bulkUpsert(tbl, rows) { if (rows && rows.length) await put(tbl, rows); await refetch(tbl); }

// ── 로그인/인증 ──────────────────────────────────────
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
export async function currentUser() { const { data } = await sb.auth.getUser(); return data.user; }
export function onAuthChange(cb) { sb.auth.onAuthStateChange((_e, session) => cb(session)); }
// 아이디 로그인: 순수 아이디(admin 등)는 내부 이메일(admin@hometraders.local)로 매핑.
// 이미 이메일 형식(@ 포함)이면 그대로 사용.
export const ID_DOMAIN = '@hometraders.local';
export const idToEmail = (id) => (id.includes('@') ? id.trim() : id.trim().toLowerCase() + ID_DOMAIN);
// 로그인한 계정의 권한 {staff, partner, role} — DB(보안 1단계 SQL)가 정함. DB 에 아직 없으면 null
export async function myAccess() {
  const { data, error } = await sb.rpc('my_access');
  return error ? null : data;
}
export async function signIn(id, password) {
  const { error } = await sb.auth.signInWithPassword({ email: idToEmail(id), password });
  if (error) throw error;
}
export async function signOut() { _initPromise = null; await sb.auth.signOut(); }

// ── 스밭비서 입력 확인 (purchase_review) — 2026-10-11 ─────────────────────
// 스밭비서가 2027 날짜로 넣은 전표(2026 누락분)를 대표가 보고 판단 → 스밭비서가 읽어 2026 으로 정리
let reviews = [];
let reviewState = { ready: false, missing: false, err: '', at: 0, busy: false };
export async function loadReviews() {
  if (reviewState.busy) return reviewState;
  reviewState.busy = true;
  try {
    const { data, error } = await sb.from('purchase_review').select('*').order('sort', { ascending: true }).limit(1000);
    if (error) reviewState = { ready: false, missing: /does not exist|relation|schema cache|could not find/i.test(error.message), err: error.message, at: Date.now(), busy: false };
    else { reviews = data || []; reviewState = { ready: true, missing: false, err: '', at: Date.now(), busy: false }; }
  } catch (e) { reviewState = { ready: false, missing: false, err: String((e && e.message) || e), at: Date.now(), busy: false }; }
  return reviewState;
}
export const getReviews = () => reviews;
export const getReviewState = () => ({ ...reviewState });
export async function saveReview(id, patch) {
  const row = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await sb.from('purchase_review').update(row).eq('id', id);
  if (error) throw new Error(error.message);
  reviews = reviews.map((r) => (r.id === id ? { ...r, ...row } : r));
}
