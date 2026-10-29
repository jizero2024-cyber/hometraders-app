// 홈트 마을 진짜 3D (10/29 대표 "진짜 3D로 다시") — three.js 로 길 · 건물 · 나무 · 차 · 걷는 직원
// 마우스로 돌리기 · 확대 · 끌기. 거래처 건물 · 사무실 · 창고 · 우체통 눌러서 씀.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const GX = [-120, -60, 0, 60, 120], GZ = [-100, -50, 0, 50, 100];   // 길 격자
// 거래처 자리 (블록 가운데). 블록 = 60×50
export const LOTS = {
  gonggan: [-30, -75, 'office'], woorim: [30, -75, 'ware'], wonik: [90, -75, 'ware'],
  seosaeng: [-90, -25, 'site'], home: [30, -25, 'home'], suncheon: [-90, 25, 'site'],
  hanlim: [90, 25, 'yard'], paju: [-90, 75, 'site'], gunsan: [-30, 75, 'site'], anmyeon: [30, 75, 'site'], cheongdo: [90, 75, 'wood'],
};
const door = (k) => { const [x, z] = LOTS[k]; return [x, z + 25]; };   // 블록 아래 길
export function route(a, b) {
  const [ax, az] = door(a), [bx, bz] = door(b);
  const X = GX.reduce((m, g) => (Math.abs(g - (ax + bx) / 2) < Math.abs(m - (ax + bx) / 2) ? g : m), 0);
  const pts = az === bz ? [[ax, az], [bx, bz]] : [[ax, az], [X, az], [X, bz], [bx, bz]];
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { pts, L };
}

export function mount(host, o) {
  const W = 1440, H = 900;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const k = host.getBoundingClientRect().width / W || 1;
  renderer.setPixelRatio(Math.min(2, (window.devicePixelRatio || 1) * Math.max(k, 0.6)));
  renderer.setSize(W, H, false); renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none';
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const over = document.createElement('div'); over.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'; host.appendChild(over);

  const hr = new Date().getHours(), night = hr >= 18 || hr < 6;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(night ? '#1D2A4A' : '#BFE3FF'); scene.fog = new THREE.Fog(scene.background, 260, 520);
  const cam = new THREE.PerspectiveCamera(32, W / H, 1, 1200); cam.position.set(92, 108, 138);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.target.set(8, 0, 4); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 40; ctl.maxDistance = 420; ctl.maxPolarAngle = 1.22; ctl.minPolarAngle = 0.35; ctl.screenSpacePanning = false;
  ctl.update();

  scene.add(new THREE.HemisphereLight(night ? '#5A6FA8' : '#EAF6FF', night ? '#2A2F3A' : '#7AA35A', night ? 0.55 : 1.15));
  const sun = new THREE.DirectionalLight(night ? '#9FB4FF' : '#FFF3DD', night ? 0.6 : 2.3); sun.position.set(-120, 200, 90); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -180, right: 180, top: 160, bottom: -160, near: 10, far: 500 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun);

  // 재료
  const M = {}; const mat = (c, ex = {}) => (M[c + JSON.stringify(ex)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...ex }));
  const box = (w, h, d, c, x, y, z, parent = scene, ex) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, ex)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const cyl = (r1, r2, h, c, x, y, z, seg = 16, parent = scene) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const group = (x, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; };
  const pick = []; const clickable = (obj, key) => { obj.traverse((m) => { if (m.isMesh) { m.userData.key = key; pick.push(m); } }); };

  // 땅 — 섬처럼 (흙 옆면)
  const island = new THREE.Mesh(new THREE.BoxGeometry(300, 8, 250), [mat('#9C7A55'), mat('#9C7A55'), mat('#8CCB6A'), mat('#9C7A55'), mat('#9C7A55'), mat('#9C7A55')]);
  island.position.y = -4; island.receiveShadow = true; scene.add(island);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(night ? '#2B4A7A' : '#8FD3F4', { roughness: 0.35 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -7; scene.add(sea);

  // 길 · 보도 · 차선 · 횡단보도
  const roadM = mat('#6B7280'), walkM = mat('#E9E4DA'), lineM = mat('#FFFFFF', { roughness: 0.6 });
  const strip = (x, z, w, d, m, y) => { const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), m); s.position.set(x, y, z); s.receiveShadow = true; scene.add(s); };
  GZ.forEach((z) => { strip(0, z, 248, 9, walkM, 0.12); strip(0, z, 248, 6, roadM, 0.2); });
  GX.forEach((x) => { strip(x, 0, 9, 208, walkM, 0.13); strip(x, 0, 6, 208, roadM, 0.21); });
  [-90, -30, 30, 90].forEach((bx) => [-75, -25, 25, 75].forEach((bz) => { strip(bx, bz, 50, 40, mat('#9ED87C'), 0.15); }));
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.1, 0.45), lineM, 400); let di = 0; const dm = new THREE.Object3D();
  GZ.forEach((z) => { for (let x = -122; x < 122; x += 7) { if (GX.some((g) => Math.abs(g - x) < 6)) continue; dm.position.set(x, 0.38, z); dm.rotation.set(0, 0, 0); dm.updateMatrix(); dash.setMatrixAt(di++, dm.matrix); } });
  GX.forEach((x) => { for (let z = -102; z < 102; z += 7) { if (GZ.some((g) => Math.abs(g - z) < 6)) continue; dm.position.set(x, 0.38, z); dm.rotation.set(0, Math.PI / 2, 0); dm.updateMatrix(); dash.setMatrixAt(di++, dm.matrix); } });
  dash.count = di; scene.add(dash);
  const zebra = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.1, 6), lineM, 600); let zi = 0;
  GX.forEach((x) => GZ.forEach((z) => { [[-6.5, 0, 0], [6.5, 0, 0], [0, -6.5, 1], [0, 6.5, 1]].forEach(([ox, oz, r]) => { for (let i = -2; i <= 2; i++) { dm.position.set(x + ox + (r ? i * 1.5 : 0), 0.38, z + oz + (r ? 0 : i * 1.5)); dm.rotation.set(0, r ? Math.PI / 2 : 0, 0); dm.updateMatrix(); zebra.setMatrixAt(zi++, dm.matrix); } }); }));
  zebra.count = zi; scene.add(zebra);

  // 나무 (살랑살랑)
  const trees = [];
  const tree = (x, z, s = 1, c = '#5DBB5A') => {
    const g = group(x, z); cyl(0.35 * s, 0.5 * s, 2.4 * s, '#8A5A35', 0, 0, 0, 8, g);
    const top = new THREE.Group(); top.position.y = 2.2 * s; g.add(top);
    [[0, 1.6, 0, 1.9], [0.9, 1.0, 0.4, 1.3], [-0.8, 1.1, -0.3, 1.25], [0.1, 2.7, 0.1, 1.2]].forEach(([a, b, cc, r]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), mat(c, { flatShading: true })); m.position.set(a * s, b * s, cc * s); m.castShadow = true; top.add(m); });
    trees.push({ top, ph: Math.random() * 6 }); return g;
  };
  const lamp = (x, z) => { cyl(0.15, 0.2, 5, '#4A5058', x, 0, z, 8); const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), mat('#FFF2C4', { emissive: night ? '#FFD27A' : '#000000', emissiveIntensity: 1.6 })); b.position.set(x, 5.3, z); scene.add(b); };
  // 집
  const gable = (w, h, d, c) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); const m = new THREE.Mesh(g, mat(c)); m.castShadow = true; m.receiveShadow = true; return m; };
  const winM = mat('#BFE6FF', { roughness: 0.2, emissive: night ? '#FFC870' : '#000000', emissiveIntensity: night ? 0.9 : 0 });
  const windows = (g, w, h, d, y0, rows, cols) => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = -w / 2 + (c + 0.5) * (w / cols); [[d / 2 + 0.06, 0], [-d / 2 - 0.06, Math.PI]].forEach(([zz, ry]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w / cols * 0.45, 1.3), winM); m.position.set(x, y0 + r * 3 + 1.4, zz); m.rotation.y = ry; g.add(m); }); } };
  const house = (x, z, ry, wall, roof, s = 1) => {
    const g = group(x, z, ry), w = 9 * s, d = 8 * s, h = 5 * s;
    box(w, h, d, wall, 0, 0, 0, g); const rf = gable(d + 1.4, 3.6 * s, w + 1.2, roof); rf.rotation.y = Math.PI / 2; rf.position.y = h; g.add(rf);
    box(1.6 * s, 2.6 * s, 0.3, '#8A5A35', 0, 0, d / 2 + 0.1, g); windows(g, w, h, d, 0.4, 1, 3);
    box(1, 2.4 * s, 1, '#B85C46', w / 3, h + 1.2 * s, -d / 5, g);
    return g;
  };
  // 공장 · 창고 (둥근 지붕)
  const shed = (x, z, ry, w, d, h, wall, roof) => {
    const g = group(x, z, ry); box(w, h, d, wall, 0, 0, 0, g);
    const rg = new THREE.CylinderGeometry(d / 2 + 0.3, d / 2 + 0.3, w + 0.6, 28, 1, false, 0, Math.PI); rg.rotateZ(Math.PI / 2); const rf = new THREE.Mesh(rg, mat(roof)); rf.scale.y = 0.42; rf.position.y = h; rf.castShadow = true; g.add(rf);
    for (let i = 0; i < 3; i++) box(w / 4.2, h * 0.62, 0.3, '#D8DDE3', -w / 3 + i * w / 3, 0, d / 2 + 0.05, g);
    return g;
  };
  const pallets = (g, x, z, n, c = '#E9C98F') => { for (let i = 0; i < n; i++) { const px = x + (i % 3) * 3.2, pz = z + Math.floor(i / 3) * 3.2; box(2.8, 0.35, 2.8, '#B88B55', px, 0, pz, g); box(2.6, 1.4 + (i % 2) * 0.8, 2.6, c, px, 0.35, pz, g); } };
  // 공사장 — 목조 골조 · 크레인 · 비계
  const cranes = [];
  const site = (x, z, ry, s = 1) => {
    const g = group(x, z, ry); box(20, 0.6, 16, '#D9D4CA', 0, 0, 0, g);
    const stud = mat('#E2B87A');
    for (let i = 0; i <= 8; i++) { const sx = -8 + i * 2; [[-6], [6]].forEach(([sz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 0.35), stud); m.position.set(sx, 3.1, sz); m.castShadow = true; g.add(m); }); }
    for (let i = 0; i <= 6; i++) { const sz = -6 + i * 2; [[-8], [8]].forEach(([sx]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 0.35), stud); m.position.set(sx, 3.1, sz); m.castShadow = true; g.add(m); }); }
    [-6, 6].forEach((sz) => box(16.4, 0.4, 0.4, '#D7A867', 0, 5.6, sz, g)); [-8, 8].forEach((sx) => box(0.4, 0.4, 12.4, '#D7A867', sx, 5.6, 0, g));
    for (let i = 0; i <= 8; i++) { const tx = -8 + i * 2; const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 7.6), stud); a.position.set(tx, 7.4, -3); a.rotation.x = 0.55; g.add(a); const b2 = a.clone(); b2.position.z = 3; b2.rotation.x = -0.55; g.add(b2); }
    for (let i = 0; i < 4; i++) box(5, 0.5, 1.2, '#E9C98F', 10.5, i * 0.5, -5 + (i % 2) * 0.3, g);
    pallets(g, -11, 5, 2, '#C9A26B');
    const cr = new THREE.Group(); cr.position.set(-12, 0, -7); g.add(cr);
    const mast = mat('#F5B400'); const tw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 22 * s, 1.2), mast); tw.position.y = 11 * s; tw.castShadow = true; cr.add(tw);
    const jib = new THREE.Group(); jib.position.y = 22 * s; cr.add(jib);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 0.9), mast); arm.position.x = 7; arm.castShadow = true; jib.add(arm);
    box(3, 1.6, 2, '#E8E8E8', -4.5, -0.8, 0, jib); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), mat('#3F7FE0')); cab.position.set(0.6, -1.2, 0); jib.add(cab);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 4), mat('#333')); jib.add(rope);
    const load = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.2), mat('#E2B87A')); load.castShadow = true; jib.add(load);
    cranes.push({ jib, rope, load, ph: Math.random() * 6, s });
    box(20.4, 1.2, 0.2, '#F2F2F2', 0, 0, 8.2, g);
    return g;
  };
  // 우리 사무실 6층 + 큰 창고
  const homeLot = () => {
    const g = group(30, -25);
    box(56, 0.4, 46, '#DCE8D0', 0, 0, 0, g);
    const tower = new THREE.Group(); tower.position.set(-14, 0, -4); g.add(tower);
    for (let f = 0; f < 6; f++) { box(14, 0.5, 12, '#F4F1EC', 0, f * 3.4, 0, tower); const glass = new THREE.Mesh(new THREE.BoxGeometry(13.4, 2.9, 11.4), mat('#BFE0F2', { roughness: 0.15, emissive: night ? '#FFC870' : '#000000', emissiveIntensity: night ? 0.6 : 0, transparent: true, opacity: 0.88 })); glass.position.y = f * 3.4 + 0.5 + 1.45; glass.castShadow = true; tower.add(glass); }
    box(14.4, 0.8, 12.4, '#E8732C', 0, 20.4, 0, tower);
    const tex = new THREE.TextureLoader().load('/icons/logo-full.png'); tex.colorSpace = THREE.SRGBColorSpace;
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); logo.position.set(0, 23.6, 0); tower.add(logo);
    const logoBack = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.4), mat('#FFFFFF')); logoBack.position.set(0, 23.6, -0.05); tower.add(logoBack);
    box(0.4, 3, 0.4, '#555', -4.5, 20.4 + 0.8, 0, tower); box(0.4, 3, 0.4, '#555', 4.5, 20.4 + 0.8, 0, tower);
    for (let i = 0; i < 6; i++) box(4, 0.3, 2, '#D9D9D9', 9, i * 3.4 + 0.4, 3, tower);
    clickable(tower, 'office');
    const wh = new THREE.Group(); wh.position.set(12, 0, -6); g.add(wh);
    box(22, 16, 18, '#EDEFF2', 0, 0, 0, wh); box(22.6, 1, 18.6, '#3F7FE0', 0, 16, 0, wh);
    box(9, 9, 0.3, '#B9C2CC', 0, 0, 9.05, wh); for (let i = 0; i < 6; i++) box(9, 0.15, 0.32, '#9AA5B1', 0, 1 + i * 1.4, 9.1, wh);
    const signC = document.createElement('canvas'); signC.width = 512; signC.height = 96; const sc = signC.getContext('2d'); sc.fillStyle = '#E8732C'; sc.fillRect(0, 0, 512, 96); sc.fillStyle = '#fff'; sc.font = '800 54px Pretendard, sans-serif'; sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.fillText('홈트레이더스 창고', 256, 50);
    const sTex = new THREE.CanvasTexture(signC); sTex.colorSpace = THREE.SRGBColorSpace; const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.25), new THREE.MeshBasicMaterial({ map: sTex })); sign.position.set(0, 12.5, 9.12); wh.add(sign);
    pallets(wh, 13, -6, 6); pallets(wh, -18, 6, 3, '#F2F2F2');
    const fk = new THREE.Group(); fk.position.set(4, 0, 13); wh.add(fk); box(2.2, 1.6, 3, '#F5B400', 0, 0.4, 0, fk); box(0.3, 4, 0.3, '#333', -0.7, 0, 1.7, fk); box(0.3, 4, 0.3, '#333', 0.7, 0, 1.7, fk); box(1.8, 0.2, 2, '#333', 0, 0.3, 2.6, fk);
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([a, b]) => { const w = cyl(0.5, 0.5, 0.4, '#222', a * 1.25, 0, b * 1.1, 12, fk); w.rotation.z = Math.PI / 2; w.position.y = 0.5; });
    clickable(wh, 'warehouse');
    // 마당 — 빈백 · 파라솔 · 와인바
    const yard = new THREE.Group(); yard.position.set(-14, 0, 14); g.add(yard);
    box(18, 0.2, 10, '#7CC56A', 0, 0.4, 0, yard);
    cyl(0.1, 0.1, 3.2, '#888', -5, 0.5, 0, 6, yard); const um = new THREE.Mesh(new THREE.ConeGeometry(3, 1.2, 12), mat('#FFFFFF')); um.position.set(-5, 4.2, 0); um.castShadow = true; yard.add(um);
    [['#F7A8C8', -1.5], ['#FFE07A', 1]].forEach(([c, x]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), mat(c)); b.scale.y = 0.7; b.position.set(x, 1.2, 2); b.castShadow = true; yard.add(b); });
    box(5, 2.4, 2, '#A8774A', 5.5, 0.5, -1.5, yard); box(5.6, 0.3, 2.6, '#7A5232', 5.5, 3.6, -1.5, yard);
    clickable(yard, 'office');
    return g;
  };

  // 거래처 건물
  const SITE_ROT = { seosaeng: 0.2, suncheon: -0.3, paju: 0.4, gunsan: -0.15, anmyeon: 0.25 };
  Object.entries(LOTS).forEach(([key, [x, z, kind]]) => {
    let g;
    if (kind === 'home') g = homeLot();
    else if (kind === 'site') { g = site(x, z - 2, SITE_ROT[key] || 0); }
    else if (kind === 'ware') { g = shed(x, z - 3, 0, 30, 18, 9, '#F3F1EC', key === 'wonik' ? '#5D9BF2' : '#FFC531'); pallets(g, -14, 12, 6, key === 'wonik' ? '#F2F2F2' : '#C7CDD4'); }
    else if (kind === 'yard') { g = shed(x, z - 6, 0, 26, 14, 8, '#F3EEE6', '#4FAE6E'); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { box(5.5, 1.6 + (i % 3) * 0.6, 2.6, '#E7C48A', -12 + i * 6, 0, 11 + j * 3.4, g); } }
    else if (kind === 'office') { g = group(x, z - 2); box(22, 0.4, 18, '#E9E4DA', 0, 0, 0, g); box(16, 8, 12, '#FFFFFF', 0, 0.4, -1, g); box(16.4, 0.6, 12.4, '#2B2522', 0, 8.4, -1, g); const gl = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.2), winM); gl.position.set(0, 3.6, 5.1); g.add(gl); box(3, 0.2, 3, '#7CC56A', -8, 0.4, 7, g); }
    else if (kind === 'wood') { g = group(x, z - 2); house(-6, -2, 0, '#C99A6B', '#5B4636', 1.3); house(10, 3, -0.4, '#E7D2B5', '#7A5A44', 1); }
    if (kind !== 'home' && g) clickable(g, key);
  });
  // 빈 블록 — 동네 집 · 공원 · 밭
  [[90, -25], [-30, 25], [30, 25]].forEach(([bx, bz], bi) => {
    const W2 = ['#FFF6E8', '#FFE3D3', '#E5F1FF', '#F0FFE8', '#FFF0F5'], R2 = ['#E86A5A', '#5D7FBF', '#7A6A5A', '#4FAE6E', '#E8A33C'];
    for (let i = 0; i < 4; i++) house(bx - 15 + (i % 2) * 30 * 0.66 + (i > 1 ? 4 : 0), bz - 10 + Math.floor(i / 2) * 18, (i % 2 ? Math.PI : 0) + (bi - 1) * 0.1, W2[(i + bi) % 5], R2[(i + bi * 2) % 5], 0.9);
    tree(bx + 18, bz - 12, 1.1); tree(bx + 20, bz + 10, 0.9); tree(bx - 22, bz + 2, 1);
  });
  // 공원 + 연못 + 우체통 (자료 넣기)
  { const g = group(-30, -25); box(54, 0.3, 44, '#9FD67E', 0, 0, 0, g); const pond = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.4, 32), mat('#7EC8F0', { roughness: 0.2 })); pond.position.set(-6, 0.45, 4); pond.scale.z = 0.7; g.add(pond);
    for (let i = 0; i < 8; i++) tree(-30 - 22 + (i % 4) * 14 + (i > 3 ? 7 : 0), -25 - 16 + (i > 3 ? 30 : 0), 0.9 + (i % 3) * 0.15, ['#5DBB5A', '#4FAE6E', '#7FCB5A'][i % 3]);
    const mb = new THREE.Group(); mb.position.set(14, 0, 8); g.add(mb); cyl(0.25, 0.25, 2.6, '#555', 0, 0, 0, 8, mb); box(2.6, 2.2, 1.8, '#E8732C', 0, 2.6, 0, mb); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.6, 16, 1, false, 0, Math.PI), mat('#E8732C')); lid.rotation.z = Math.PI / 2; lid.position.y = 4.8; mb.add(lid); box(1.4, 0.2, 0.1, '#2B2522', 0, 3.9, 0.92, mb);
    mb.scale.setScalar(1.5); clickable(mb, 'mail'); o.mailPos = [-30 + 14, 8, -25 + 8]; }
  // 밭
  { const g = group(-90, -75); for (let i = 0; i < 6; i++) box(46, 0.6, 4.5, i % 2 ? '#7FB24A' : '#9A6F48', 0, 0, -16 + i * 6.4, g); house(18, -2, 0, '#FFF6E8', '#B85C46', 0.8); }
  // 길가 나무 · 가로등
  GX.forEach((gx) => GZ.forEach((gz) => { lamp(gx + 7, gz + 7); }));
  for (let i = 0; i < 46; i++) { const x = -145 + Math.random() * 290, z = -120 + Math.random() * 240; if (GX.some((g) => Math.abs(g - x) < 9) || GZ.some((g) => Math.abs(g - z) < 9)) continue; const inLot = Object.values(LOTS).some(([lx, lz]) => Math.abs(lx - x) < 20 && Math.abs(lz - z) < 16); if (inLot) continue; tree(x, z, 0.8 + Math.random() * 0.5, ['#5DBB5A', '#4FAE6E', '#7FCB5A', '#3E9E57'][i % 4]); }
  [-90, -30, 30, 90].forEach((bx) => [-75, -25, 25, 75].forEach((bz) => { if (bx === 30 && bz === -25) return; [[-23, -18], [23, -18], [-23, 18], [23, 18], [0, -19]].forEach(([a, b], i) => tree(bx + a, bz + b, 0.7 + (i % 3) * 0.12, ['#5DBB5A', '#4FAE6E', '#7FCB5A'][i % 3])); }));
  [-148, 148].forEach((x) => { for (let z = -115; z <= 115; z += 14) tree(x, z, 0.9 + (Math.abs(z) % 3) * 0.1); });

  // 구름
  const clouds = [];
  for (let i = 0; i < 6; i++) { const c = new THREE.Group(); [[0, 0, 0, 6], [5, -1, 1, 4.5], [-5, -1, -1, 4.5], [2, 2, -1, 4]].forEach(([a, b, d, r]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#FFFFFF', { flatShading: true, roughness: 1 })); m.position.set(a, b, d); m.castShadow = true; c.add(m); }); c.position.set(-200 + i * 75, 115 + (i % 3) * 12, -90 + (i * 47) % 180); scene.add(c); clouds.push(c); }

  // 차 — 길 따라 돌기
  const cars = [], CARC = ['#FF6B5E', '#5D9BF2', '#FFC531', '#FFFFFF', '#7ED39B', '#B98AF5', '#FF9E5E'];
  const carMesh = (c) => { const g = new THREE.Group(); box(4.4, 1.3, 2.3, c, 0, 0.5, 0, g); box(2.4, 1.1, 2.1, '#CFE8FF', -0.2, 1.8, 0, g, { roughness: 0.2 }); [[-1.4, -1.1], [1.4, -1.1], [-1.4, 1.1], [1.4, 1.1]].forEach(([a, b]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12), mat('#2B2522')); w.rotation.x = Math.PI / 2; w.position.set(a, 0.5, b); g.add(w); }); scene.add(g); return g; };
  for (let i = 0; i < 14; i++) { const horiz = i % 2 === 0, line = horiz ? GZ[i % 5] : GX[i % 5], dir = i % 4 < 2 ? 1 : -1; cars.push({ m: carMesh(CARC[i % CARC.length]), horiz, line, dir, t: Math.random() * 248, v: 9 + (i % 4) * 2 }); }

  // 트럭 (배차)
  const trucks = [];
  const truckMesh = (c, c2) => { const g = new THREE.Group(); box(7, 3.4, 3.2, c, -1.2, 0.9, 0, g); box(2.6, 2.6, 3, c2, 3.4, 0.9, 0, g); box(0.2, 1.2, 2.4, '#CFE8FF', 4.75, 2.1, 0, g, { roughness: 0.2 }); [[-3.5, -1.5], [-0.5, -1.5], [3.2, -1.5], [-3.5, 1.5], [-0.5, 1.5], [3.2, 1.5]].forEach(([a, b]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 14), mat('#2B2522')); w.rotation.x = Math.PI / 2; w.position.set(a, 0.75, b); g.add(w); }); scene.add(g); return g; };
  const lineOf = (pts, c) => { const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0.6, z))); const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: c, dashSize: 2, gapSize: 2.2, linewidth: 2 })); l.computeLineDistances(); scene.add(l); return l; };
  const at = (pts, d) => { for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= L || i === pts.length - 1) { const f = Math.min(1, d / L); return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, z: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, a: Math.atan2(-(pts[i][1] - pts[i - 1][1]), pts[i][0] - pts[i - 1][0]) }; } d -= L; } return { x: pts[0][0], z: pts[0][1], a: 0 }; };
  function addTruck(t) {
    const r = route(t.from, t.to), m = truckMesh(t.c, t.c2), line = lineOf(r.pts, t.c2);
    const lab = document.createElement('div'); lab.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:none;white-space:nowrap;padding:6px 10px 6px 8px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.16);display:flex;gap:7px;align-items:center;z-index:3';
    lab.innerHTML = `<span style="width:6px;align-self:stretch;border-radius:3px;background:${t.c}"></span><span><span style="display:block;font-size:12px;font-weight:800">${t.title}</span><span class="tsub" style="display:block;font-size:11px;color:#8A7E77"></span></span>`;
    lab.querySelector('.tsub').textContent = t.sub || ''; over.appendChild(lab);
    const T0 = performance.now() / 1000 - (t.delay < 0 ? -t.delay : 0), wait = t.delay > 0 ? t.delay : 0;
    const tr = { r, m, line, lab, T0, wait, dur: t.dur, loop: t.loop };
    trucks.push(tr);
    return { setSub: (s) => { lab.querySelector('.tsub').textContent = s; }, remove: () => { scene.remove(m); scene.remove(line); lab.remove(); trucks.splice(trucks.indexOf(tr), 1); } };
  }

  // 걷는 사람 — 카메라 기준 앞 · 옆 · 뒷모습 그림 번갈아
  const texC = {}; const loader = new THREE.TextureLoader();
  const tex = (url) => { if (!texC[url]) { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texC[url] = t; } return texC[url]; };
  const people = [];
  const person = (av, pts, v, h = 3.2) => {
    const mtl = new THREE.SpriteMaterial({ map: tex(o.wf(av, 0)), transparent: true, alphaTest: 0.15 }); const s = new THREE.Sprite(mtl); s.center.set(0.5, 0); s.scale.set(h * 0.82, h, 1); scene.add(s);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(h * 0.25, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18 })); sh.rotation.x = -Math.PI / 2; scene.add(sh);
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    people.push({ av, pts, v, L, s, sh, h, t: Math.random() * L * 2, last: '' });
  };
  const WALKERS = [
    ['driver', [[-60, -45], [-60, 45]]], ['boss1', [[-115, 6], [-5, 6]]], ['worker', [[6, -95], [6, 95]]], ['dog', [[20, 6], [55, 6]]], ['cat', [[66, -45], [66, 45]]],
    ['driver', [[-55, -44], [55, -44]]], ['worker', [[-55, 56], [55, 56]]], ['rabbit', [[66, 56], [115, 56]]], ['boss1', [[-66, -95], [-66, -55]]], ['penguin', [[-115, 44], [-65, 44]]],
    ['squirrel', [[54, -95], [54, -55]]], ['worker', [[-125, -94], [-65, -94]]], ['seal', [[10, -4], [24, -4]]], ['beaver', [[-114, -55], [-114, 45]]], ['owl', [[114, -45], [114, 45]]],
  ];
  WALKERS.forEach(([av, p], i) => person(av, p, 2.6 + (i % 3) * 0.5));
  // 공사장 인부 (망치질)
  const hammer = [];
  Object.entries(LOTS).forEach(([k, [x, z, kind]]) => { if (kind !== 'site') return; [[-4, 8.5], [5, 8.6], [11, -2]].forEach(([a, b], i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(o.wf('worker', i === 2 ? 2 : 0)), transparent: true, alphaTest: 0.15 })); s.center.set(0.5, 0); s.scale.set(2.5, 3, 1); s.position.set(x + a, 0.6, z + b - 2); scene.add(s); hammer.push({ s, ph: Math.random() * 6, y: 0.6 }); }); });

  // 이름표 (HTML) — 3D 위치 따라감
  const tags = [];
  const tag = (html, x, y, z, cls = '') => { const d = document.createElement('div'); d.className = cls; d.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:2;pointer-events:none'; d.innerHTML = html; over.appendChild(d); tags.push({ d, p: new THREE.Vector3(x, y, z) }); return d; };
  Object.entries(o.places).forEach(([key, p]) => {
    const L0 = LOTS[key]; if (!L0) return; const [bg, fg] = o.tone[p.tone], hgt = key === 'home' ? 30 : L0[2] === 'site' ? 26 : 14;
    tag(`<div class="${p.tone === 'red' ? 'bob' : ''}" style="margin-bottom:4px;display:flex;flex-direction:column;align-items:center"><span style="max-width:180px;padding:6px 10px;border-radius:14px;background:${bg};color:${fg};font-size:11px;font-weight:800;line-height:1.3;text-align:center;box-shadow:0 4px 12px rgba(40,60,90,.18)">${o.esc(p.msg)}</span><span class="tail" style="background:${bg}"></span></div>
      ${p.wait ? `<img class="bob" src="${o.img}${p.wait}.webp" alt="기다리는 거래처" style="width:40px;margin-bottom:2px">` : ''}
      <button type="button" class="pill pc" data-pk="${key}" style="border:0;cursor:pointer;pointer-events:auto;background:${key === 'home' ? '#E8732C' : 'rgba(255,255,255,.96)'};color:${key === 'home' ? '#fff' : '#4A3F3A'};font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.12)">${o.esc(p.name.replace(/[←↓]/g, '').trim())}</button>`, L0[0], hgt, L0[1] - 4);
  });
  tag('<span class="pill" style="background:#E8732C;color:#fff;font-size:11px;box-shadow:0 3px 10px rgba(232,115,44,.4);pointer-events:auto;cursor:pointer" data-mail="1">자료 넣기</span>', o.mailPos[0], 9, o.mailPos[2]);

  // 누르기
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, hoverKey = null;
  const hit = (e) => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(pick, false)[0]; return h ? h.object.userData.key : null; };
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return; const k2 = hit(e); if (k2) o.onPick(k2); });
  renderer.domElement.addEventListener('pointermove', (e) => { if (e.buttons) return; const k2 = hit(e); if (k2 !== hoverKey) { hoverKey = k2; renderer.domElement.style.cursor = k2 ? 'pointer' : 'grab'; } });
  over.addEventListener('click', (e) => { if (e.target.closest('[data-mail]')) o.onPick('mail'); });
  host.addEventListener('dragover', (e) => e.preventDefault());
  host.addEventListener('drop', (e) => { e.preventDefault(); const f = [...(e.dataTransfer.files || [])].map((x) => x.name); if (f.length && o.onDrop) o.onDrop(f); });

  // 그리기
  const v3 = new THREE.Vector3(), camDir = new THREE.Vector3(), clock = new THREE.Clock(); let alive = true;
  const proj = (p, el2) => { v3.copy(p).project(cam); const vis = v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15; el2.style.display = vis ? '' : 'none'; if (vis) el2.style.transform = `translate(${((v3.x + 1) / 2 * W).toFixed(1)}px,${((1 - v3.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`; };
  function frame() {
    if (!alive || !renderer.domElement.isConnected) { alive = false; renderer.dispose(); return; }
    const dt = Math.min(0.05, clock.getDelta()), now = clock.elapsedTime;
    ctl.update(); cam.getWorldDirection(camDir);
    trees.forEach((t) => { t.top.rotation.z = Math.sin(now * 1.3 + t.ph) * 0.035; t.top.rotation.x = Math.cos(now * 1.1 + t.ph) * 0.025; });
    cranes.forEach((c) => { c.jib.rotation.y = Math.sin(now * 0.18 + c.ph) * 1.2; const hx = 10 + Math.sin(now * 0.3 + c.ph) * 6, drop = 6 + Math.sin(now * 0.5 + c.ph) * 4; c.rope.position.set(hx, -drop / 2, 0); c.rope.scale.y = drop; c.load.position.set(hx, -drop - 0.4, 0); });
    clouds.forEach((c, i) => { c.position.x += dt * (2 + i * 0.3); if (c.position.x > 240) c.position.x = -240; });
    cars.forEach((c) => { c.t = (c.t + dt * c.v) % 248; const p = -124 + (c.dir > 0 ? c.t : 248 - c.t), off = c.dir * 2; if (c.horiz) { c.m.position.set(p, 0.2, c.line + off); c.m.rotation.y = c.dir > 0 ? 0 : Math.PI; } else { c.m.position.set(c.line - off, 0.2, Math.max(-104, Math.min(104, p * 0.84))); c.m.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2; } });
    hammer.forEach((h) => { h.s.position.y = h.y + Math.abs(Math.sin(now * 5 + h.ph)) * 0.25; });
    people.forEach((p) => {
      p.t += dt * p.v; const cyc = p.t % (p.L * 2), fwd = cyc <= p.L, d = fwd ? cyc : p.L * 2 - cyc;
      let acc = 0, x = p.pts[0][0], z = p.pts[0][1], dx = 0, dz = 0;
      for (let i = 1; i < p.pts.length; i++) { const a = p.pts[i - 1], b = p.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= acc + L || i === p.pts.length - 1) { const f = Math.min(1, (d - acc) / L); x = a[0] + (b[0] - a[0]) * f; z = a[1] + (b[1] - a[1]) * f; dx = (b[0] - a[0]) / L; dz = (b[1] - a[1]) / L; break; } acc += L; }
      if (!fwd) { dx = -dx; dz = -dz; }
      p.s.position.set(x, 0.3, z); p.sh.position.set(x, 0.42, z);
      // 카메라에서 본 방향: 멀어지면 뒷모습, 다가오면 앞모습, 옆이면 옆모습
      const away = dx * camDir.x + dz * camDir.z, right = dx * -camDir.z + dz * camDir.x, ph = Math.floor(now / 0.17 + p.h) % 2;
      let k2, flip = 1; if (Math.abs(right) > Math.abs(away) * 0.9) { k2 = 2 + ph; flip = right > 0 ? -1 : 1; } else if (away > 0) k2 = 4 + ph; else k2 = ph;
      const url = o.wf(p.av, k2); if (p.last !== url + flip) { p.s.material.map = tex(url); p.s.material.needsUpdate = true; p.last = url + flip; p.s.scale.x = Math.abs(p.s.scale.x) * flip; }
      p.s.position.y = 0.3 + (ph ? 0.12 : 0);
    });
    trucks.forEach((t) => { const tt = performance.now() / 1000 - t.T0; let d; if (tt < t.wait) d = 0; else { const f = (tt - t.wait) / t.dur; d = (t.loop ? f % 1 : Math.min(1, f)) * t.r.L; } const q = at(t.r.pts, d); t.m.position.set(q.x, 0.25, q.z); t.m.rotation.y = q.a; v3.set(q.x, 7, q.z); proj(v3, t.lab); });
    tags.forEach((t) => proj(t.p, t.d));
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    addTruck,
    zoom: (f) => { const off = cam.position.clone().sub(ctl.target); off.multiplyScalar(f); const L = off.length(); if (L < ctl.minDistance || L > ctl.maxDistance) return; cam.position.copy(ctl.target).add(off); },
    reset: () => { cam.position.set(92, 108, 138); ctl.target.set(8, 0, 4); },
    focus: (key) => { const L0 = LOTS[key]; if (!L0) return; const off = cam.position.clone().sub(ctl.target).setLength(110); ctl.target.set(L0[0], 0, L0[1]); cam.position.copy(ctl.target).add(off); },
    stop: () => { alive = false; },
  };
}
