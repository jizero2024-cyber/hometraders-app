// 홈트 마을 3D 캐릭터 (10/29 대표 "힉스필드로 만든 캐릭터 참고해서 귀엽게") — 말랑한 점토 인형 느낌:
// 머리와 몸이 붙은 둥근 몸 · 짧은 팔다리 · 작은 눈과 볼터치 · 직업 소품(헬멧·헤드셋·스카프·안경…).
// 빛·그림자·밤을 같이 받고, 걷는 방향으로 몸을 돌림. 앞(+z)을 보고 서 있음.
import * as THREE from 'three';

const MC = {};
const m = (c, r = 0.62) => (MC[c + r] ||= r <= 0.35 ? new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.15 })
  : new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color('#FFFFFF') }));   // 말랑한 인형 — 몸은 살짝 보송(sheen), 눈·코는 반짝(clearcoat) (10/31 대표 "캐릭터 디테일")
const OC = {};
const outlineOf = (o) => {   // 게임 캐릭터처럼 얇은 테두리 — 뒤집은 껍데기 (색은 그 부분 색을 어둡게)
  const c = new THREE.Color(o.material.color).multiplyScalar(0.42), k = c.getHexString();
  const mo = (OC[k] ||= new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }));
  const e = new THREE.Mesh(o.geometry, mo), t = 0.028; e.scale.set(1 + t / Math.max(0.02, o.scale.x), 1 + t / Math.max(0.02, o.scale.y), 1 + t / Math.max(0.02, o.scale.z)); e.castShadow = false; e.raycast = () => {}; o.add(e);
};
const G = {
  sph: new THREE.SphereGeometry(1, 28, 20), cap: new THREE.CapsuleGeometry(1, 1, 8, 16), cone: new THREE.ConeGeometry(1, 1, 18),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24), box: new THREE.BoxGeometry(1, 1, 1), tor: new THREE.TorusGeometry(1, 0.28, 12, 28),
  half: new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), arc: new THREE.TorusGeometry(1, 0.1, 10, 28, Math.PI), rbox: new THREE.CapsuleGeometry(1, 0.6, 4, 8),
};
function P(parent, geo, c, [x, y, z], [sx, sy, sz], rot, rough) {
  const o = new THREE.Mesh(G[geo], m(c, rough)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); if (rot) o.rotation.set(...rot); o.castShadow = true; parent.add(o); return o;
}
// 힉스필드 걷기 그림 18명과 같은 색 · 소품
const SPEC = {
  seal: { b: '#F3F2EE', belly: '#FFFFFF' }, cat: { b: '#8F959C', inner: '#F4B8C0' }, dog: { b: '#EBD3B0', inner: '#F4B8C0', muzzle: '#7A5E4E' },
  beaver: { b: '#A8693E', belly: '#C58A5C' }, raccoon: { b: '#8D8D8F' }, squirrel: { b: '#E8703A', belly: '#FBE3C8' }, owl: { b: '#A39383', belly: '#F2E6D6' },
  turtle: { b: '#94CC6E', belly: '#F2E08A' }, otter: { b: '#9A7456', belly: '#E9D6BE' }, hedgehog: { b: '#F0DCC0', spike: '#8E735C' }, penguin: { b: '#2F3542', belly: '#FFFFFF' },
  rabbit: { b: '#F7F3EE', inner: '#F4B8C0' }, panda: { b: '#F7F7F5', patch: '#1F1F1F' }, redpanda: { b: '#D6612A' }, guppy: { b: '#BFE7FA' },
  driver: { human: 1, shirt: '#2E4370', pants: '#2B3A63', vest: '#F28C28', hat: '#2B3A63' }, worker: { human: 1, shirt: '#2E3E63', pants: '#2B3A63', vest: '#24324F', hat: '#2B3A63' },
  boss1: { human: 1, shirt: '#E8E6F2', pants: '#3A4258', vest: '#A79BE0', hat: '#FFFFFF', helmet: 1 }, boss2: { human: 1, shirt: '#EDEFE8', pants: '#3A4258', vest: '#7FC29B', hat: '#FFFFFF', helmet: 1 },
};
const face = (head, r, y, { eye = '#26201E', blush = '#F7A6A6', mouth = 1, brow = 1 } = {}) => {   // 큰 반짝 눈(하이라이트 둘) · 눈썹 · 볼터치 · 입
  [-1, 1].forEach((s) => {
    const ex = s * r * 0.31;
    P(head, 'sph', eye, [ex, y, r * 0.92], [0.1, 0.125, 0.05], null, 0.25);
    P(head, 'sph', '#5A4A6A', [ex, y - 0.045, r * 0.955], [0.06, 0.05, 0.02], null, 0.3);
    P(head, 'sph', '#FFFFFF', [ex + s * 0.01 + 0.03, y + 0.045, r * 0.975], [0.034, 0.038, 0.012], null, 0.15);
    P(head, 'sph', '#FFFFFF', [ex - 0.03, y - 0.04, r * 0.975], [0.014, 0.014, 0.008], null, 0.15);
    if (brow) P(head, 'cap', eye, [ex, y + 0.2, r * 0.9], [0.018, 0.045, 0.018], [0, 0, Math.PI / 2 - s * 0.22], 0.5);   // 눈썹 — 안쪽이 올라간 순한 표정
    P(head, 'sph', blush, [s * r * 0.58, y - 0.15, r * 0.78], [0.13, 0.07, 0.03], null, 0.95);
  });
  if (mouth) { P(head, 'tor', eye, [0, y - 0.15, r * 0.95], [0.055, 0.04, 0.03], [0, 0, Math.PI], 0.4); P(head, 'sph', '#F07A8A', [0, y - 0.175, r * 0.94], [0.03, 0.02, 0.01], null, 0.6); }
};
export function critter(kind) {
  const sp = SPEC[kind] || SPEC.worker, g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  let legs, arms, head;
  if (sp.human) {   // 사람 — 큰 머리 2등신
    legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.2, 0.72, 0); body.add(p); P(p, 'cap', sp.pants, [0, -0.3, 0], [0.15, 0.22, 0.15]); P(p, 'sph', '#2A2A2E', [0, -0.64, 0.06], [0.17, 0.1, 0.22]); P(p, 'cyl', '#F2F2F2', [0, -0.71, 0.06], [0.17, 0.03, 0.22]); return p; });   // 신발 + 흰 밑창
    P(body, 'cap', sp.shirt, [0, 1.05, 0], [0.38, 0.22, 0.3]); P(body, 'cap', sp.vest, [0, 1.07, 0.02], [0.4, 0.2, 0.32]);
    if (kind === 'driver' || kind === 'worker') P(body, 'box', '#E9EEF2', [0, 1.0, 0.33], [0.62, 0.06, 0.02], null, 0.3);
    arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.43, 1.3, 0); body.add(p); P(p, 'cap', sp.shirt, [0, -0.22, 0], [0.11, 0.16, 0.11]); P(p, 'cyl', sp.vest, [0, -0.36, 0], [0.12, 0.04, 0.12]); P(p, 'sph', kind === 'driver' || kind === 'worker' ? '#F2F2F2' : '#F3CBA8', [0, -0.48, 0], [0.11, 0.11, 0.11]); return p; });   // 소매 끝 · 장갑
    head = new THREE.Group(); head.position.y = 1.95; body.add(head);
    P(head, 'sph', '#F6D2B2', [0, 0, 0], [0.56, 0.54, 0.52]); P(head, 'sph', '#4A3426', [0, 0.1, -0.1], [0.58, 0.5, 0.5]);
    [-1, 1].forEach((s) => { P(head, 'sph', '#F1C4A0', [s * 0.55, -0.02, 0], [0.09, 0.12, 0.07]); P(head, 'sph', '#4A3426', [s * 0.42, 0.12, 0.33], [0.12, 0.16, 0.08], [0, 0, s * 0.4]); });   // 귀 · 옆머리
    P(head, 'sph', '#4A3426', [0, 0.27, 0.38], [0.36, 0.1, 0.12], [0.3, 0, 0]); P(head, 'sph', '#EDB58F', [0, -0.08, 0.53], [0.05, 0.04, 0.04]);   // 앞머리 · 코
    face(head, 0.52, -0.02, { blush: '#F5A5A0', eye: '#2B211C' });
    P(body, 'tor', '#FFFFFF', [0, 1.42, 0.02], [0.24, 0.24, 0.2], [Math.PI / 2, 0, 0]);   // 옷깃
    if (kind === 'driver' || kind === 'worker') [-1, 1].forEach((s) => { P(body, 'box', '#D9DEE3', [s * 0.2, 1.08, 0.31], [0.07, 0.42, 0.03], null, 0.3); });   // 조끼 반사띠
    P(body, 'cyl', '#3A2E28', [0, 0.82, 0], [0.37, 0.06, 0.3]); P(body, 'box', '#C9A13A', [0, 0.82, 0.3], [0.08, 0.06, 0.03], null, 0.3);   // 벨트 · 버클
    if (sp.helmet) { P(head, 'half', sp.hat, [0, 0.12, 0], [0.62, 0.55, 0.6], null, 0.35); P(head, 'cyl', sp.hat, [0, 0.12, 0.05], [0.68, 0.04, 0.68], null, 0.35); }
    else { P(head, 'half', sp.hat, [0, 0.14, 0], [0.6, 0.48, 0.58]); P(head, 'box', sp.hat, [0, 0.16, 0.5], [0.62, 0.05, 0.38]); }
  } else {   // 동물 — 머리와 몸이 붙은 둥근 몸
    legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.32, 0.36, 0.05); body.add(p); P(p, 'cap', kind === 'penguin' || kind === 'owl' ? '#F3B13E' : kind === 'panda' ? sp.patch : sp.b, [0, -0.16, 0.04], [0.17, 0.1, 0.2]); return p; });
    P(body, 'sph', sp.b, [0, 0.9, 0], [0.72, 0.7, 0.64]);
    if (kind === 'cat' || kind === 'dog') P(body, 'cap', sp.b, [0, 0.75, -0.68], [0.1, 0.32, 0.1], [-0.9, 0, 0]);   // 꼬리
    if (sp.belly) P(body, 'sph', sp.belly, [0, 0.8, 0.28], [0.46, 0.45, 0.38]);
    arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.64, 1.0, 0.1); body.add(p); P(p, 'cap', kind === 'panda' ? sp.patch : kind === 'penguin' ? sp.b : sp.b, [0, -0.15, 0], [0.13, 0.12, 0.13]); return p; });
    head = new THREE.Group(); head.position.y = 1.62; body.add(head);
    P(head, 'sph', sp.b, [0, 0, 0], [0.82, 0.72, 0.74]);
    const r = 0.74;
    const ears = (c, inner, w, h, x = 0.46, y = 0.8, tilt = 0.3) => [-1, 1].forEach((s) => { P(head, 'cone', c, [s * x, y, 0], [w, h, w * 0.6], [0, 0, -s * tilt]); if (inner) P(head, 'cone', inner, [s * x, y - 0.02, 0.05], [w * 0.6, h * 0.75, w * 0.3], [0, 0, -s * tilt]); });
    const roundEars = (c, w = 0.16, x = 0.5, y = 0.56) => [-1, 1].forEach((s) => P(head, 'sph', c, [s * x, y, -0.05], [w, w, w * 0.7]));
    switch (kind) {
      case 'seal': face(head, r, 0.02); P(head, 'sph', '#FFFFFF', [0, -0.12, r * 0.86], [0.2, 0.12, 0.1]); [-1, 1].forEach((s) => P(head, 'sph', '#2A2A2A', [s * 0.06, -0.06, r * 0.95], [0.03, 0.025, 0.02]));
        P(body, 'tor', '#F07E2E', [0, 1.3, 0], [0.62, 0.62, 0.55], [Math.PI / 2, 0, 0]); P(body, 'cap', '#F07E2E', [0.25, 1.05, 0.55], [0.1, 0.18, 0.06], [0.2, 0, 0.3]); break;
      case 'cat': ears(sp.b, sp.inner, 0.2, 0.32); face(head, r, 0.02); P(head, 'arc', '#262626', [0, 0.02, 0], [0.84, 0.82, 0.84]); [-1, 1].forEach((s) => P(head, 'cyl', '#262626', [s * 0.82, -0.02, 0], [0.18, 0.08, 0.18], [0, 0, Math.PI / 2])); P(head, 'cap', '#262626', [0.62, -0.24, 0.42], [0.03, 0.18, 0.03], [1.1, 0.5, 0]); break;
      case 'dog': ears(sp.b, sp.inner, 0.26, 0.4, 0.5, 0.78, 0.35); face(head, r, 0.06, { mouth: 0 }); P(head, 'sph', sp.muzzle, [0, -0.15, r * 0.82], [0.3, 0.2, 0.18]); P(head, 'sph', '#2A2A2A', [0, -0.07, r * 0.98], [0.07, 0.05, 0.04]);
        P(head, 'half', '#F7C82F', [0, 0.46, 0], [0.6, 0.4, 0.6], null, 0.35); P(head, 'cyl', '#F7C82F', [0, 0.46, 0.08], [0.68, 0.04, 0.72], null, 0.35); break;
      case 'beaver': roundEars('#8E5530', 0.12); face(head, r, 0.04, { mouth: 0 }); P(head, 'box', '#FFFFFF', [0, -0.2, r * 0.95], [0.14, 0.12, 0.03]); P(head, 'sph', '#5A3520', [0, -0.07, r * 0.98], [0.07, 0.05, 0.04]);
        P(body, 'tor', '#F08A2C', [0, 0.72, 0], [0.74, 0.74, 0.62], [Math.PI / 2, 0, 0]); P(body, 'cap', '#6E4528', [0, 0.35, -0.72], [0.3, 0.05, 0.4], [1.3, 0, 0]); break;
      case 'raccoon': ears('#6E6E70', '#4A4A4C', 0.18, 0.26); face(head, r, 0.02);
        [-1, 1].forEach((s) => P(head, 'tor', '#2A2A2A', [s * 0.21, 0.02, r * 0.95], [0.12, 0.12, 0.12], null, 0.3)); P(head, 'box', '#2A2A2A', [0, 0.02, r * 0.97], [0.12, 0.02, 0.02]);
        [0, 1, 2].forEach((i) => P(body, 'cap', i % 2 ? '#5A5A5C' : '#A7A7A9', [0, 0.55 + i * 0.05, -0.75 - i * 0.18], [0.16, 0.08, 0.16], [1.2, 0, 0])); break;
      case 'squirrel': ears(sp.b, "#F6B48E", 0.15, 0.32, 0.4, 0.82, 0.15); face(head, r, 0.02); P(head, 'sph', sp.belly, [0, -0.18, r * 0.72], [0.34, 0.24, 0.2]);
        P(body, 'sph', sp.b, [0, 1.25, -0.72], [0.42, 0.75, 0.38]); P(body, 'sph', sp.b, [0, 1.95, -0.55], [0.36, 0.34, 0.32]); break;
      case 'owl': [-1, 1].forEach((s) => P(head, 'cone', '#8A7A6A', [s * 0.48, 0.7, 0], [0.1, 0.26, 0.07], [0, 0, -s * 0.3])); P(head, 'sph', '#F2E6D6', [0, 0, r * 0.55], [0.55, 0.45, 0.3]); face(head, r, 0.05, { mouth: 0 }); P(head, 'cone', '#F3B13E', [0, -0.1, r * 0.98], [0.07, 0.14, 0.07], [Math.PI / 2, 0, 0]); break;
      case 'turtle': face(head, r, 0.02); P(head, 'half', '#F7C82F', [0, 0.46, 0], [0.6, 0.4, 0.6], null, 0.35); P(head, 'cyl', '#F7C82F', [0, 0.46, 0.08], [0.68, 0.04, 0.72], null, 0.35);
        P(body, 'half', '#4E9A3E', [0, 0.75, -0.25], [0.72, 0.72, 0.62], [-1.2, 0, 0]); P(body, 'box', '#3F7FE0', [-0.34, 0.95, 0.62], [0.26, 0.32, 0.06]); break;
      case 'otter': roundEars('#7A5A40', 0.1); face(head, r, 0.06, { mouth: 0 }); P(head, 'sph', sp.belly, [0, -0.14, r * 0.78], [0.34, 0.22, 0.2]); P(head, 'sph', '#3A2A20', [0, -0.06, r * 0.98], [0.06, 0.045, 0.04]);
        P(body, 'cap', '#7A5A40', [0, 0.5, -0.7], [0.14, 0.32, 0.14], [1.1, 0, 0]); P(body, 'box', '#3F7FE0', [-0.32, 0.95, 0.62], [0.26, 0.32, 0.06]); P(body, 'cyl', '#F2C33A', [0.35, 0.95, 0.62], [0.13, 0.04, 0.13], [Math.PI / 2, 0, 0], 0.3); break;
      case 'hedgehog': P(head, 'sph', sp.spike, [0, 0.12, -0.22], [0.8, 0.72, 0.62], null, 0.95); P(body, 'sph', sp.spike, [0, 1.0, -0.3], [0.84, 0.78, 0.6], null, 0.95);
        roundEars('#C9A57E', 0.11, 0.42, 0.42); face(head, r, 0.02); P(head, 'sph', '#3A2A20', [0, -0.08, r * 0.98], [0.05, 0.04, 0.03]); P(body, 'tor', '#B9A7E0', [0, 1.3, 0], [0.64, 0.64, 0.56], [Math.PI / 2, 0, 0]); break;
      case 'penguin': P(head, 'sph', sp.belly, [0, -0.06, r * 0.5], [0.5, 0.48, 0.32]); face(head, r, 0.02, { mouth: 0 }); P(head, 'cone', '#F3B13E', [0, -0.12, r * 0.98], [0.07, 0.13, 0.06], [Math.PI / 2, 0, 0]);
        P(head, 'half', '#26365E', [0, 0.42, 0], [0.66, 0.4, 0.66]); P(head, 'box', '#26365E', [0, 0.44, 0.62], [0.62, 0.05, 0.36]); P(body, 'box', '#C9945A', [0, 0.95, 0.68], [0.5, 0.38, 0.3]); break;
      case 'rabbit': [-1, 1].forEach((s) => { P(head, 'cap', sp.b, [s * 0.2, 0.85, -0.02], [0.13, 0.36, 0.09], [0, 0, -s * 0.1]); P(head, 'cap', sp.inner, [s * 0.2, 0.85, 0.05], [0.07, 0.28, 0.03], [0, 0, -s * 0.1]); }); face(head, r, 0.02); P(body, 'box', '#F6A6C6', [0.32, 1.0, 0.62], [0.2, 0.32, 0.06]); break;
      case 'panda': roundEars(sp.patch, 0.18, 0.52, 0.58); [-1, 1].forEach((s) => P(head, 'sph', sp.patch, [s * 0.24, 0.02, r * 0.85], [0.15, 0.17, 0.08], [0, 0, s * 0.4])); face(head, r, 0.02); [-1, 1].forEach((s) => P(head, 'tor', '#C9A13A', [s * 0.22, 0.03, r * 0.98], [0.12, 0.12, 0.12], null, 0.3)); break;
      case 'redpanda': ears(sp.b, '#FFFFFF', 0.2, 0.26); P(head, 'sph', '#FFFFFF', [0, -0.14, r * 0.8], [0.3, 0.2, 0.18]); face(head, r, 0.05, { mouth: 0 }); P(head, 'sph', '#2A2A2A', [0, -0.06, r * 0.98], [0.05, 0.04, 0.03]);
        P(head, 'sph', '#2E2420', [0.05, 0.66, -0.05], [0.52, 0.15, 0.52]); [0, 1, 2].forEach((i) => P(body, 'cap', i % 2 ? '#7A3417' : '#E07A3E', [0, 0.55 + i * 0.05, -0.75 - i * 0.18], [0.17, 0.09, 0.17], [1.2, 0, 0])); break;
      case 'guppy': face(head, r, 0.02); P(body, 'cone', '#F7A6C8', [0, 1.0, -0.85], [0.45, 0.5, 0.2], [Math.PI / 2, 0, 0]); P(head, 'cone', '#FFD36B', [0, 0.65, 0], [0.12, 0.3, 0.08]); break;
      default: face(head, r, 0.02);
    }
  }
  body.traverse((o) => { if (o.isMesh && o.scale.x * o.scale.y * o.scale.z > 0.004 && o.material.roughness > 0.35) outlineOf(o); });   // 큰 부분만 테두리
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.62, 18), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.16, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.04; g.add(sh);
  let ph = Math.random() * 6;
  return {
    g,
    walk(dt, speed = 1) { ph += dt * 10 * speed; const a = Math.sin(ph) * 0.6; legs[0].rotation.x = a; legs[1].rotation.x = -a; arms[0].rotation.x = -a * 0.7; arms[1].rotation.x = a * 0.7; body.position.y = Math.abs(Math.cos(ph)) * 0.1; body.rotation.z = Math.sin(ph) * 0.06; },
    idle(dt) { ph += dt * 2; legs.forEach((l) => { l.rotation.x = 0; }); body.rotation.z = 0; arms[0].rotation.x = Math.sin(ph) * 0.06; arms[1].rotation.x = -Math.sin(ph) * 0.06; body.position.y = Math.sin(ph) * 0.02; },
    hammer(dt) { ph += dt * 7; arms[1].rotation.x = -1.8 + Math.abs(Math.sin(ph)) * 1.3; arms[0].rotation.x = -0.4; body.rotation.x = 0.12; head.rotation.x = 0.1; },
    type(dt) { ph += dt * 14; arms[0].rotation.x = -1.0 + Math.sin(ph) * 0.15; arms[1].rotation.x = -1.0 - Math.sin(ph) * 0.15; head.rotation.y = Math.sin(ph * 0.08) * 0.15; },
    sit() { legs.forEach((l) => { l.rotation.x = -1.4; }); body.position.y = -0.3; body.rotation.z = 0; },
    face(dx, dz) { if (dx || dz) g.rotation.y = Math.atan2(dx, dz); },
  };
}

// 그림 대신 3D 캐릭터를 찍은 얼굴 사진 (10/29 대표 "마을 애들 깨져 보여") — 화면 크기·밤낮과 상관없이 또렷, 마을 캐릭터와 같은 모양
let PR = null; const PC = {};
export function portrait(kind, px = 320) {
  if (PC[kind + px]) return PC[kind + px];
  if (!PR) {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.setPixelRatio(1);
    const s = new THREE.Scene(); s.add(new THREE.HemisphereLight('#FFFFFF', '#B9C7A8', 1.4)); const d = new THREE.DirectionalLight('#FFF6E8', 2.2); d.position.set(-3, 5, 6); s.add(d);
    const c = new THREE.PerspectiveCamera(26, 1, 0.1, 50); PR = { r, s, c };
  }
  const { r, s, c } = PR; r.setSize(px, px, false);
  const q = critter(kind); q.g.rotation.y = 0.3; s.add(q.g);
  const b = new THREE.Box3().setFromObject(q.g), mid = b.getCenter(new THREE.Vector3()), h = b.max.y - b.min.y;
  c.position.set(mid.x, mid.y + h * 0.05, mid.z + h * 2.3); c.lookAt(mid.x, mid.y, mid.z);
  r.setClearColor(0x000000, 0); r.render(s, c);
  const url = r.domElement.toDataURL('image/png'); s.remove(q.g); PC[kind + px] = url; return url;
}
export const KINDS = ['seal', 'cat', 'dog', 'beaver', 'raccoon', 'squirrel', 'owl', 'turtle', 'otter', 'hedgehog', 'penguin', 'rabbit', 'panda', 'redpanda', 'guppy', 'driver', 'worker', 'boss1', 'boss2'];
