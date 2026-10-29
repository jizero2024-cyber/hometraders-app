// 홈트 사무실 · 창고 3D (10/29 대표 "창고랑 홈트사무실도 마을처럼 실제처럼") — 앞벽을 뗀 인형집 모양.
// 직원(AI 작업)·물건은 실제 자료 숫자만 보여 줌 — 숫자는 town.js 가 공유 DB 에서 읽어 tag()/setIdle() 로 넣음.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { critter } from './kit3d.js?v=3';

function base(host, o) {
  let W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none';
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const over = document.createElement('div'); over.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'; host.appendChild(over);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(o.bg || '#D8E9FA');
  const cam = new THREE.PerspectiveCamera(34, W / H, 1, 800); cam.position.set(...o.cam);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.target.set(...o.target); ctl.enableDamping = true; ctl.minDistance = 25; ctl.maxDistance = 300; ctl.maxPolarAngle = 1.45; ctl.minAzimuthAngle = -1.1; ctl.maxAzimuthAngle = 1.1; ctl.update();
  const hr = new Date().getHours(), night = hr >= 18 || hr < 6;
  scene.add(new THREE.HemisphereLight(night ? '#C9D4F2' : '#F4FAFF', '#8A8070', night ? 1.0 : 1.2));
  const sun = new THREE.DirectionalLight(night ? '#FFE2B8' : '#FFF6E6', night ? 1.2 : 2.0); sun.position.set(-60, 120, 90); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -60, near: 10, far: 360 }); sun.shadow.normalBias = 0.5; scene.add(sun);
  const MC = {}; const mat = (c, ex = {}) => (MC[c + JSON.stringify(ex)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, ...ex }));
  const box = (w, h, d, c, x, y, z, p = scene, ex) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, ex)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const cyl = (r, h, c, x, y, z, p = scene, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const pick = []; const clickable = (obj, key) => { obj.traverse((m) => { if (m.isMesh) { m.userData.key = key; pick.push(m); } }); };
  const tags = []; const tag = (key, html, x, y, z) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;z-index:2'; d.innerHTML = html; d.onclick = () => o.onPick(key); over.appendChild(d); const t = { d, p: new THREE.Vector3(x, y, z) }; tags.push(t); return t; };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  const hit = (e) => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(pick, false)[0]; return h ? h.object.userData.key : null; };
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const k = hit(e); if (k) o.onPick(k); } });
  renderer.domElement.addEventListener('pointermove', (e) => { if (!e.buttons) renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'grab'; });
  const onResize = () => { W = window.innerWidth; H = window.innerHeight; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize);
  const v3 = new THREE.Vector3(), clock = new THREE.Clock(), ticks = [];
  const frame = () => {
    if (!host.isConnected || (o.alive && !o.alive())) { window.removeEventListener('resize', onResize); renderer.dispose(); host.remove(); return; }
    const dt = Math.min(0.05, clock.getDelta()); ctl.update(); ticks.forEach((f) => f(dt, clock.elapsedTime));
    tags.forEach((t) => { v3.copy(t.p).project(cam); const vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; t.d.style.display = vis ? '' : 'none'; if (vis) t.d.style.transform = `translate(${((v3.x + 1) / 2 * W).toFixed(1)}px,${((1 - v3.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`; });
    renderer.render(scene, cam); requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return { THREE, scene, cam, ctl, mat, box, cyl, clickable, tag, ticks, night, over };
}
const pill = (txt, bg, fg, dot) => `<div style="display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:${bg};color:${fg};font:800 11px Pretendard,sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(30,40,60,.18)">${dot ? `<span style="width:7px;height:7px;border-radius:50%;background:${dot}"></span>` : ''}${txt}</div>`;
export const DOT = { ok: '#34C759', bad: '#FF453A', run: '#2F7BF6', idle: '#B4B2A9' };

// ── 사무실: 5층 + 앞마당 ──
export function office(host, o) {
  const K = base(host, { ...o, cam: [18, 32, 128], target: [0, 24, 4], bg: '#D8E9FA' });
  const { scene, box, cyl, mat, clickable, tag, ticks } = K;
  const FW = 46, FD = 20, FH = 10, NF = 5;   // 층고 높게 (10/30 대표 "층고 낮아 캐릭터 가려져")
  box(420, 1, 300, '#9ED27F', 0, -1.2, 20); box(90, 1, 60, '#D9D3C6', 0, -1, 8); box(420, 0.2, 10, '#6B7280', 0, -0.2, 46);   // 땅 · 앞 길 (양옆까지)
  for (let i = 0; i < 40; i++) { const sx = i % 2 ? 1 : -1, x = sx * (52 + (i * 17) % 120), z = -30 + (i * 23) % 70; const t = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 0), mat('#5DAA58', { flatShading: true })); t.position.set(x, 4, z); t.castShadow = true; scene.add(t); box(0.6, 2, 0.6, '#8A5A35', x, -0.5, z); }
  box(64, 0.3, 22, '#8CCB6A', 0, 0, 22);   // 마당 잔디
  const FLOORS = [['#F6F1EA', '1F 디자인실'], ['#EEF3FA', '2F 배차 · 통신'], ['#FBF4EC', '3F 서류 · 확인'], ['#F1EFEA', '4F 회계'], ['#FFF3E8', '5F 대표실']];
  FLOORS.forEach(([c, name], f) => {
    const y = f * FH; box(FW, 0.5, FD, c, 0, y, 0).castShadow = false; box(FW, FH, 0.5, '#FFFFFF', 0, y + 0.5, -FD / 2);
    const lp = new THREE.PointLight('#FFF1DA', 40, 40, 1.4); lp.position.set(0, y + FH - 1, 2); scene.add(lp);
    box(0.5, FH, FD, '#F4F1EC', -FW / 2, y + 0.5, 0); const gl = box(0.3, FH - 0.5, FD, '#CDE6F5', FW / 2, y + 0.5, 0, scene, { transparent: true, opacity: 0.35, roughness: 0.1 }); gl.castShadow = false;
    tag(null, pill(name, 'rgba(255,255,255,.92)', '#6B5E55'), FW / 2 - 4, y + 1.2, FD / 2 - 0.5).d.style.pointerEvents = 'none';
  });
  box(FW + 1, 0.8, FD + 1, '#E8732C', 0, NF * FH, 0).castShadow = false;   // 지붕
  const logoT = new THREE.TextureLoader().load('/icons/logo-full.png'); logoT.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: logoT, transparent: true })); logo.position.set(0, NF * FH + 4.5, 0); scene.add(logo);
  // 계단 (오른쪽 바깥)
  for (let f = 0; f < NF; f++) for (let i = 0; i < 8; i++) box(5, 0.4, 2, '#E3DED6', FW / 2 + 3.5, f * FH + i * (FH / 8), -FD / 2 + 2 + i * 2.1);
  const screens = {};   // 책상 모니터 화면 — 직원 실제 숫자 (setScreen)
  const scr = (w2, h2) => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.MeshStandardMaterial({ map: t, emissive: '#FFFFFF', emissiveMap: t, emissiveIntensity: 0.55 }); const me = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), m2); return { c, t, me }; };
  const drawScr = (S2, lines2, bg = '#1F3A5F') => { const g2 = S2.c.getContext('2d'); g2.fillStyle = bg; g2.fillRect(0, 0, 256, 160); g2.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) g2.fillRect(14, 70 + i * 16, 120 + (i * 37) % 100, 7); g2.fillStyle = '#FFFFFF'; g2.font = '800 30px Pretendard, sans-serif'; g2.fillText(lines2[0] || '', 14, 38); g2.fillStyle = '#9FD0FF'; g2.font = '700 22px Pretendard, sans-serif'; g2.fillText(lines2[1] || '', 14, 66); S2.t.needsUpdate = true; };
  const desk = (x, f, z = -1, c = '#D9B88C', k) => { const y = f * FH + 0.5; box(6, 0.3, 3, c, x, y + 1.6, z); [-2.7, 2.7].forEach((a) => box(0.3, 1.6, 2.6, '#BFA27A', x + a, y, z));
    box(0.25, 0.9, 0.25, '#3A3F47', x + 1.9, y + 1.9, z - 0.6); box(2.8, 1.75, 0.15, '#2B2F36', x + 1.9, y + 2.7, z - 0.6); const S2 = scr(2.6, 1.55); S2.me.position.set(x + 1.9, y + 3.58, z - 0.52); scene.add(S2.me); drawScr(S2, ['', '']); if (k) screens[k] = S2;
    box(1.6, 0.06, 0.6, '#E6E8EB', x + 1.9, y + 1.92, z + 0.5); const mug = cyl(0.18, 0.35, '#FFFFFF', x - 1.8, y + 1.92, z + 0.4, scene, 10); mug.castShadow = false; };
  // 직원 자리 (AI 작업) — o.staff: [{k,who,f,x}]
  const seats = {};
  (o.staff || []).forEach((s) => {
    desk(s.x, s.f, -1, s.k === 'seal' ? '#F4F2EE' : '#D9B88C', s.k); const c = critter(s.av); c.g.scale.setScalar(2.3); c.g.position.set(s.x - 1.2, s.f * FH + 0.5, -3.6); c.g.rotation.y = 0; scene.add(c.g); clickable(c.g, s.k);
    seats[s.k] = { c, home: [s.x - 1.2, s.f * FH + 0.5, -3.6], at: 'desk', s };
  });
  // 물건
  const OBJ = {};
  { const f = 2, y = f * FH + 0.5, g = new THREE.Group(); g.position.set(13, y, -6); scene.add(g); box(4, 2.6, 3, '#E6E8EB', 0, 0, 0, g); box(3.4, 0.3, 2.2, '#FFFFFF', 0, 2.6, 0.2, g); box(2.8, 0.1, 2, '#FFFFFF', 0, 1.5, 1.6, g); clickable(g, 'printer'); OBJ.printer = [13, y + 4.5, -6]; }
  { const f = 2, y = f * FH + 0.5, g = new THREE.Group(); g.position.set(-14, y, -9.6); scene.add(g); box(10, 4.6, 0.3, '#FFFFFF', 0, 1.2, 0, g); box(10.4, 0.3, 0.6, '#9AA5B1', 0, 1.0, 0.2, g); [['#FFE680', -3], ['#FFB5C8', -0.5], ['#B5E3FF', 2], ['#C8F0B0', 3.5]].forEach(([c, x], i) => box(1.6, 1.4, 0.05, c, x, 2.2 + (i % 2) * 1.6, 0.2, g)); clickable(g, 'board'); OBJ.board = [-14, y + 6.6, -9.4]; }
  { const f = 0, y = 0.5, g = new THREE.Group(); g.position.set(-16, y, -7.5); scene.add(g); box(6, 5, 1.6, '#C9A26B', 0, 0, 0, g); [0, 1, 2].forEach((r) => { box(5.6, 0.2, 1.4, '#B08A55', 0, 1 + r * 1.5, 0.1, g); [0, 1, 2, 3].forEach((i) => box(1, 1.2, 0.15, ['#E8732C', '#3F7FE0', '#2E9A5A', '#F5B400'][(i + r) % 4], -2.1 + i * 1.4, 1.2 + r * 1.5, 0.6, g, null)); }); clickable(g, 'pamph'); OBJ.pamph = [-16, y + 6.6, -7.5]; }
  { const y = 0.5, g = new THREE.Group(); g.position.set(-7, y, 1.5); scene.add(g); cyl(3.8, 0.3, '#E2C9A0', 0, 2.1, 0, g, 32); cyl(0.5, 2.1, '#F2F0EA', 0, 0, 0, g); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, ch = new THREE.Group(); ch.position.set(Math.cos(a) * 5, 0, Math.sin(a) * 5); ch.rotation.y = -a + Math.PI / 2; g.add(ch); box(1.5, 0.35, 1.5, '#FFFFFF', 0, 1.2, 0, ch); box(1.5, 1.6, 0.3, '#FFFFFF', 0, 1.5, -0.65, ch); [-0.6, 0.6].forEach((lx) => [-0.6, 0.6].forEach((lz) => box(0.12, 1.2, 0.12, '#C9A26B', lx, 0, lz, ch))); } [[-1.2, 0.4], [1, -0.6]].forEach(([a, b]) => box(1.2, 0.05, 0.9, '#FFFFFF', a, 2.42, b, g)); clickable(g, 'meet'); OBJ.meet = [-7, y + 5, 1.5]; }
  { const g = new THREE.Group(); g.position.set(20, 0.3, 26); scene.add(g); cyl(0.25, 2.6, '#555', 0, 0, 0, g, 8); box(2.6, 2.2, 1.8, '#E8732C', 0, 2.6, 0, g); g.scale.setScalar(1.3); clickable(g, 'mail'); OBJ.mail = [20, 7.5, 26]; }
  // 꾸미기 (10/29 대표 "힉스필드 사무실 그림처럼 — 프린터 · 모니터 · 맥북 · 어항 · 동그란 회의 테이블 · 연못 · 빈백 · 와인바")
  const plant = (x, y, z, k = 1) => { cyl(0.5 * k, 0.9 * k, '#F2EEE6', x, y, z, scene, 12); for (let i = 0; i < 4; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 * k, 0), mat(['#5DAA58', '#4E9E52', '#6FBF5E'][i % 3], { flatShading: true })); lf.position.set(x + Math.cos(i * 1.7) * 0.4 * k, y + (1.4 + i * 0.35) * k, z + Math.sin(i * 1.7) * 0.4 * k); lf.castShadow = true; scene.add(lf); } };
  const shelf = (x, y, z, w2, rows, colors) => { box(w2, rows * 1.3 + 0.3, 1.2, '#C9A26B', x, y, z); for (let r = 0; r < rows; r++) { box(w2 - 0.2, 0.12, 1.1, '#B08A55', x, y + 0.2 + r * 1.3, z + 0.05); for (let i = 0; i < Math.floor(w2 / 0.5) - 1; i++) box(0.38, 0.95, 0.85, colors[(i + r) % colors.length], x - w2 / 2 + 0.45 + i * 0.5, y + 0.32 + r * 1.3, z + 0.12); } };
  const win = (x, y, z, w2, h2) => { box(w2 + 0.3, h2 + 0.3, 0.2, '#FFFFFF', x, y, z); const pane = box(w2, h2, 0.1, '#BFE3F7', x, y + 0.15, z + 0.08, scene, { roughness: 0.1, emissive: '#BFE3F7', emissiveIntensity: 0.25 }); pane.castShadow = false; box(0.12, h2, 0.15, '#FFFFFF', x, y + 0.15, z + 0.12); box(w2, 0.12, 0.15, '#FFFFFF', x, y + 0.15 + h2 / 2, z + 0.12); };
  const BIND = ['#5D7FBF', '#FFFFFF', '#9AB6E0', '#E8E2D6', '#3F5F9A'];
  // 5F 대표실 — 통창 · 테라리움 어항 · 맥북 · 라운지 의자 · 커피 바
  { const y = 4 * FH + 0.5; win(-10, y + 1.6, -FD / 2 + 0.35, 18, 6.6); win(9, y + 1.6, -FD / 2 + 0.35, 10, 6.6);
    const tg = new THREE.Group(); tg.position.set(-16, y, -3); scene.add(tg); box(3, 1.4, 2, '#C9A26B', 0, 0, 0, tg); const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 18), new THREE.MeshStandardMaterial({ color: '#DDF3FF', transparent: true, opacity: 0.28, roughness: 0.05 })); bowl.position.set(0, 2.8, 0); tg.add(bowl);
    const water = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), new THREE.MeshStandardMaterial({ color: '#7FC8F0', transparent: true, opacity: 0.45 })); water.position.set(0, 2.8, 0); tg.add(water);
    box(1.8, 0.25, 1.8, '#E8D6A8', 0, 1.65, 0, tg); const fishes = [0, 1].map((i) => { const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(i ? '#FF8A3C' : '#F7C82F')); f2.scale.set(1.4, 0.8, 0.6); tg.add(f2); return f2; });
    ticks.push((dt, t) => fishes.forEach((f2, i) => { const a = t * (0.8 + i * 0.3) + i * 3; f2.position.set(Math.cos(a) * 0.7, 2.6 + Math.sin(t * 1.3 + i) * 0.2, Math.sin(a) * 0.7); f2.rotation.y = -a; }));
    plant(-19.5, y, -7, 1.3); plant(19.5, y, -7, 1.1);
    const lc = new THREE.Group(); lc.position.set(-10, y, -4); lc.rotation.y = 0.5; scene.add(lc); box(2.2, 0.6, 2.2, '#F6F2EA', 0, 0.9, 0, lc); box(2.2, 2.0, 0.5, '#F6F2EA', 0, 1.4, -1.0, lc); box(2.4, 0.6, 0.3, '#A8774A', 0, 0.6, 1.0, lc); box(1.6, 0.5, 1.4, '#F6F2EA', 0, 0.5, 2.2, lc);
    box(7, 3, 2.2, '#A8774A', 16, y, -7.6); box(7.2, 0.25, 2.4, '#E9E2D6', 16, y + 3, -7.6); box(1.4, 1.5, 1.2, '#B8BEC6', 14.5, y + 3.25, -7.8, scene, { metalness: 0.6, roughness: 0.3 }); shelf(16, y + 4.4, -9.2, 6, 1, ['#FFFFFF', '#F2C33A', '#5DAA58']);
    const mb = new THREE.Group(); mb.position.set(9.6, y + 1.92, -0.6); scene.add(mb); box(1.9, 0.08, 1.3, '#C9CDD2', 0, 0, 0, mb, { metalness: 0.5, roughness: 0.35 }); const lid = new THREE.Group(); lid.position.set(0, 0.06, -0.62); lid.rotation.x = -0.25; mb.add(lid); box(1.9, 1.25, 0.06, '#C9CDD2', 0, 0, 0, lid, { metalness: 0.5, roughness: 0.35 }); const ms = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), new THREE.MeshStandardMaterial({ color: '#9FD0FF', emissive: '#9FD0FF', emissiveIntensity: 0.6 })); ms.position.set(0, 0.62, 0.04); lid.add(ms); }
  // 4F 회계 — 금고 · 파일 선반 · 창
  { const y = 3 * FH + 0.5; const sf = new THREE.Group(); sf.position.set(-19, y, -6); scene.add(sf); box(3, 3.4, 2.6, '#8E959C', 0, 0, 0, sf, { metalness: 0.4, roughness: 0.45 }); cyl(0.6, 0.15, '#C9CDD2', 0, 1.8, 1.3, sf, 16).rotation.x = Math.PI / 2; box(0.2, 0.9, 0.2, '#C9A13A', 1.0, 1.5, 1.35, sf);
    shelf(-6, y, -9.2, 7, 3, BIND); shelf(4, y, -9.2, 6, 3, BIND); win(15, y + 2.2, -FD / 2 + 0.35, 7, 3); plant(19.5, y, -6, 1); }
  // 3F 서류 · 확인 — 큰 복합기 · 박스 선반 · 상자
  { const y = 2 * FH + 0.5; shelf(-2, y, -9.2, 6, 3, BIND); shelf(6, y, -9.2, 5, 3, ['#D9B88C', '#C9A26B', '#E8D6A8']); for (let i = 0; i < 5; i++) box(1.4, 1.1, 1.2, '#D9B88C', 18 - (i % 3) * 1.5, y + Math.floor(i / 3) * 1.1, 2 + (i % 2) * 1.2); plant(-19.5, y, 4, 1); }
  // 2F 배차 · 통신 — 큰 모니터 벽 (배차 지도 · 출고 흐름)
  { const y = 1 * FH + 0.5; const big = [scr(9, 4.4), scr(7, 4.4)]; [[-12, big[0]], [2, big[1]]].forEach(([x, S2]) => { box((S2 === big[0] ? 9 : 7) + 0.5, 4.9, 0.3, '#2B2F36', x, y + 1.6, -FD / 2 + 0.45); S2.me.position.set(x, y + 4.05, -FD / 2 + 0.65); scene.add(S2.me); });
    screens.wallA = big[0]; screens.wallB = big[1]; drawScr(big[0], ['배차 지도', ''], '#22406A'); drawScr(big[1], ['출고 흐름', ''], '#2A4A3A'); win(15, y + 2.2, -FD / 2 + 0.35, 7, 3); plant(19.5, y, -6, 1); }
  // 1F 디자인실 · 안내 — 둥근 안내 데스크 · 큰 화면 · 소파 · 진열장
  { const y = 0.5; const rc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.2, 32, 1, true, -0.2, Math.PI * 1.1), new THREE.MeshStandardMaterial({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: 0.5 })); rc.position.set(14, y + 1.1, 3); rc.castShadow = true; scene.add(rc);
    box(1.6, 0.08, 1.1, '#C9CDD2', 13, y + 2.25, 3.5, scene, { metalness: 0.5 }); const tv = scr(8, 4); box(8.4, 4.4, 0.3, '#2B2F36', -6, y + 2.4, -FD / 2 + 0.45); tv.me.position.set(-6, y + 4.6, -FD / 2 + 0.65); scene.add(tv.me); screens.tv = tv; drawScr(tv, ['홈트레이더스', '아이큐브 카탈로그'], '#E9F1F8');
    box(6, 1.2, 2.4, '#F6F3EE', 6, y, -7.6); box(6, 1.6, 0.6, '#F6F3EE', 6, y + 1.2, -8.6); [-2, 2].forEach((a) => box(0.6, 1.1, 2.4, '#F6F3EE', 6 + a * 1.5, y + 1.2, -7.6));
    plant(-19.5, y, 6, 1.2); plant(19.5, y, -6, 1); }
  // 마당 — 연못 · 해먹 · 파라솔 · 와인바(퍼골라 · 줄전구 · 와인병 · 스툴 · 오크통) · 테이블 · 자전거 · 울타리
  { const pond = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.2, 32), mat('#7EC8F0', { roughness: 0.15 })); pond.scale.z = 0.62; pond.position.set(-2, 0.45, 30); scene.add(pond);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mat('#B9B3A6', { flatShading: true })); r2.position.set(-2 + Math.cos(a) * 4.4, 0.55, 30 + Math.sin(a) * 2.8); scene.add(r2); }
    const lily = [0, 1, 2].map((i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), mat('#5DAA58')); l.rotation.x = -Math.PI / 2; l.position.set(-3 + i * 1.4, 0.58, 29.5 + (i % 2) * 0.8); scene.add(l); return l; });
    ticks.push((dt, t) => lily.forEach((l, i) => { l.position.y = 0.58 + Math.sin(t * 1.5 + i) * 0.03; }));
    [[-13, 22], [9, 22]].forEach(([x, z]) => { box(0.6, 4, 0.6, '#8A5A35', x, 0.3, z); const tp = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), mat('#5DAA58', { flatShading: true })); tp.position.set(x, 6, z); tp.castShadow = true; scene.add(tp); });
    [-1, 1].forEach((sg) => { const hp = box(11, 0.14, 1.8, '#BFE6F2', -2 + sg * 5.4, 1.9, 22); hp.rotation.z = sg * 0.13; });   // 해먹
    cyl(0.12, 3.8, '#E9E9E9', -22, 0.3, 30, scene, 8); const um = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.2, 16), mat('#FFFFFF')); um.position.set(-22, 4.6, 30); um.castShadow = true; scene.add(um);
    const wb = new THREE.Group(); wb.position.set(26, 0.3, 26); scene.add(wb); [[-4.5, -2], [4.5, -2], [-4.5, 3], [4.5, 3]].forEach(([a, b]) => box(0.4, 5.6, 0.4, '#7A5232', a, 0, b, wb)); box(9.8, 0.4, 5.8, '#6B4A34', 0, 5.6, 0.5, wb);
    box(8, 3.4, 0.5, '#8A5E3C', 0, 0, -2, wb); for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) cyl(0.14, 0.75, ['#3E2A2A', '#2F4A2F', '#5A1E2A'][i % 3], -3.6 + i * 0.9, 1.6 + r * 1.0, -1.7, wb, 8);
    box(8, 2.2, 1.2, '#A8774A', 0, 0, 1.4, wb); box(8.4, 0.2, 1.6, '#C9A26B', 0, 2.2, 1.4, wb); [-3, -1, 1, 3].forEach((a) => { cyl(0.45, 0.15, '#7A5232', a, 1.6, 3, wb, 12); cyl(0.08, 1.6, '#555', a, 0, 3, wb, 6); });
    for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: '#FFF2C4', emissive: '#FFD27A', emissiveIntensity: 1.2 })); b.position.set(-4.5 + i * 0.82, 5.3 - Math.sin(i / 11 * Math.PI) * 0.5, 3.2); wb.add(b); }
    cyl(0.8, 1.6, '#8A5E3C', 6, 0, 0, wb, 14); cyl(0.8, 1.6, '#8A5E3C', -6.2, 0, 2.6, wb, 14);
    const ct = new THREE.Group(); ct.position.set(16, 0.3, 30); scene.add(ct); cyl(1.2, 0.15, '#A8774A', 0, 2, 0, ct, 18); cyl(0.12, 2, '#7A5232', 0, 0, 0, ct, 8); [0, 2.1, 4.2].forEach((a) => { const c2 = new THREE.Group(); c2.position.set(Math.cos(a) * 2, 0, Math.sin(a) * 2); c2.rotation.y = -a - Math.PI / 2; ct.add(c2); box(1, 0.2, 1, '#A8774A', 0, 1.1, 0, c2); box(1, 1.2, 0.15, '#A8774A', 0, 1.2, -0.45, c2); }); cyl(0.12, 0.7, '#2F4A2F', 0.3, 2.15, 0.2, ct, 8);
    for (let x = -30; x <= 30; x += 1.5) { if (Math.abs(x - 0) < 4) continue; box(0.3, 1.4, 0.15, '#FFFFFF', x, 0.3, 36); } box(60, 0.2, 0.15, '#FFFFFF', 0, 1.2, 36.1);
    box(1.4, 3, 1.4, '#F2F0EA', -3.8, 0.3, 36); box(1.4, 3, 1.4, '#F2F0EA', 3.8, 0.3, 36); for (let i = 0; i < 9; i++) box(0.2, 2, 0.12, '#C9CDD2', -2.8 + i * 0.7, 0.3, 36);
    [[22, 34, '#5D9BF2'], [25, 34, '#F7C82F']].forEach(([x, z, c]) => { const bk = new THREE.Group(); bk.position.set(x, 0.3, z); bk.rotation.y = 0.3; scene.add(bk); [-1, 1].forEach((s2) => { const w2 = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 6, 20), mat('#2B2B2B')); w2.position.set(s2 * 0.9, 0.65, 0); bk.add(w2); }); box(1.8, 0.1, 0.1, c, 0, 1.1, 0, bk); box(0.1, 0.6, 0.1, c, -0.4, 0.8, 0, bk); });
    [[-28, 34], [-10, 34], [10, 34], [28, 34]].forEach(([x, z]) => { cyl(0.12, 2.4, '#4A5058', x, 0.3, z, scene, 8); const lb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: '#FFF2C4', emissive: '#FFD27A', emissiveIntensity: 1 })); lb.position.set(x, 3, z); scene.add(lb); }); }
  // 마당 — 빈백 (할 일 0 인 직원) · 와인바
  const REST = [[-20, 24], [-15, 25], [-10, 24], [-5, 26], [0, 25], [5, 26], [10, 24], [-24, 28]];
  REST.slice(0, 5).forEach(([x, z], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 14), mat(['#F7A8C8', '#FFE07A', '#A6E3B8', '#B5D4F4', '#F0B48A'][i])); b.scale.y = 0.6; b.position.set(x, 0.9, z + 1.4); b.castShadow = true; scene.add(b); });
  // 걷기 — 자리 ↔ 마당
  const moving = [];
  const goTo = (k, to, after) => { const st = seats[k]; if (!st) return; const from = st.c.g.position.clone(); const pts = [from, new THREE.Vector3(FW / 2 + 3.5, from.y, from.z + 6), new THREE.Vector3(FW / 2 + 3.5, to.y, to.z - 6), to]; moving.push({ st, pts, i: 0, after }); };
  ticks.push((dt) => {
    Object.values(seats).forEach((st) => { if (st.at === 'desk') st.c.type(dt); else if (st.at === 'rest') st.c.sit(); });
    for (let n = moving.length - 1; n >= 0; n--) { const mv = moving[n], p = mv.st.c.g.position, tgt = mv.pts[mv.i + 1]; if (!tgt) { moving.splice(n, 1); if (mv.after) mv.after(); continue; } const d = tgt.clone().sub(p), L = d.length(), step = dt * 9; if (L <= step) { p.copy(tgt); mv.i++; } else { d.normalize(); p.addScaledVector(d, step); mv.st.c.face(d.x, d.z); mv.st.c.walk(dt); } }
  });
  const tagsBy = {};
  return {
    seats, OBJ, FH,
    setScreen(k, lines2, bg) { const S2 = screens[k]; if (S2) drawScr(S2, lines2, bg); },
    setTag(key, html, pos) { if (tagsBy[key]) { tagsBy[key].d.innerHTML = html; if (pos) tagsBy[key].p.set(...pos); return; } const p = pos || (seats[key] ? [seats[key].home[0], seats[key].home[1] + 7.2, seats[key].home[2]] : OBJ[key]); if (p) tagsBy[key] = tag(key, html, ...p); },
    setIdle(k, idle, ri) {   // 할 일 0 → 마당 빈백, 생기면 자리로
      const st = seats[k]; if (!st) return; const want = idle ? 'rest' : 'desk'; if (st.at === want || st.at === 'walk') return;
      st.at = 'walk'; const [hx, hy, hz] = st.home, [rx, rz] = REST[ri % REST.length];
      if (idle) goTo(k, new THREE.Vector3(rx, 0.3, rz), () => { st.at = 'rest'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(rx, 5.2, rz); });
      else goTo(k, new THREE.Vector3(hx, hy, hz), () => { st.at = 'desk'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(hx, hy + 7.2, hz); });
    },
    meeting(order, say, done) {   // 회의 — 대표실 테이블로 모여 한 명씩 실제 숫자 보고
      const [mx, my, mz] = OBJ.meet, ks = order.filter((k) => seats[k]);
      ks.forEach((k, i) => { const a = i / ks.length * Math.PI * 2, st = seats[k]; st.at = 'walk'; goTo(k, new THREE.Vector3(mx + Math.cos(a) * 6.4, my - 4.5, mz + Math.sin(a) * 6.4), () => { st.at = 'meet'; st.c.face(-Math.cos(a), -Math.sin(a)); }); });
      let t = 7000; ks.forEach((k) => { setTimeout(() => say(k), t); t += 2400; });
      setTimeout(() => { ks.forEach((k) => { const st = seats[k]; st.at = 'walk'; goTo(k, new THREE.Vector3(...st.home), () => { st.at = 'desk'; st.c.g.rotation.y = 0; }); }); if (done) done(); }, t + 600);
    },
  };
}

// ── 창고: 높은 창고 안 (실제 재고만) ──
export function warehouse(host, o) {
  const K = base(host, { ...o, cam: [20, 46, 92], target: [0, 8, 0], bg: '#E6E2DA' });
  const { scene, box, cyl, clickable, tag, ticks } = K;
  const WW = 70, WD = 40, WH = 22;
  box(420, 1, 300, '#B9B3A6', 0, -1.6, 30); box(WW, 0.6, WD, '#C9C4BA', 0, -0.6, 0); box(WW, WH, 0.6, '#EDEFF2', 0, 0, -WD / 2); box(0.6, WH, WD, '#E4E7EB', -WW / 2, 0, 0); box(0.6, WH, WD, '#E4E7EB', WW / 2, 0, 0);
  box(WW + 1, 0.8, 4, '#3F7FE0', 0, WH, -WD / 2 + 1.4);
  for (let i = -3; i <= 3; i++) box(0.3, 0.02, WD - 4, '#F5C431', i * 9, 0.01, 0);
  // 배치 (10/30 대표): 문(앞)에서 양옆 벽을 따라 랙 — 철물류. 구조재는 랙이 아니라 바닥에 번들로.
  const RX = [-WW / 2 + 3.2, WW / 2 - 3.2], RZ = [12, 4, -4, -12];   // 랙 칸 (벽 따라 문 → 안쪽)
  RX.forEach((x) => { RZ.forEach((z) => { [-3.4, 3.4].forEach((dz) => [-1.3, 1.3].forEach((dx) => box(0.35, 11, 0.35, '#E8732C', x + dx, 0, z + dz))); [0.3, 3.9, 7.5].forEach((y) => box(3.2, 0.3, 7.2, '#3F6FB8', x, y, z)); }); });
  const hw = (o.hw || []).slice(0, 24), hwC = ['#9AA5B1', '#C9CDD2', '#F5B400', '#B8BEC6', '#7E8A96'];
  hw.forEach((it, i) => {
    const side = i % 2, slot = Math.floor(i / 2), z = RZ[slot % 4], lvl = Math.floor(slot / 4) % 3, x = RX[side], y = [0.6, 4.2, 7.8][lvl];
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g); for (let k = 0; k < 3; k++) box(2.4, 1.1, 1.8, hwC[(i + k) % hwC.length], 0, (k === 2 ? 1.1 : 0), -2 + k * 2.2 - (k === 2 ? 2.2 : 0), g); clickable(g, 'item:' + it.key);
    tag('item:' + it.key, pill(`${it.name} ${Math.floor(it.qty)}${it.unit || ''}`, 'rgba(255,255,255,.95)', '#4A3F3A'), x + (side ? -1.6 : 1.6), y + 2.6, z);
  });
  // 구조재 — 바닥 번들 (o.items: 실사 재고표 줄, plt = 파렛트 수)
  const items = (o.items || []).slice(0, 12);
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4), x0 = -15 + col * 10, z0 = -12 + row * 9, n = Math.max(1, Math.min(8, Number(it.plt) || Math.ceil(it.qty / 150)));
    const len = /16/.test(it.name.split('*')[2] || '') ? 7.2 : /13|3900/.test(it.name) ? 5.6 : 5.2;
    const g = new THREE.Group(); g.position.set(x0, 0, z0); scene.add(g);
    for (let k = 0; k < n; k++) { const sx = (k % 2) * 3.2 - 1.6, sy = Math.floor(k / 2) * 1.5; box(2.9, 0.25, len, '#B88B55', sx, sy, 0, g); box(2.7, 1.2, len - 0.2, k % 3 === 2 ? '#D7B37A' : '#E2B87A', sx, sy + 0.25, 0, g); box(2.72, 0.06, 0.1, '#FFFFFF', sx, sy + 0.9, len / 3, g); box(2.72, 0.06, 0.1, '#FFFFFF', sx, sy + 0.9, -len / 3, g); }
    clickable(g, 'item:' + it.key);
    tag('item:' + it.key, pill(`${it.name} ${Math.floor(it.qty)}${it.plt ? ` · ${it.plt}PLT` : ''}`, 'rgba(255,255,255,.95)', '#7A5A00'), x0, Math.ceil(n / 2) * 1.5 + 1.6, z0);
  });
  // 키오스크 · 지게차 · 불독 · 노훈님
  { const g = new THREE.Group(); g.position.set(-20, 0, 17); scene.add(g); box(2.4, 5.4, 1.6, '#FFFFFF', 0, 0, 0, g); box(2, 2.6, 0.1, '#2B2F36', 0, 2.4, 0.82, g); box(1.8, 2.3, 0.05, '#9FD0FF', 0, 2.55, 0.88, g, { emissive: '#9FD0FF', emissiveIntensity: 0.5 }); clickable(g, 'kiosk'); }
  const fk = new THREE.Group(); scene.add(fk); box(3, 2.2, 4.2, '#F5B400', 0, 0.6, 0, fk); box(0.3, 6, 0.3, '#333', -1, 0, 2.3, fk); box(0.3, 6, 0.3, '#333', 1, 0, 2.3, fk); const fork = box(2.6, 0.25, 2.6, '#333', 0, 0.4, 3.4, fk); box(2.8, 0.2, 2.8, '#B88B55', 0, 0.65, 3.4, fork.parent);
  const dog = critter('dog'); dog.g.scale.setScalar(1.6); scene.add(dog.g); const noh = critter('worker'); noh.g.scale.setScalar(1.7); scene.add(noh.g); clickable(noh.g, 'noh');
  const nohT = tag('noh', pill('노훈님 · 창고', '#fff', '#4A3F3A', DOT.ok), 0, 0, 0);
  // 차 — 오늘 천안창고에서 실은 차만 (o.drivers: [{key, type, plate, label}]) · 차종 모양 · 번호판 (10/30 대표)
  const plateTex = (txt) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g2 = c.getContext('2d'); g2.fillStyle = '#FFFFFF'; g2.fillRect(0, 0, 256, 64); g2.strokeStyle = '#1E1E1E'; g2.lineWidth = 4; g2.strokeRect(3, 3, 250, 58); g2.fillStyle = '#1E1E1E'; g2.font = '900 34px Pretendard, sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(txt || '번호 없음', 128, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t }); };
  const wheel = (p, x, z, r = 0.55) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.42, 16), mat('#1E1E1E')); w.rotation.z = Math.PI / 2; w.position.set(x, r, z); w.castShadow = true; p.add(w); };
  const vehicle = (type, plate) => {   // 길이 방향 = z (+z 가 앞)
    const g = new THREE.Group(), pm = plateTex(plate);
    const S = { damas: [1.5, 3.4], lt: [1.75, 4.8], l14: [1.9, 5.4], mid: [2.1, 6.6], ax5: [2.4, 9.6], wing: [2.4, 10.4] }[type] || [1.75, 4.8], [Wd, Ln] = S;
    if (type === 'damas') { box(Wd, 1.8, Ln, '#F4F4F2', 0, 0.35, 0, g); box(Wd + 0.02, 0.7, 0.9, '#2B3440', 0, 1.25, Ln / 2 - 0.5, g, { roughness: 0.2 }); [[-0.6, 1.1], [0.6, 1.1], [-0.6, -1.1], [0.6, -1.1]].forEach(([x, z]) => wheel(g, x, z, 0.38)); }
    else {
      const cabL = type === 'lt' || type === 'l14' ? 1.6 : 2.2, cabH = type === 'lt' || type === 'l14' ? 1.9 : 2.6, cabC = type === 'lt' ? '#3F6FB8' : type === 'l14' ? '#F4F4F2' : '#E8E8E6';
      box(Wd, cabH, cabL, cabC, 0, 0.55, Ln / 2 - cabL / 2, g); box(Wd + 0.02, cabH * 0.38, 0.1, '#2B3440', 0, 0.55 + cabH * 0.5, Ln / 2 + 0.01, g, { roughness: 0.2 });
      const bedL = Ln - cabL - 0.2, bz = -cabL / 2 - 0.1;
      if (type === 'lt' || type === 'l14') { box(Wd, 0.2, bedL, '#9AA0A6', 0, 0.75, bz, g); [-1, 1].forEach((sg) => box(0.08, 0.5, bedL, '#C9CDD2', sg * (Wd / 2 - 0.04), 0.95, bz, g)); box(Wd, 0.5, 0.08, '#C9CDD2', 0, 0.95, bz - bedL / 2, g); }
      else if (type === 'wing') { box(Wd, 2.8, bedL, '#C9CDD2', 0, 1.0, bz, g); box(Wd + 0.05, 0.15, bedL, '#3F7FE0', 0, 3.8, bz, g); }
      else { box(Wd, type === 'mid' ? 2.4 : 0.25, bedL, type === 'mid' ? '#F2F2F0' : '#8E959C', 0, 0.85, bz, g); if (type === 'ax5') [-1, 1].forEach((sg) => box(0.1, 0.7, bedL, '#8E959C', sg * (Wd / 2 - 0.05), 1.1, bz, g)); }
      const axR = type === 'lt' ? [Ln / 2 - 0.9, -Ln / 2 + 1.0] : type === 'ax5' ? [Ln / 2 - 1.1, -Ln / 2 + 2.6, -Ln / 2 + 1.2] : type === 'wing' ? [Ln / 2 - 1.1, -Ln / 2 + 2.6, -Ln / 2 + 1.2] : [Ln / 2 - 1.0, -Ln / 2 + 1.3];
      axR.forEach((z) => [-1, 1].forEach((sg) => wheel(g, sg * (Wd / 2 - 0.15), z, type === 'lt' || type === 'l14' ? 0.45 : 0.6)));
    }
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), pm); pf.position.set(0, 0.6, Ln / 2 + 0.03); g.add(pf);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), pm); pr.position.set(0, 0.6, -Ln / 2 - 0.03); pr.rotation.y = Math.PI; g.add(pr);
    scene.add(g); return { g, Ln };
  };
  const drivers = (o.drivers || []).slice(0, 6).map((d, i) => {
    const v = vehicle(d.type, d.plate); const x = -6 + i * 7; v.g.position.set(x, 0, 30); v.g.rotation.y = Math.PI; clickable(v.g, 'drv:' + d.key);
    tag('drv:' + d.key, pill(`${d.plate || '번호 미상'} · ${d.label}`, '#FFFFFF', '#1E1E1E'), x, 5.6, 30);
    const c = critter('driver'); c.g.scale.setScalar(1.6); scene.add(c.g); clickable(c.g, 'drv:' + d.key); return { c, d, x, ph: i * 2.3 };
  });
  // 미입금 기사님 — 창고 밖에서 기다림 (입금 완료 누르면 사라짐) (o.unpaid: [{id, driver}])
  const waiters = (o.unpaid || []).slice(0, 14).map((u, i) => { const c = critter('driver'); c.g.scale.setScalar(1.5); c.g.position.set(-WW / 2 - 6 - (i % 4) * 2.6, 0, 24 - Math.floor(i / 4) * 3); c.g.rotation.y = Math.PI / 2; scene.add(c.g); clickable(c.g, 'unpaid'); return { c, u }; });
  if ((o.unpaid || []).length) tag('unpaid', pill(`미입금 기사님 ${(o.unpaid || []).length}명`, '#FF453A', '#FFFFFF'), -WW / 2 - 10, 6.5, 20);
  ticks.push((dt, t) => {
    const a = t * 0.25; fk.position.set(Math.sin(a) * 20, 0, 14 + Math.cos(a) * 2); fk.rotation.y = Math.cos(a) > 0 ? Math.PI / 2 : -Math.PI / 2; fork.position.y = 0.4 + Math.max(0, Math.sin(t * 0.8)) * 3;
    dog.g.position.set(Math.sin(t * 0.4) * 14, 0, 9); dog.face(Math.cos(t * 0.4), 0); dog.walk(dt, 0.8);
    const nz = Math.sin(t * 0.3); noh.g.position.set(nz * 16, 0, -16.5); noh.face(Math.cos(t * 0.3), 0); noh.walk(dt, 0.7);
    nohT.p.set(nz * 16, 6.2, -16.5);
    drivers.forEach((d) => { const p = ((t * 0.06 + d.ph) % 2); const f = p < 1 ? p : 2 - p; const z = 26 - f * 9; d.c.g.position.set(d.x + 2.4, 0, z); d.c.face(0, p < 1 ? -1 : 1); d.c.walk(dt); });   // 차 ↔ 창고 문 (상차)
    waiters.forEach((w2, i) => w2.c.idle(dt));
  });
  return { noh, drivers, removeWaiter: (id) => { const w2 = waiters.find((x) => x.u.id === id); if (w2) { scene.remove(w2.c.g); waiters.splice(waiters.indexOf(w2), 1); } } };
}
