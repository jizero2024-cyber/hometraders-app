// 초기 시드 데이터 — 실리콘 박스 + 구조재 (천안창고 / NS로지스)
// 앱 최초 실행 시 localStorage 가 비어있으면 이 값으로 채운다.

export const WAREHOUSES = ['천안창고', 'NS로지스'];
export const WH_ICON_KEYS = ['warehouse', 'building', 'home', 'boxes', 'pin', 'truck'];

export function seedWarehouses() {
  return [
    { name: '천안창고', icon: 'warehouse', address: '천안시 서북구 직산읍 신갈리 206-6', phone: '010-6207-8478' },
    { name: 'NS로지스', icon: 'building', address: '', phone: '' },
    { name: '매입창고', icon: 'boxes', address: '', phone: '' },
  ];
}
export const CATEGORIES = ['실리콘', '구조재'];
export const UNITS = ['박스', '파레트', '장', '개', '롤', '본', '단'];

// 실리콘 색상 팔레트 (hex, 글자흰색 여부)
export const SILICONE_COLORS = {
  '상아':         ['#F3ECDD', false],
  '상아색':       ['#F3ECDD', false],
  '반투명':       ['#E2ECEF', false],
  '백색':         ['#FFFFFF', false],
  '돼지백색변성': ['#F7E7E1', false],
  '라떼':         ['#D8BE97', false],
  '베이지':       ['#E4D3B0', false],
  '초코':         ['#5B3A29', true],
  '연밤색':       ['#C7A17F', false],
  '연혹색':       ['#D6D2CB', false],
  '진회색':       ['#6E6E6E', true],
  '네이비':       ['#2C3A57', true],
  '아이보리':     ['#FAF4E4', false],
  '징크그레이':   ['#96A0A6', false],
};

// 구조재/기타 기본 색 (목재 톤)
export const DEFAULT_SWATCH = ['#B98A5E', false];

export function swatchFor(name) {
  return SILICONE_COLORS[name] || DEFAULT_SWATCH;
}

let _id = 0;
const nid = (p) => `${p}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

function item(warehouse, category, name, unit, initial, note = '', perBox = 0) {
  return { id: nid('it'), warehouse, category, name, unit, initial: Number(initial) || 0, note, perBox };
}

export function seedItems() {
  // 재고는 공유 DB(Supabase)에 저장됨 — 클라이언트 소스엔 비워둠(보안). 최초 시드 완료.
  return [];
}

// 8/7 실제 출고 1건 (색상 미지정 — 앱에서 확인 후 지정)
export function seedShipments() {
  return [];
}

export function seedInbounds() {
  return [];
}

import { PARTNERS_SEED } from './partners-seed.js';
export function seedPartners() {
  return PARTNERS_SEED.map((p) => ({ ...p }));
}

export function seedQuotes() {
  return [];
}
