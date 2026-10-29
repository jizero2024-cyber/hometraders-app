// 홈트 마을 3D 캐릭터 (10/29 대표 "캐릭터가 마을이랑 이질감") — 그림(스프라이트) 대신 마을과 같은 단순 3D 도형.
// 빛·그림자·밤을 같이 받고, 걷는 방향으로 몸을 돌리고, 다리·팔이 번갈아 움직임. 앞(+z)을 보고 서 있음.
import * as THREE from 'three';

const MC = {};
const m = (c) => (MC[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));
const G = {
  sph: new THREE.SphereGeometry(1, 20, 14), cap: new THREE.CapsuleGeometry(1, 1, 6, 14), cone: new THREE.ConeGeometry(1, 1, 14),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18), box: new THREE.BoxGeometry(1, 1, 1), tor: new THREE.TorusGeometry(1, 0.32, 10, 24),
};
function part(parent, geo, c, [x, y, z], [sx, sy, sz], rot) {
  const o = new THREE.Mesh(G[geo], m(c)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); if (rot) o.rotation.set(...rot); o.castShadow = true; parent.add(o); return o;
}
// 동물마다 몸 색 · 머리 장식
const SPEC = {
  seal: { b: '#F2F1EC', h: 1 }, cat: { b: '#9AA0A6', h: 1 }, dog: { b: '#E9D2B0', h: 1 }, beaver: { b: '#A86F43', h: 1 }, raccoon: { b: '#8E8E8E', h: 1 },
  squirrel: { b: '#E2733A', h: 1 }, owl: { b: '#9C8A78', h: 1 }, penguin: { b: '#2E3440', h: 1 }, rabbit: { b: '#F5F2EE', h: 1 }, otter: { b: '#8C6A4E', h: 1 },
  hedgehog: { b: '#E6CFAE', h: 1 }, panda: { b: '#F4F4F2', h: 1 }, redpanda: { b: '#D9692E', h: 1 }, turtle: { b: '#8CC66A', h: 1 }, guppy: { b: '#8FD0F0', h: 1 },
  driver: { b: '#2E4A7A', human: 1 }, worker: { b: '#8E9AA8', human: 1 }, boss1: { b: '#7E6AD8', human: 1 }, boss2: { b: '#3F7F5A', human: 1 },
};
export function critter(kind) {
  const sp = SPEC[kind] || SPEC.worker, g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const human = !!sp.human, skin = human ? '#F2C9A5' : sp.b, hr = human ? 0.42 : 0.52, hy = human ? 1.95 : 1.8;
  const legC = human ? '#2B3550' : sp.b === '#2E3440' ? '#F2A33A' : sp.b;
  const legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.24, 0.62, 0); body.add(p); part(p, 'cap', legC, [0, -0.3, 0], [0.15, 0.22, 0.15]); return p; });
  part(body, 'cap', sp.b, [0, 1.08, 0], [0.5, 0.32, 0.42]);   // 몸통
  const arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.52, 1.32, 0); body.add(p); part(p, 'cap', human ? skin : sp.b, [0, -0.28, 0], [0.12, 0.2, 0.12]); return p; });
  const head = new THREE.Group(); head.position.y = hy; body.add(head);
  part(head, 'sph', skin, [0, 0, 0], [hr, hr * 0.95, hr * 0.92]);
  [-1, 1].forEach((s) => { part(head, 'sph', '#1E1B1A', [s * hr * 0.36, 0.04, hr * 0.86], [0.065, 0.075, 0.04]); part(head, 'sph', '#F6A8A8', [s * hr * 0.6, -0.14, hr * 0.74], [0.09, 0.06, 0.03]); });
  const ears = (c, w, hgt, y = 0.85) => [-1, 1].forEach((s) => part(head, 'cone', c, [s * hr * 0.55, hr * y, 0], [w, hgt, w * 0.7], [0, 0, -s * 0.25]));
  switch (kind) {
    case 'seal': part(body, 'tor', '#E8732C', [0, 1.45, 0], [0.42, 0.42, 0.42], [Math.PI / 2, 0, 0]); part(head, 'sph', '#FFFFFF', [0, -0.12, hr * 0.85], [0.18, 0.12, 0.1]); break;
    case 'cat': ears('#9AA0A6', 0.16, 0.3); part(head, 'tor', '#2B2B2B', [0, 0.05, 0], [hr * 1.02, hr * 1.02, hr * 1.02], [0, Math.PI / 2, 0]); part(head, 'sph', '#2B2B2B', [hr * 0.95, -0.05, 0.1], [0.1, 0.13, 0.1]); break;
    case 'dog': ears('#E9D2B0', 0.18, 0.32); part(head, 'sph', '#8A6A55', [0, -0.12, hr * 0.82], [0.2, 0.14, 0.12]); part(head, 'sph', '#F5C431', [0, hr * 0.5, 0], [hr * 0.9, hr * 0.5, hr * 0.9]); part(head, 'cyl', '#F5C431', [0, hr * 0.45, 0.06], [hr * 1.05, 0.04, hr * 1.1]); break;
    case 'beaver': ears('#8A5532', 0.1, 0.12, 0.8); part(body, 'box', '#5A3A22', [0, 0.45, -0.5], [0.45, 0.08, 0.6], [0.5, 0, 0]); part(body, 'tor', '#E8732C', [0, 0.92, 0], [0.48, 0.48, 0.4], [Math.PI / 2, 0, 0]); part(head, 'box', '#FFFFFF', [0, -0.24, hr * 0.85], [0.12, 0.1, 0.03]); break;
    case 'raccoon': ears('#6E6E6E', 0.14, 0.24); part(head, 'box', '#3A3A3A', [0, 0.04, hr * 0.78], [hr * 1.3, 0.16, 0.12]); part(body, 'cap', '#5A5A5A', [0, 0.6, -0.5], [0.13, 0.35, 0.13], [0.9, 0, 0]); break;
    case 'squirrel': ears('#E2733A', 0.12, 0.22); part(body, 'sph', '#E2733A', [0, 1.2, -0.6], [0.32, 0.55, 0.3]); part(body, 'sph', '#F0A06A', [0, 1.75, -0.55], [0.26, 0.26, 0.24]); break;
    case 'owl': ears('#7A6A5A', 0.08, 0.2, 0.9); part(body, 'sph', '#EADBC8', [0, 1.05, 0.25], [0.32, 0.36, 0.2]); part(head, 'cone', '#F2A33A', [0, -0.08, hr * 0.95], [0.06, 0.12, 0.06], [Math.PI / 2, 0, 0]); break;
    case 'penguin': part(body, 'sph', '#FFFFFF', [0, 1.05, 0.22], [0.36, 0.42, 0.24]); part(head, 'sph', '#2B3A5A', [0, hr * 0.55, 0], [hr * 0.92, hr * 0.42, hr * 0.92]); part(head, 'cone', '#F2A33A', [0, -0.1, hr * 0.95], [0.07, 0.14, 0.07], [Math.PI / 2, 0, 0]); break;
    case 'rabbit': [-1, 1].forEach((s) => part(head, 'cap', '#F5F2EE', [s * 0.2, hr + 0.35, 0], [0.11, 0.3, 0.08], [0, 0, -s * 0.12])); break;
    case 'otter': ears('#7A5A40', 0.09, 0.1, 0.8); part(head, 'sph', '#D9C2A6', [0, -0.12, hr * 0.8], [0.2, 0.13, 0.12]); part(body, 'cap', '#7A5A40', [0, 0.55, -0.5], [0.12, 0.3, 0.12], [1.0, 0, 0]); break;
    case 'hedgehog': part(head, 'ico' in G ? 'sph' : 'sph', '#8A6A4E', [0, 0.1, -0.2], [hr * 1.1, hr * 1.05, hr * 0.9]); part(body, 'sph', '#8A6A4E', [0, 1.15, -0.25], [0.5, 0.5, 0.35]); break;
    case 'panda': [-1, 1].forEach((s) => { part(head, 'sph', '#1E1E1E', [s * hr * 0.6, hr * 0.8, 0], [0.14, 0.14, 0.1]); part(head, 'sph', '#2A2A2A', [s * hr * 0.36, 0.04, hr * 0.8], [0.12, 0.14, 0.06]); }); arms.forEach((a) => a.children[0].material = m('#1E1E1E')); break;
    case 'redpanda': ears('#D9692E', 0.15, 0.22); part(head, 'sph', '#FFFFFF', [0, -0.12, hr * 0.82], [0.2, 0.12, 0.1]); part(head, 'sph', '#3A2A22', [0, hr * 0.7, -0.05], [hr * 0.75, 0.16, hr * 0.75]); part(body, 'cap', '#A84A1E', [0, 0.65, -0.5], [0.14, 0.38, 0.14], [0.9, 0, 0]); break;
    case 'driver': part(head, 'sph', '#2E4A7A', [0, hr * 0.5, 0], [hr * 1.02, hr * 0.5, hr * 1.02]); part(head, 'box', '#2E4A7A', [0, hr * 0.42, hr * 0.8], [hr * 1.2, 0.05, 0.4]); part(body, 'cap', '#F28C28', [0, 1.1, 0], [0.52, 0.22, 0.44]); break;
    case 'worker': part(head, 'sph', '#FFFFFF', [0, hr * 0.5, 0], [hr * 1.08, hr * 0.62, hr * 1.08]); part(head, 'cyl', '#FFFFFF', [0, hr * 0.38, 0], [hr * 1.2, 0.04, hr * 1.2]); break;
    case 'boss1': case 'boss2': part(head, 'sph', '#FFFFFF', [0, hr * 0.5, 0], [hr * 1.08, hr * 0.62, hr * 1.08]); part(head, 'cyl', '#FFFFFF', [0, hr * 0.38, 0], [hr * 1.2, 0.04, hr * 1.2]); break;
    default: break;
  }
  if (human) { part(head, 'sph', '#3A2A20', [0, hr * 0.25, -0.12], [hr * 0.98, hr * 0.7, hr * 0.9]); }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.16, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.05; g.add(sh);
  let ph = Math.random() * 6;
  return {
    g,
    walk(dt, speed = 1) { ph += dt * 9 * speed; const a = Math.sin(ph) * 0.7; legs[0].rotation.x = a; legs[1].rotation.x = -a; arms[0].rotation.x = -a * 0.8; arms[1].rotation.x = a * 0.8; body.position.y = Math.abs(Math.cos(ph)) * 0.08; },
    idle(dt) { ph += dt * 2; legs.forEach((l) => { l.rotation.x = 0; }); arms[0].rotation.x = Math.sin(ph) * 0.06; arms[1].rotation.x = -Math.sin(ph) * 0.06; body.position.y = Math.sin(ph) * 0.02; },
    hammer(dt) { ph += dt * 7; arms[1].rotation.x = -1.6 + Math.abs(Math.sin(ph)) * 1.2; arms[0].rotation.x = -0.4; body.rotation.x = 0.15; },
    type(dt) { ph += dt * 14; arms[0].rotation.x = -1.1 + Math.sin(ph) * 0.12; arms[1].rotation.x = -1.1 - Math.sin(ph) * 0.12; },
    sit() { legs.forEach((l) => { l.rotation.x = -1.45; }); body.position.y = -0.5; },
    face(dx, dz) { if (dx || dz) g.rotation.y = Math.atan2(dx, dz); },
  };
}
