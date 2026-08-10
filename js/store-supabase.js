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

// ── 초기 로드 + 최초 시드 + 실시간 ─────────────────────
export async function init() {
  const [w, p, i, n, s, q] = await Promise.all([
    sb.from('warehouses').select('*'),
    sb.from('partners').select('*'),
    sb.from('items').select('*'),
    sb.from('inbounds').select('*'),
    sb.from('shipments').select('*'),
    sb.from('quotes').select('*'),
  ]);
  const err = [w, p, i, n, s, q].find((r) => r.error);
  if (err && err.error) throw err.error;
  warehouses = w.data || []; partners = p.data || []; items = i.data || [];
  inbounds = n.data || []; shipments = s.data || []; quotes = q.data || [];

  if (!warehouses.length) { warehouses = seedWarehouses(); await sb.from('warehouses').upsert(warehouses); }
  if (!items.length) { items = seedItems(); await sb.from('items').upsert(items); }
  if (!partners.length) { partners = seedPartners(); await sb.from('partners').upsert(partners); }

  ['warehouses', 'partners', 'items', 'inbounds', 'shipments', 'quotes'].forEach((tbl) => {
    sb.channel('rt_' + tbl).on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => refetch(tbl)).subscribe();
  });
  notify();
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
    unit: o.unit, initial: num(o.initial), note: o.note || '', perBox: num(o.perBox), unitPrice: num(o.unitPrice), supplier: o.supplier || '' };
  items.push(it); sb.from('items').upsert(it); notify();
}
export function updateItem(id, patch) {
  const it = findItem(id); if (!it) return;
  Object.assign(it, patch); if (patch.initial != null) it.initial = num(patch.initial);
  sb.from('items').upsert(it); notify();
}
export function deleteItem(id) { items = items.filter((x) => x.id !== id); sb.from('items').delete().eq('id', id); notify(); }

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
    loadPlace: o.loadPlace || '', loadAddr: o.loadAddr || '', unloadPlace: o.unloadPlace || '', unloadAddr: o.unloadAddr || '' };
  shipments.push(sh); sb.from('shipments').upsert(sh); notify(); return sh;
}
export function updateShipment(id, patch) {
  const sh = shipments.find((x) => x.id === id); if (!sh) return;
  Object.assign(sh, patch); if (patch.qty != null) sh.qty = num(patch.qty);
  sb.from('shipments').upsert(sh); notify();
}
export function deleteShipment(id) { shipments = shipments.filter((x) => x.id !== id); sb.from('shipments').delete().eq('id', id); notify(); }

// ── 입고 ────────────────────────────────────────────
export const getInbounds = () => inbounds.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
export function addInbound(o) {
  const rec = { id: nid('in'), date: o.date, warehouse: o.warehouse, category: o.category, name: o.name,
    qty: num(o.qty), unit: o.unit || '', perBox: num(o.perBox), unitPrice: num(o.unitPrice), vatSeparate: !!o.vatSeparate, supplier: o.supplier || '', note: o.note || '' };
  inbounds.push(rec); sb.from('inbounds').upsert(rec);
  const it = items.find((x) => x.warehouse === o.warehouse && x.category === o.category && x.name === o.name);
  if (it) { if (rec.perBox) it.perBox = rec.perBox; if (rec.unitPrice) { it.unitPrice = rec.unitPrice; it.vatSeparate = rec.vatSeparate; } if (rec.supplier) it.supplier = rec.supplier; sb.from('items').upsert(it); }
  notify(); return rec;
}
export function deleteInbound(id) { inbounds = inbounds.filter((x) => x.id !== id); sb.from('inbounds').delete().eq('id', id); notify(); }

// ── 창고 ────────────────────────────────────────────
export const getWarehouses = () => warehouses.slice();
export const warehouseNames = () => warehouses.map((w) => w.name);
export function addWarehouse(name, icon) {
  const nm = (name || '').trim(); if (!nm || warehouses.some((w) => w.name === nm)) return false;
  const w = { name: nm, icon: icon || 'warehouse', address: '', phone: '' }; warehouses.push(w); sb.from('warehouses').upsert(w); notify(); return true;
}
export function setWarehouseIcon(name, icon) { const w = warehouses.find((x) => x.name === name); if (w) { w.icon = icon; sb.from('warehouses').upsert(w); notify(); } }
export function setWarehouseInfo(name, patch) { const w = warehouses.find((x) => x.name === name); if (w) { Object.assign(w, patch); sb.from('warehouses').upsert(w); notify(); } }
export function renameWarehouse(oldName, newName) {
  const nm = (newName || '').trim(); if (!nm) return false;
  if (warehouses.some((w) => w.name === nm && w.name !== oldName)) return false;
  const w = warehouses.find((x) => x.name === oldName); if (!w) return false;
  sb.from('warehouses').delete().eq('name', oldName);
  w.name = nm; sb.from('warehouses').upsert(w);
  items.forEach((it) => { if (it.warehouse === oldName) { it.warehouse = nm; sb.from('items').upsert(it); } });
  shipments.forEach((s) => { if (s.warehouse === oldName) { s.warehouse = nm; sb.from('shipments').upsert(s); } });
  notify(); return true;
}
export function deleteWarehouse(name) {
  if (items.some((it) => it.warehouse === name)) return false;
  warehouses = warehouses.filter((w) => w.name !== name); sb.from('warehouses').delete().eq('name', name); notify(); return true;
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
  const p = { name: nm, address: o.address || '', phone: o.phone || '', note: o.note || '' }; partners.push(p); sb.from('partners').upsert(p); notify(); return true;
}
export function updatePartner(origName, o) {
  const p = partners.find((x) => x.name === origName); if (!p) return false;
  const nm = (o.name || '').trim(); if (nm !== origName && partners.some((x) => x.name === nm)) return false;
  if (nm !== origName) sb.from('partners').delete().eq('name', origName);
  p.name = nm; p.address = o.address || ''; p.phone = o.phone || ''; p.note = o.note || '';
  sb.from('partners').upsert(p); notify(); return true;
}
export function deletePartner(name) { partners = partners.filter((p) => p.name !== name); sb.from('partners').delete().eq('name', name); notify(); }

// ── 견적 ────────────────────────────────────────────
export const getQuotes = () => quotes.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
export const quotesPending = () => quotes.filter((q) => q.status === '견적대기').length;
export function addQuote(o) {
  const q = { id: nid('q'), date: o.date, client: o.client || '', phone: o.phone || '', content: o.content || '', status: o.status || '견적대기', note: o.note || '', calls: [], lines: [] };
  quotes.push(q); sb.from('quotes').upsert(q); notify();
}
export function updateQuote(id, patch) { const q = quotes.find((x) => x.id === id); if (q) { Object.assign(q, patch); sb.from('quotes').upsert(q); notify(); } }
export function deleteQuote(id) { quotes = quotes.filter((x) => x.id !== id); sb.from('quotes').delete().eq('id', id); notify(); }
export function logQuoteCall(id) {
  const q = quotes.find((x) => x.id === id); if (!q) return;
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  q.calls = q.calls || []; q.calls.push(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`);
  sb.from('quotes').upsert(q); notify();
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
export async function bulkUpsert(tbl, rows) { if (rows && rows.length) await sb.from(tbl).upsert(rows); await refetch(tbl); }

// ── 로그인/인증 ──────────────────────────────────────
export async function getSession() { const { data } = await sb.auth.getSession(); return data.session; }
export async function currentUser() { const { data } = await sb.auth.getUser(); return data.user; }
export function onAuthChange(cb) { sb.auth.onAuthStateChange((_e, session) => cb(session)); }
// 아이디 로그인: 순수 아이디(admin 등)는 내부 이메일(admin@hometraders.local)로 매핑.
// 이미 이메일 형식(@ 포함)이면 그대로 사용.
export const ID_DOMAIN = '@hometraders.local';
export const idToEmail = (id) => (id.includes('@') ? id.trim() : id.trim().toLowerCase() + ID_DOMAIN);
export async function signIn(id, password) {
  const { error } = await sb.auth.signInWithPassword({ email: idToEmail(id), password });
  if (error) throw error;
}
export async function signOut() { await sb.auth.signOut(); }
