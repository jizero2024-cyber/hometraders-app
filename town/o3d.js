// 홈트 사무실 · 창고 3D (10/29 대표 "창고랑 홈트사무실도 마을처럼 실제처럼") — 앞벽을 뗀 인형집 모양.
// 직원(AI 작업)·물건은 실제 자료 숫자만 보여 줌 — 숫자는 town.js 가 공유 DB 에서 읽어 tag()/setIdle() 로 넣음.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { critter } from './kit3d.js?v=3';

function base(host, o) {
  let W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.innerWidth > 1400 ? 1.25 : 1.6, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
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
    tags.forEach((t) => { v3.copy(t.p).project(cam); const vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1, dsp = vis ? '' : 'none'; if (t.d.style.display !== dsp) t.d.style.display = dsp; if (!vis) return; const tx = Math.round((v3.x + 1) / 2 * W), ty = Math.round((1 - v3.y) / 2 * H); if (t.x === tx && t.y === ty) return; t.x = tx; t.y = ty; t.d.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-100%)`; });
    renderer.render(scene, cam); requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return { THREE, scene, cam, ctl, mat, box, cyl, clickable, tag, ticks, night, over };
}
const pill = (txt, bg, fg, dot) => `<div style="display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:${bg};color:${fg};font:800 11px Pretendard,sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(30,40,60,.18)">${dot ? `<span style="width:7px;height:7px;border-radius:50%;background:${dot}"></span>` : ''}${txt}</div>`;
export const DOT = { ok: '#34C759', bad: '#FF453A', run: '#2F7BF6', idle: '#B4B2A9' };

// ── 사무실: 목조주택 (10/30 대표 그림 — 2층 + 다락, 층마다 방 둘, 서까래 보이는 박공지붕, 마당 수영장) ──
export function office(host, o) {
  const K = base(host, { ...o, cam: [8, 30, 118], target: [0, 16, 4], bg: '#D8E9FA' });
  const { scene, box, cyl, mat, clickable, tag, ticks } = K;
  const FW = 60, FD = 22, FH = 10, WOOD = '#C9955E', WOOD2 = '#A8774A';
  box(420, 1, 300, '#9ED27F', 0, -1.2, 20); box(86, 1, 66, '#D9D3C6', 0, -1, 8); box(420, 0.2, 10, '#6B7280', 0, -0.2, 50);   // 땅 · 앞 길
  // 방 — [층, x0, x1, 바닥, 벽, 이름]
  const ROOMS = [[0, -FW / 2, FW / 2, '#F3EBDD', '#FBF6EE', '1F 안내 · 라운지'], [1, -FW / 2, 0, '#EFE6D6', '#E6EFF6', '2F 배차 · 통신'], [1, 0, FW / 2, '#ECE4D6', '#F3EFE6', '2F 회계']];   // 1층은 한 층 전부 공용 (10/30 대표)
  ROOMS.forEach(([f, x0, x1, fc, wc, name]) => {
    const y = f * FH, w = x1 - x0, cx = (x0 + x1) / 2; box(w, 0.5, FD, fc, cx, y, 0).castShadow = false; box(w, FH, 0.4, wc, cx, y + 0.5, -FD / 2);
    const lp = new THREE.PointLight('#FFF1DA', 34, 34, 1.4); lp.position.set(cx, y + FH - 1.2, 2); scene.add(lp);
    tag(null, pill(name, 'rgba(255,255,255,.92)', '#6B5E55'), x0 + 5, y + 1.2, FD / 2 - 1).d.style.pointerEvents = 'none';   // 방 이름은 바닥 앞쪽 (뒷벽 위는 윗층 이름표와 겹쳤음 10/30)
  });
  box(FW, 0.5, FD, '#E9DCC4', 0, 2 * FH, 0).castShadow = false;   // 다락 바닥
  { const lp = new THREE.PointLight('#FFE9C8', 40, 40, 1.4); lp.position.set(0, 2 * FH + 8, 2); scene.add(lp); tag(null, pill('다락 · 대표실 · 서류 · 디자인', 'rgba(255,255,255,.92)', '#E8732C'), -24, 2 * FH + 1.2, FD / 2 - 1).d.style.pointerEvents = 'none'; }
  box(0.4, 2 * FH, FD, '#F4F0E8', -FW / 2, 0.5, 0); box(0.4, 2 * FH, FD, '#F4F0E8', FW / 2, 0.5, 0);   // 옆벽
  [1].forEach((f) => { const y = f * FH + 0.5; box(0.4, FH, FD * 0.55, '#EDE4D4', 0, y, -FD / 2 + FD * 0.275); box(0.4, 2.6, FD * 0.45, '#EDE4D4', 0, y + FH - 2.6, FD / 2 - FD * 0.225); box(0.15, FH - 2.6, 0.2, WOOD2, 0, y, FD / 2 - FD * 0.45 + 0.1); });   // 가운데 칸막이 (문)
  // 목조 기둥 · 보
  [-FW / 2, 0, FW / 2].forEach((x) => [-FD / 2, FD / 2].forEach((z) => box(0.9, 2 * FH + 0.6, 0.9, WOOD, x, 0, z)));
  [FH, 2 * FH].forEach((y) => { box(FW + 1, 0.8, 0.9, WOOD, 0, y - 0.3, FD / 2); box(FW + 1, 0.8, 0.9, WOOD, 0, y - 0.3, -FD / 2); });
  // 박공지붕 — 용마루가 앞뒤(z), 앞이 열려 서까래·트러스가 보임
  const RH = 18, RW = FW + 8, ry0 = 2 * FH + 0.5, A = Math.atan2(RH, RW / 2), RL = Math.hypot(RW / 2, RH);
  [-1, 1].forEach((sg) => { const sl = new THREE.Mesh(new THREE.BoxGeometry(RL + 1, 0.7, FD + 5), mat('#B5503A')); sl.position.set(sg * RW / 4, ry0 + RH / 2 + 0.4, 0); sl.rotation.z = -sg * A; sl.castShadow = true; sl.receiveShadow = true; scene.add(sl);
    for (let i = 1; i < 7; i++) { const t = i / 7, st = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, FD + 5.2), mat('#93402F')); st.position.set(sg * (RW / 2) * (1 - t), ry0 + RH * t + 0.85, 0); scene.add(st); } });
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, FD + 5.4, 12), mat('#93402F')); ridge.rotation.x = Math.PI / 2; ridge.position.set(0, ry0 + RH + 0.6, 0); scene.add(ridge);
  const beam = (x1, y1, x2, y2, z, t = 0.7) => { const L = Math.hypot(x2 - x1, y2 - y1), m = new THREE.Mesh(new THREE.BoxGeometry(L, t, t), mat(WOOD)); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, z); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); m.castShadow = true; scene.add(m); };
  [-FD / 2 + 0.5, -FD / 6, FD / 6, FD / 2 - 0.5].forEach((z) => { beam(-RW / 2 + 2, ry0 + 1, 0, ry0 + RH - 0.5, z); beam(RW / 2 - 2, ry0 + 1, 0, ry0 + RH - 0.5, z); beam(0, ry0, 0, ry0 + RH - 0.5, z, 0.6); beam(-RW / 4, ry0 + 0.3, -RW / 4, ry0 + RH / 2, z, 0.5); beam(RW / 4, ry0 + 0.3, RW / 4, ry0 + RH / 2, z, 0.5); beam(-RW / 4, ry0 + 0.3, 0, ry0 + RH * 0.6, z, 0.45); beam(RW / 4, ry0 + 0.3, 0, ry0 + RH * 0.6, z, 0.45); });
  [0.3, 0.6].forEach((t) => [-1, 1].forEach((sg) => { const pu = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, FD), mat(WOOD2)); pu.position.set(sg * (RW / 2) * (1 - t) - sg * 0.6, ry0 + RH * t - 0.4, 0); scene.add(pu); }));
  const logoT = new THREE.TextureLoader().load('/icons/logo-full.png'); logoT.colorSpace = THREE.SRGBColorSpace;
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: logoT, transparent: true })); sg.position.set(0, ry0 + 12.5, FD / 2 - 0.3); scene.add(sg); }
  // 바깥 계단 (오른쪽) — 2층 · 다락
  for (let f = 0; f < 2; f++) for (let i = 0; i < 8; i++) box(5, 0.4, 2, '#E3DED6', FW / 2 + 3.5, f * FH + i * (FH / 8), -FD / 2 + 2 + i * 2.1);
  for (let f = 0; f < 2; f++) box(0.12, 1.1, 17, '#C9CDD2', FW / 2 + 6.1, f * FH + FH / 2 + 0.6, -FD / 2 + 9.4).rotation.x = -Math.atan2(FH, 16.8);
  // 책상 · 모니터 · 의자 · 직원
  const SEAT = 1.55, screens = {};
  const scr = (w2, h2) => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.MeshStandardMaterial({ map: t, emissive: '#FFFFFF', emissiveMap: t, emissiveIntensity: 0.55 }); const me = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), m2); return { c, t, me }; };
  const drawScr = (S2, lines2, bg = '#1F3A5F') => { const sig = lines2.join('|') + bg; if (S2.sig === sig) return; S2.sig = sig; const g2 = S2.c.getContext('2d'); g2.fillStyle = bg; g2.fillRect(0, 0, 256, 160); g2.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) g2.fillRect(14, 70 + i * 16, 120 + (i * 37) % 100, 7); g2.fillStyle = '#FFFFFF'; g2.font = '800 30px Pretendard, sans-serif'; g2.fillText(lines2[0] || '', 14, 38); g2.fillStyle = '#9FD0FF'; g2.font = '700 22px Pretendard, sans-serif'; g2.fillText(lines2[1] || '', 14, 66); S2.t.needsUpdate = true; };
  const desk = (x, f, k, white) => { const y = f * FH + 0.5, z = -1; box(6, 0.3, 3, white ? '#F4F2EE' : '#D9B88C', x, y + 1.6, z); [-2.7, 2.7].forEach((a) => box(0.3, 1.6, 2.6, '#BFA27A', x + a, y, z));
    box(0.25, 0.9, 0.25, '#3A3F47', x + 1.9, y + 1.9, z - 0.6); box(2.8, 1.75, 0.15, '#2B2F36', x + 1.9, y + 2.7, z - 0.6); const S2 = scr(2.6, 1.55); S2.me.position.set(x + 1.9, y + 3.58, z - 0.52); scene.add(S2.me); drawScr(S2, ['', '']); if (k) screens[k] = S2;
    const cx = x - 1.2, cz = -3.7; cyl(1.0, 0.12, '#3A3F47', cx, y, cz, scene, 5); cyl(0.12, 1.0, '#8E959C', cx, y, cz, scene, 8); box(1.7, 0.3, 1.6, white ? '#F6F2EA' : '#2F3A4A', cx, y + 1.0, cz); box(1.7, 2.0, 0.28, white ? '#F6F2EA' : '#2F3A4A', cx, y + 1.2, cz - 0.85); };
  const seats = {};
  (o.staff || []).forEach((s) => { desk(s.x, s.f, s.k, s.k === 'seal'); const c = critter(s.av); c.g.scale.setScalar(2.2); const hy = s.f * FH + 0.5 + SEAT; c.g.position.set(s.x - 1.2, hy, -3.55); scene.add(c.g); clickable(c.g, s.k); seats[s.k] = { c, home: [s.x - 1.2, hy, -3.55], at: 'desk', s }; });
  // 꾸밈 도우미
  const plant = (x, y, z, k = 1) => { cyl(0.5 * k, 0.9 * k, '#F2EEE6', x, y, z, scene, 12); for (let i = 0; i < 4; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 * k, 0), mat(['#5DAA58', '#4E9E52', '#6FBF5E'][i % 3], { flatShading: true })); lf.position.set(x + Math.cos(i * 1.7) * 0.4 * k, y + (1.4 + i * 0.35) * k, z + Math.sin(i * 1.7) * 0.4 * k); lf.castShadow = true; scene.add(lf); } };
  const shelf = (x, y, z, w2, rows, colors) => { box(w2, rows * 1.3 + 0.3, 1.2, '#C9A26B', x, y, z); for (let r = 0; r < rows; r++) { box(w2 - 0.2, 0.12, 1.1, '#B08A55', x, y + 0.2 + r * 1.3, z + 0.05); for (let i = 0; i < Math.floor(w2 / 0.5) - 1; i++) box(0.38, 0.95, 0.85, colors[(i + r) % colors.length], x - w2 / 2 + 0.45 + i * 0.5, y + 0.32 + r * 1.3, z + 0.12); } };
  const win = (x, y, z, w2, h2) => { box(w2 + 0.3, h2 + 0.3, 0.2, '#FFFFFF', x, y, z); const pane = box(w2, h2, 0.1, '#BFE3F7', x, y + 0.15, z + 0.08, scene, { roughness: 0.1, emissive: '#BFE3F7', emissiveIntensity: 0.25 }); pane.castShadow = false; box(0.12, h2, 0.15, '#FFFFFF', x, y + 0.15, z + 0.12); box(w2, 0.12, 0.15, '#FFFFFF', x, y + 0.15 + h2 / 2, z + 0.12); };
  const frame = (x, y, c) => { box(1.8, 2.2, 0.08, '#FFFFFF', x, y, -FD / 2 + 0.32); box(1.5, 1.9, 0.05, c, x, y + 0.15, -FD / 2 + 0.38); };
  const BIND = ['#5D7FBF', '#FFFFFF', '#9AB6E0', '#E8E2D6', '#3F5F9A'];
  const OBJ = {};
  // 1F — 안내 · 라운지 (공용): 둥근 안내 데스크 · 동그란 회의 테이블 · 큰 화면 · 소파 · 팜플렛 진열대 · 커피 바
  { const y = 0.5;
    const rc = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 2.2, 32, 1, true, -0.3, Math.PI * 1.15), new THREE.MeshStandardMaterial({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: 0.5 })); rc.position.set(-12, y + 1.1, 2); rc.castShadow = true; scene.add(rc);
    box(4.2, 0.12, 1.2, '#E9DCC4', -12, y + 2.2, 4.8); box(1.6, 0.08, 1.1, '#C9CDD2', -12.5, y + 2.25, 3.3, scene, { metalness: 0.5 }); box(6, 2.6, 0.2, '#E9DCC4', -12, y + 4.6, -FD / 2 + 0.4);
    { const lt = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.6), new THREE.MeshBasicMaterial({ map: logoT, transparent: true })); lt.position.set(-12, y + 5.9, -FD / 2 + 0.55); scene.add(lt); }
    const g = new THREE.Group(); g.position.set(12, y, 3); scene.add(g); cyl(3.6, 0.3, '#E2C9A0', 0, 2.1, 0, g, 32); cyl(0.5, 2.1, '#F2F0EA', 0, 0, 0, g); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, ch = new THREE.Group(); ch.position.set(Math.cos(a) * 4.8, 0, Math.sin(a) * 4.8); ch.rotation.y = -a + Math.PI / 2; g.add(ch); box(1.4, 0.35, 1.4, '#FFFFFF', 0, 1.2, 0, ch); box(1.4, 1.5, 0.3, '#FFFFFF', 0, 1.5, -0.6, ch); [-0.55, 0.55].forEach((lx) => [-0.55, 0.55].forEach((lz) => box(0.12, 1.2, 0.12, '#C9A26B', lx, 0, lz, ch))); } clickable(g, 'meet'); OBJ.meet = [12, y + 5, 3];
    [[12, 3, 6.2, '#E9DCC8'], [0, -5, 4, '#D9CFC0']].forEach(([x, z, r, c]) => { const rg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 32), mat(c)); rg.position.set(x, y + 0.02, z); scene.add(rg); });
    const tv = scr(8, 4); box(8.4, 4.4, 0.3, '#2B2F36', 12, y + 2.6, -FD / 2 + 0.45); tv.me.position.set(12, y + 4.8, -FD / 2 + 0.65); scene.add(tv.me); screens.tv = tv; drawScr(tv, ['홈트레이더스', '아이큐브 카탈로그'], '#E9F1F8');
    box(6, 1.2, 2.4, '#F6F3EE', 0, y, -7.6); box(6, 1.6, 0.6, '#F6F3EE', 0, y + 1.2, -8.6); [-1, 1].forEach((a) => box(0.6, 1.1, 2.4, '#F6F3EE', a * 3.1, y + 1.2, -7.6)); box(3, 0.8, 1.6, '#C9A26B', 0, y, -4.4);
    const pg = new THREE.Group(); pg.position.set(26.5, y, -8); scene.add(pg); box(5, 5, 1.6, '#C9A26B', 0, 0, 0, pg); [0, 1, 2].forEach((r) => { box(4.6, 0.2, 1.4, '#B08A55', 0, 1 + r * 1.5, 0.1, pg); [0, 1, 2].forEach((i) => box(1, 1.2, 0.15, ['#E8732C', '#3F7FE0', '#2E9A5A', '#F5B400'][(i + r) % 4], -1.4 + i * 1.4, 1.2 + r * 1.5, 0.6, pg)); }); clickable(pg, 'pamph'); OBJ.pamph = [26.5, y + 6.6, -8];
    box(7, 3, 2.2, '#A8774A', -24, y, -7.6); box(7.2, 0.25, 2.4, '#E9E2D6', -24, y + 3, -7.6); box(1.4, 1.5, 1.2, '#B8BEC6', -25.5, y + 3.25, -7.8, scene, { metalness: 0.6, roughness: 0.3 }); for (let i = 0; i < 3; i++) cyl(0.25, 0.4, '#FFFFFF', -23 + i * 0.8, y + 3.25, -7.2, scene, 10);
    frame(4, y + 5.2, '#F7C8A0'); frame(-2, y + 5.4, '#B9D9F0'); plant(-28.5, y, 6, 1.2); plant(28.5, y, 6, 1.1); plant(-5, y, 7, 0.9); }
  // 2F 왼쪽 — 배차 · 통신: 큰 모니터 벽
  { const y = FH + 0.5; const big = [scr(9, 4.4), scr(7, 4.4)]; [[-21, big[0], 9], [-8.5, big[1], 7]].forEach(([x, S2, w2]) => { box(w2 + 0.5, 4.9, 0.3, '#2B2F36', x, y + 1.8, -FD / 2 + 0.45); S2.me.position.set(x, y + 4.25, -FD / 2 + 0.65); scene.add(S2.me); });
    screens.wallA = big[0]; screens.wallB = big[1]; drawScr(big[0], ['배차 요청', ''], '#22406A'); drawScr(big[1], ['오늘 출고', ''], '#2A4A3A'); plant(-28.5, y, 6, 1); }
  // 2F 오른쪽 — 회계: 금고 · 파일 선반
  { const y = FH + 0.5; const sf = new THREE.Group(); sf.position.set(28, y, -6.5); scene.add(sf); box(2.6, 3.2, 2.4, '#8E959C', 0, 0, 0, sf, { metalness: 0.4, roughness: 0.45 }); cyl(0.55, 0.15, '#C9CDD2', 0, 1.7, 1.2, sf, 16).rotation.x = Math.PI / 2;
    shelf(8, y, -FD / 2 + 1.2, 6, 3, BIND); shelf(19, y, -FD / 2 + 1.2, 6, 3, BIND); frame(13.5, y + 6.6, '#D9E8C0'); plant(2.5, y, 6, 0.9); }
  // 다락 — 대표실(맥북 · 테라리움 어항) · 서류 · 확인(복합기 · 칠판) · 디자인
  { const y = 2 * FH + 0.5;
    const tg = new THREE.Group(); tg.position.set(6, y, -6); scene.add(tg); box(3, 1.4, 2, '#C9A26B', 0, 0, 0, tg); const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 18), new THREE.MeshStandardMaterial({ color: '#DDF3FF', transparent: true, opacity: 0.28, roughness: 0.05 })); bowl.position.set(0, 2.8, 0); tg.add(bowl);
    const water = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), new THREE.MeshStandardMaterial({ color: '#7FC8F0', transparent: true, opacity: 0.45 })); water.position.set(0, 2.8, 0); tg.add(water);
    const fishes = [0, 1].map((i) => { const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(i ? '#FF8A3C' : '#F7C82F')); f2.scale.set(1.4, 0.8, 0.6); tg.add(f2); return f2; });
    ticks.push((dt, t) => fishes.forEach((f2, i) => { const a = t * (0.8 + i * 0.3) + i * 3; f2.position.set(Math.cos(a) * 0.7, 2.6 + Math.sin(t * 1.3 + i) * 0.2, Math.sin(a) * 0.7); f2.rotation.y = -a; }));
    const mb = new THREE.Group(); mb.position.set(1.9, y + 1.92, -0.6); scene.add(mb); box(1.9, 0.08, 1.3, '#C9CDD2', 0, 0, 0, mb, { metalness: 0.5, roughness: 0.35 }); const lid = new THREE.Group(); lid.position.set(0, 0.06, -0.62); lid.rotation.x = -0.25; mb.add(lid); box(1.9, 1.25, 0.06, '#C9CDD2', 0, 0, 0, lid, { metalness: 0.5 }); const ms = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), new THREE.MeshStandardMaterial({ color: '#9FD0FF', emissive: '#9FD0FF', emissiveIntensity: 0.6 })); ms.position.set(0, 0.62, 0.04); lid.add(ms);
    const g = new THREE.Group(); g.position.set(-25, y, -5); scene.add(g); box(4, 3, 3, '#EEF0F2', 0, 0, 0, g); box(3.6, 0.5, 2.6, '#D3D7DC', 0, 3, 0, g); box(3, 0.15, 2.2, '#FFFFFF', 0, 3.5, 0, g); box(2.8, 0.1, 2, '#FFFFFF', 0, 1.6, 1.6, g); box(1, 0.6, 0.1, '#2F7BF6', 1.2, 3.1, 1.3, g, { emissive: '#2F7BF6', emissiveIntensity: 0.5 }); clickable(g, 'printer'); OBJ.printer = [-25, y + 4.2, -5];
    const bg2 = new THREE.Group(); bg2.position.set(-7, y, -8); scene.add(bg2); [-2.6, 2.6].forEach((a) => box(0.2, 5.6, 0.2, '#B08A55', a, 0, 0.4, bg2)); box(5.6, 3.6, 0.2, '#FFFFFF', 0, 1.8, 0, bg2); [['#FFE680', -1.6], ['#FFB5C8', 0], ['#B5E3FF', 1.6]].forEach(([c, x], i) => box(1.2, 1.1, 0.05, c, x, 2.5 + (i % 2) * 1.2, 0.15, bg2)); clickable(bg2, 'board'); OBJ.board = [-7, y + 4.4, -7.6];
    [[26, 3], [27, -2], [-27, 3]].forEach(([x, z], i) => box(2.2, 1.6 + (i % 2) * 0.6, 2, '#D9B88C', x, y, z)); plant(20, y, -5, 1); plant(-17, y, -6, 1);
    [[-3, -6], [9, 3]].forEach(([x, z]) => { box(0.04, 2.2, 0.04, '#7A6A5A', x, y + 7, z); for (let k = 0; k < 5; k++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(['#5DAA58', '#6FBF5E'][k % 2], { flatShading: true })); lf.position.set(x + Math.sin(k * 2) * 0.35, y + 6.8 - k * 0.45, z + Math.cos(k * 2) * 0.35); scene.add(lf); } }); }
  // 마당 — 수영장 · 선베드 · 파라솔 · 빈백 · 와인바 · 우체통 · 울타리
  { const pool = new THREE.Group(); pool.position.set(-6, 0, 25); scene.add(pool); box(26, 0.6, 11, '#F2F2EE', 0, -0.2, 0, pool); const wtr = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 9), new THREE.MeshStandardMaterial({ color: '#5EC4F0', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9 })); wtr.position.set(0, 0.32, 0); pool.add(wtr);
    const ripple = [0, 1, 2].map((i) => { const r2 = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 24), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.4 })); r2.rotation.x = -Math.PI / 2; r2.position.set(-6 + i * 6, 0.5, (i % 2) * 2 - 1); pool.add(r2); return r2; });
    ticks.push((dt, t) => ripple.forEach((r2, i) => { const k = (t * 0.6 + i * 0.33) % 1; r2.scale.setScalar(1 + k * 3); r2.material.opacity = 0.45 * (1 - k); }));
    [-1, 1].forEach((sg) => { box(0.12, 2, 0.12, '#C9CDD2', 10 + sg * 0.6, 0, -4.4, pool); }); const tube = new THREE.Mesh(new THREE.TorusGeometry(1, 0.35, 10, 20), mat('#FF6B5E')); tube.rotation.x = Math.PI / 2; tube.position.set(4, 0.6, 1.5); pool.add(tube); ticks.push((dt, t) => { tube.position.y = 0.6 + Math.sin(t * 1.4) * 0.08; });
    [-9, -5].forEach((x) => { const lb = new THREE.Group(); lb.position.set(x, 0, 33); scene.add(lb); box(2, 0.4, 4.5, '#FFFFFF', 0, 0.6, 0, lb); const bk = box(2, 0.3, 1.8, '#FFFFFF', 0, 1.4, -1.6, lb); bk.rotation.x = 0.6; [-0.8, 0.8].forEach((a) => [-1.8, 1.8].forEach((b2) => box(0.15, 0.6, 0.15, '#C9CDD2', a, 0, b2, lb))); });
    cyl(0.12, 3.8, '#E9E9E9', -14, 0.3, 33, scene, 8); const um = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.2, 16), mat('#FFFFFF')); um.position.set(-14, 4.6, 33); um.castShadow = true; scene.add(um);
    const wb = new THREE.Group(); wb.position.set(27, 0.3, 25); scene.add(wb); [[-4.5, -2], [4.5, -2], [-4.5, 3], [4.5, 3]].forEach(([a, b2]) => box(0.4, 5.6, 0.4, '#7A5232', a, 0, b2, wb)); box(9.8, 0.4, 5.8, '#6B4A34', 0, 5.6, 0.5, wb);
    box(8, 3.4, 0.5, '#8A5E3C', 0, 0, -2, wb); for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) cyl(0.14, 0.75, ['#3E2A2A', '#2F4A2F', '#5A1E2A'][i % 3], -3.6 + i * 0.9, 1.6 + r * 1.0, -1.7, wb, 8);
    box(8, 2.2, 1.2, '#A8774A', 0, 0, 1.4, wb); box(8.4, 0.2, 1.6, '#C9A26B', 0, 2.2, 1.4, wb); [-3, -1, 1, 3].forEach((a) => { cyl(0.45, 0.15, '#7A5232', a, 1.6, 3, wb, 12); cyl(0.08, 1.6, '#555', a, 0, 3, wb, 6); });
    for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: '#FFF2C4', emissive: '#FFD27A', emissiveIntensity: 1.2 })); b.position.set(-4.5 + i * 0.82, 5.3 - Math.sin(i / 11 * Math.PI) * 0.5, 3.2); wb.add(b); }
    const mbx = new THREE.Group(); mbx.position.set(34, 0.3, 33); scene.add(mbx); cyl(0.25, 2.6, '#555', 0, 0, 0, mbx, 8); box(2.6, 2.2, 1.8, '#E8732C', 0, 2.6, 0, mbx); mbx.scale.setScalar(1.3); clickable(mbx, 'mail'); OBJ.mail = [34, 7.5, 33];
    for (let x = -40; x <= 40; x += 2.2) { if (Math.abs(x) < 4) continue; const hg = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mat('#4E9E52', { flatShading: true })); hg.position.set(x, 1.1, 39); hg.scale.y = 0.75; hg.castShadow = true; scene.add(hg); }
    box(1.4, 3, 1.4, '#F2F0EA', -3.8, 0.3, 39); box(1.4, 3, 1.4, '#F2F0EA', 3.8, 0.3, 39); for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 12), mat('#E4E0D8')); st.position.set(Math.sin(i * 0.7) * 1.2 + 8, 0.36, 38 - i * 1.9); scene.add(st); } }
  const REST = [[-22, 33], [-18, 34], [10, 33], [14, 34], [18, 33], [-26, 20], [12, 18], [-1, 34]];
  REST.slice(0, 6).forEach(([x, z], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 14), mat(['#F7A8C8', '#FFE07A', '#A6E3B8', '#B5D4F4', '#F0B48A', '#C9B4F5'][i])); b.scale.y = 0.6; b.position.set(x, 0.9, z + 1.4); b.castShadow = true; scene.add(b); });
  // 걷기 — 자리 ↔ 마당 (바깥 계단)
  const moving = [];
  const goTo = (k, to, after) => { const st = seats[k]; if (!st) return; if (Math.abs(st.c.g.position.y - st.home[1]) < 0.01) st.c.g.position.y -= SEAT; if (Math.abs(to.y - st.home[1]) < 0.01) { const fin = after; to = to.clone(); to.y -= SEAT; after = () => { st.c.g.position.y += SEAT; if (fin) fin(); }; } const from = st.c.g.position.clone(); const pts = [from, new THREE.Vector3(from.x, from.y, FD / 2 - 1), new THREE.Vector3(FW / 2 + 3.5, from.y, FD / 2 - 1), new THREE.Vector3(FW / 2 + 3.5, to.y, FD / 2 - 1), new THREE.Vector3(to.x, to.y, FD / 2 - 1), to]; moving.push({ st, pts, i: 0, after }); };
  ticks.push((dt) => {
    Object.values(seats).forEach((st) => { if (st.at === 'desk') { st.c.sit(); st.c.type(dt); } else if (st.at === 'rest') st.c.sit(); });
    for (let n = moving.length - 1; n >= 0; n--) { const mv = moving[n], p = mv.st.c.g.position, tgt = mv.pts[mv.i + 1]; if (!tgt) { moving.splice(n, 1); if (mv.after) mv.after(); continue; } const d = tgt.clone().sub(p), L = d.length(), step = dt * 6; if (L <= step) { p.copy(tgt); mv.i++; } else { d.normalize(); p.addScaledVector(d, step); mv.st.c.face(d.x, d.z); mv.st.c.walk(dt, 1.4); } }
  });
  const tagsBy = {};
  return {
    seats, OBJ, FH,
    setScreen(k, lines2, bg) { const S2 = screens[k]; if (S2) drawScr(S2, lines2, bg); },
    setTag(key, html, pos) { if (tagsBy[key]) { tagsBy[key].d.innerHTML = html; if (pos) tagsBy[key].p.set(...pos); return; } const p = pos || (seats[key] ? [seats[key].home[0], seats[key].home[1] + 5.6, seats[key].home[2]] : OBJ[key]); if (p) tagsBy[key] = tag(key, html, ...p); },
    setIdle(k, idle, ri) {   // 할 일 0 → 마당 빈백, 생기면 자리로
      const st = seats[k]; if (!st) return; const want = idle ? 'rest' : 'desk'; if (st.at === want || st.at === 'walk') return;
      st.at = 'walk'; const [hx, hy, hz] = st.home, [rx, rz] = REST[ri % REST.length];
      if (idle) goTo(k, new THREE.Vector3(rx, 0.3, rz), () => { st.at = 'rest'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(rx, 5.2, rz); });
      else goTo(k, new THREE.Vector3(hx, hy, hz), () => { st.at = 'desk'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(hx, hy + 5.6, hz); });
    },
    meeting(order, say, done) {   // 회의 — 1층 동그란 테이블로 모여 한 명씩 실제 숫자 보고
      const [mx, my, mz] = OBJ.meet, ks = order.filter((k) => seats[k]);
      ks.forEach((k, i) => { const a = i / ks.length * Math.PI * 2, st = seats[k]; st.at = 'walk'; goTo(k, new THREE.Vector3(mx + Math.cos(a) * 6.2, my - 4.5, mz + Math.sin(a) * 6.2), () => { st.at = 'meet'; st.c.face(-Math.cos(a), -Math.sin(a)); }); });
      let t = 9000; ks.forEach((k) => { setTimeout(() => say(k), t); t += 2400; });
      setTimeout(() => { ks.forEach((k) => { const st = seats[k]; st.at = 'walk'; goTo(k, new THREE.Vector3(...st.home), () => { st.at = 'desk'; st.c.g.rotation.y = 0; }); }); if (done) done(); }, t + 600);
    },
  };
}

// ── 창고: 높은 창고 안 (실제 재고만) ──
export function warehouse(host, o) {
  const K = base(host, { ...o, cam: [14, 52, 118], target: [0, 6, 10], bg: '#E6E2DA' });
  const { scene, box, cyl, mat, clickable, tag, ticks } = K;
  const WW = 70, WD = 40, WH = 22;
  // ── 게임처럼 디테일 (10/31 대표 "실제 게임처럼 디자인이 디테일하면") — 그림(텍스처)은 캔버스로 직접 그림, 외부 파일 없음
  const cvs = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  const rnd = (() => { let x = 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  const TX = {
    floor: cvs(512, 512, (g, w, h) => { g.fillStyle = '#C8C2B6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '60,50,40'},${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } for (let i = 0; i < 6; i++) { const gr = g.createRadialGradient(rnd() * w, rnd() * h, 2, rnd() * w, rnd() * h, 60 + rnd() * 60); gr.addColorStop(0, 'rgba(80,70,55,.10)'); gr.addColorStop(1, 'rgba(80,70,55,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } g.strokeStyle = 'rgba(90,80,65,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }, 7, 4),
    wall: cvs(256, 256, (g, w, h) => { for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#E9ECEF'); gr.addColorStop(0.45, '#F8F9FA'); gr.addColorStop(0.55, '#D5DAE0'); gr.addColorStop(1, '#E9ECEF'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, h - 26, w, 26); }, 10, 1),
    side: cvs(256, 128, (g, w, h) => { g.fillStyle = '#E4BC82'; g.fillRect(0, 0, w, h); const rows = 6; for (let r = 0; r < rows; r++) { const y = r * h / rows; g.fillStyle = `hsl(33,${48 + rnd() * 12}%,${66 + rnd() * 8}%)`; g.fillRect(0, y + 1, w, h / rows - 2); for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(150,100,50,${0.15 + rnd() * 0.2})`; g.lineWidth = 1; g.beginPath(); const yy = y + 2 + rnd() * (h / rows - 4); g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + rnd() * 4 - 2, w * 0.6, yy + rnd() * 4 - 2, w, yy); g.stroke(); } g.fillStyle = 'rgba(90,60,30,.45)'; g.fillRect(0, y, w, 1.4); } }),
    end: cvs(256, 192, (g, w, h) => { g.fillStyle = '#6E4E2E'; g.fillRect(0, 0, w, h); const cols = 4, rows = 6, cw = w / cols, rh = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + 2, y = r * rh + 2, ww = cw - 4, hh = rh - 4; g.fillStyle = `hsl(34,${45 + rnd() * 15}%,${70 + rnd() * 8}%)`; g.fillRect(x, y, ww, hh); const cx = x + ww * (0.2 + rnd() * 0.6), cy = y + hh * (rnd() > 0.5 ? 1.2 : -0.2); g.strokeStyle = 'rgba(160,110,60,.35)'; for (let k = 1; k < 7; k++) { g.beginPath(); g.ellipse(cx, cy, k * 7, k * 5, 0, 0, Math.PI * 2); g.stroke(); } g.fillStyle = 'rgba(60,35,15,.5)'; g.fillRect(x + ww - 9, y + 3, 6, 4); } }),
    box: cvs(128, 128, (g, w, h) => { g.fillStyle = '#C79A62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,60,30,${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 2, 1); } g.fillStyle = '#B88A52'; g.fillRect(0, h * 0.44, w, h * 0.12); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(w * 0.12, h * 0.68, w * 0.5, h * 0.18); g.fillStyle = '#333'; for (let i = 0; i < 8; i++) g.fillRect(w * 0.15 + i * 7, h * 0.71, 3 + (i % 3), h * 0.12); }),
    hazard: cvs(128, 32, (g, w, h) => { g.fillStyle = '#F5C431'; g.fillRect(0, 0, w, h); g.fillStyle = '#2B2522'; for (let x = -h; x < w + h; x += 24) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 12, h); g.lineTo(x + 12 + h, 0); g.lineTo(x + h, 0); g.fill(); } }, 12, 1),
    pallet: cvs(64, 64, (g, w, h) => { g.fillStyle = '#B98B5B'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,75,40,${rnd() * 0.3})`; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + rnd() * 3); g.stroke(); } }),
  };
  const tmat = (map, c = '#FFFFFF', ex = {}) => new THREE.MeshStandardMaterial({ map, color: c, roughness: 0.85, ...ex });
  const mesh = (geo, m, x, y, z, p = scene) => { const o2 = new THREE.Mesh(geo, m); o2.position.set(x, y, z); o2.castShadow = true; o2.receiveShadow = true; p.add(o2); return o2; };
  scene.fog = new THREE.Fog('#E6E2DA', 160, 340);
  box(420, 1, 300, '#B9B3A6', 0, -1.6, 30);
  { const f = mesh(new THREE.BoxGeometry(WW, 0.6, WD), tmat(TX.floor), 0, -0.3, 0); f.castShadow = false; }
  { const mw = tmat(TX.wall); mesh(new THREE.BoxGeometry(WW, WH, 0.6), mw, 0, WH / 2, -WD / 2); const ms = tmat(TX.wall.clone()); ms.map.repeat.set(6, 1); [-1, 1].forEach((sg) => mesh(new THREE.BoxGeometry(0.6, WH, WD), ms, sg * WW / 2, WH / 2, 0)); }
  // 벽 아래 띠 · 기둥(H빔) · 지붕 트러스 · 천장 등
  box(WW, 2.2, 0.7, '#5B6470', 0, 0, -WD / 2 + 0.05); [-1, 1].forEach((sg) => box(0.7, 2.2, WD, '#5B6470', sg * (WW / 2 - 0.05), 0, 0));
  for (let x = -WW / 2; x <= WW / 2; x += 14) { box(1.1, WH, 0.9, '#3F6FB8', x, 0, -WD / 2 + 0.7); box(0.5, WH, 1.6, '#3F6FB8', x, 0, -WD / 2 + 0.9); }
  [-WD / 2 + 0.7, -WD / 4, 0, WD / 4].forEach((z) => { box(WW, 0.8, 0.8, '#4A7BC4', 0, WH - 0.8, z); for (let x = -WW / 2 + 4; x < WW / 2; x += 8) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.6, 0.25), mat('#6E93D0')); d.position.set(x, WH - 2.8, z); d.rotation.z = (x / 8) % 2 ? 0.6 : -0.6; scene.add(d); } });
  box(WW + 1, 0.8, 4, '#3F7FE0', 0, WH, -WD / 2 + 1.4);
  [[-18, -6], [0, -6], [18, -6], [-18, 8], [0, 8], [18, 8]].forEach(([x, z], i) => {
    cyl(0.08, 3.4, '#333', x, WH - 3.6, z); const sh = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.1, 20, 1, true), mat('#2E3440', { side: THREE.DoubleSide })); sh.position.set(x, WH - 4.1, z); scene.add(sh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFF4D6' })); bulb.position.set(x, WH - 4.6, z); scene.add(bulb);
    if (i % 2 === 0) { const L = new THREE.PointLight('#FFE7BF', 70, 46, 1.5); L.position.set(x, WH - 5, z); scene.add(L); }
  });
  // 바닥 — 통로 노란 선 · 구조재 구역 틀 · 앞 문턱 줄무늬
  for (let i = -3; i <= 3; i++) if (Math.abs(i) !== 2) box(0.3, 0.02, WD - 4, '#F5C431', i * 9, 0.01, 0);
  [[-21, -17, 42, 0.4], [-21, 7, 42, 0.4], [-21, -17, 0.4, 24], [21, -17, 0.4, 24]].forEach(([x, z, w, d]) => box(w, 0.03, d, '#F5C431', x + w / 2, 0.01, z + d / 2));
  { const hz = mesh(new THREE.BoxGeometry(WW, 0.1, 1.4), tmat(TX.hazard), 0, 0.05, WD / 2 - 0.8); hz.castShadow = false; }
  [-1, 1].forEach((sg) => { mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), tmat(TX.hazard.clone()), sg * (WW / 2 - 0.6), 1.2, WD / 2 - 0.6); });
  // 뒷벽 간판 · 안전 표지 · 시계
  { const lg = new THREE.TextureLoader().load('/icons/logo-full.png'); lg.colorSpace = THREE.SRGBColorSpace; box(16, 5, 0.3, '#FFFFFF', 0, 13, -WD / 2 + 0.5); const sg = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshBasicMaterial({ map: lg, transparent: true })); sg.position.set(0, 15.5, -WD / 2 + 0.7); scene.add(sg); }
  const signT = (bg, fg, t1) => cvs(256, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = '900 44px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t1, w / 2, h / 2); });
  [['#1E8E3E', '#FFFFFF', '안전 제일', -22], ['#F5C431', '#2B2522', '지게차 주의', 22]].forEach(([bg, fg, t1, x]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({ map: signT(bg, fg, t1) })); m.position.set(x, 12, -WD / 2 + 0.7); scene.add(m); });
  { cyl(1.4, 0.3, '#FFFFFF', 12, 17, -WD / 2 + 0.6).rotation.x = Math.PI / 2; const hand = box(0.15, 1, 0.1, '#222', 12, 16.9, -WD / 2 + 0.85); ticks.push((dt, t) => { hand.rotation.z = -t * 0.2; }); }
  // 소품 — 빈 파렛트 더미 · 소화기 · 콘 · 드럼통 · 작업대
  for (let k = 0; k < 6; k++) { const pg = new THREE.Group(); pg.position.set(-26.5, k * 0.55, -16.5); pg.rotation.y = (k % 2) * 0.06; scene.add(pg); [-1.2, 0, 1.2].forEach((dx) => mesh(new THREE.BoxGeometry(0.5, 0.3, 3.4), tmat(TX.pallet), dx, 0.15, 0, pg)); for (let j = 0; j < 5; j++) mesh(new THREE.BoxGeometry(3, 0.12, 0.5), tmat(TX.pallet), 0, 0.36, -1.4 + j * 0.7, pg); }
  [[-WW / 2 + 1.2, 17], [WW / 2 - 1.2, 17], [-WW / 2 + 1.2, -18]].forEach(([x, z]) => { cyl(0.45, 1.8, '#E5302B', x, 0, z); cyl(0.2, 0.4, '#222', x, 1.8, z); box(1.2, 1.6, 0.1, '#E5302B', x, 2.8, z < 0 ? z : z + 0.6); });
  [[-26, 18], [-23, 18.5], [26, 18], [23, 18.5]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 16), mat('#FF6A13')); c.position.set(x, 0.9, z); c.castShadow = true; scene.add(c); const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.3, 16), mat('#FFFFFF')); ring.position.set(x, 1.0, z); scene.add(ring); box(1.4, 0.15, 1.4, '#222', x, 0, z); });
  [[27, -16], [29.3, -16], [28.1, -13.8]].forEach(([x, z], i) => { cyl(1.0, 2.6, ['#2F6FD6', '#2F6FD6', '#1E8E3E'][i], x, 0, z); [0.7, 1.9].forEach((y) => cyl(1.03, 0.12, '#1C3F7A', x, y, z)); });
  { const wb = new THREE.Group(); wb.position.set(20, 0, -16.5); scene.add(wb); box(8, 0.35, 3, '#8A5A33', 0, 3.2, 0, wb); [[-3.7, -1.3], [3.7, -1.3], [-3.7, 1.3], [3.7, 1.3]].forEach(([x, z]) => box(0.3, 3.2, 0.3, '#555', x, 0, z, wb)); box(8, 0.2, 3, '#777', 0, 1, 0, wb); box(1.2, 0.8, 0.8, '#E5302B', -2, 3.55, 0, wb); box(1.6, 0.5, 1, '#F5B400', 1.5, 3.55, 0.2, wb); }
  // 배치 (10/30 대표): 문(앞)에서 양옆 벽을 따라 랙 — 철물류. 구조재는 랙이 아니라 바닥에 번들로.
  const RX = [-WW / 2 + 3.2, WW / 2 - 3.2], RZ = [12, 4, -4, -12];   // 랙 칸 (벽 따라 문 → 안쪽)
  RX.forEach((x) => { RZ.forEach((z) => {
    [-3.4, 3.4].forEach((dz) => [-1.3, 1.3].forEach((dx) => { box(0.35, 11, 0.35, '#E8732C', x + dx, 0, z + dz); for (let y = 0.6; y < 11; y += 0.9) box(0.37, 0.12, 0.12, '#B4541A', x + dx, y, z + dz); box(0.8, 0.12, 0.8, '#666', x + dx, 0, z + dz); }));
    [0.3, 3.9, 7.5].forEach((y) => { box(0.25, 0.45, 7.2, '#3F6FB8', x - 1.4, y, z); box(0.25, 0.45, 7.2, '#3F6FB8', x + 1.4, y, z); box(2.6, 0.08, 7, '#A9B4C2', x, y + 0.3, z); });
  }); });
  const hw = (o.hw || []).slice(0, 24), hwC = ['#FFFFFF', '#F2EEE6', '#FFE8A3', '#E6EBF0', '#DDE3EA'];
  const boxMat = (c) => tmat(TX.box, c);
  hw.forEach((it, i) => {
    const side = i % 2, slot = Math.floor(i / 2), z = RZ[slot % 4], lvl = Math.floor(slot / 4) % 3, x = RX[side], y = [0.7, 4.3, 7.9][lvl];
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const n = Math.max(1, Math.min(6, Math.ceil(Number(it.qty) / 20)));   // 박스 수만큼 쌓음 (20박스 = 한 덩이)
    for (let k = 0; k < n; k++) mesh(new THREE.BoxGeometry(2.3, 1.05, 1.7), boxMat(hwC[(i + k) % hwC.length]), 0, (k >= 3 ? 1.1 : 0) + 0.52, -2.2 + (k % 3) * 2.2, g).rotation.y = (rnd() - 0.5) * 0.08;
    clickable(g, 'item:' + it.key);
    tag('item:' + it.key, pill(`${it.name} ${Math.floor(it.qty)}${it.unit || ''}`, 'rgba(255,255,255,.95)', '#4A3F3A'), x + (side ? -1.6 : 1.6), y + 2.6, z);
  });
  // 구조재 — 파렛트 위 번들 (o.items: 실사 재고표 줄, plt = 파렛트 수). 남은 것 = 나무 · 나갈 것 = 주황 띠 · 나간 자리 = 바닥 자국
  const bar = (it) => { const b = Math.max(1, it.base || it.qty), l = Math.max(0, it.qty) / b * 100, p = Math.min(Math.max(0, it.qty), it.pend || 0) / b * 100;   // 작은 게임식 이름표 — 이름·남음 + 막대 (나갈 것 주황)
    return `<div style="padding:3px 7px 4px;border-radius:8px;background:rgba(34,30,28,.86);color:#fff;font:800 10.5px Pretendard,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.22);border:1px solid ${it.pend ? '#FF8A50' : 'rgba(255,255,255,.15)'};white-space:nowrap">
      ${it.name} <span style="color:#FFD58A">${Math.floor(it.qty).toLocaleString()}</span>${it.pend ? ` <span style="color:#FF9D70">−${Math.floor(it.pend).toLocaleString()}</span>` : ''}
      <div style="margin-top:3px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden;display:flex"><span style="width:${l - p}%;background:#E9B872"></span><span style="width:${p}%;background:#FF7A45"></span></div></div>`; };
  const items = (o.items || []).slice(0, 12);
  items.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4), x0 = -15 + col * 10, z0 = -12 + row * 9;
    const base = it.base || it.qty, per = it.plt ? base / it.plt : 150, N = Math.max(1, Math.min(8, Number(it.plt) || Math.ceil(base / 150)));
    const left = Math.max(0, Math.min(N, Math.round(it.qty / per))), pend = Math.max(0, Math.min(left, Math.round((it.pend || 0) / per)));
    const len = /16/.test(it.name.split('*')[2] || '') ? 7.2 : /13|3900/.test(it.name) ? 5.6 : 5.2;
    const g = new THREE.Group(); g.position.set(x0, 0, z0); g.scale.setScalar(1.25); scene.add(g);
    for (let k = 0; k < left; k++) {
      const sx = (k % 2) * 3.2 - 1.6, sy = Math.floor(k / 2) * 1.62, go = k >= left - pend;
      [-1.1, 0, 1.1].forEach((dx) => mesh(new THREE.BoxGeometry(0.4, 0.22, len), tmat(TX.pallet), sx + dx, sy + 0.11, 0, g));
      const tint = go ? '#FFC4A6' : '#FFFFFF', sideM = tmat(TX.side, tint), endM = tmat(TX.end, tint);
      mesh(new THREE.BoxGeometry(2.8, 1.25, len - 0.2), [sideM, sideM, sideM, sideM, endM, endM], sx, sy + 0.25 + 0.62, 0, g);
      [-len / 3, len / 3].forEach((dz) => box(2.86, 1.29, 0.12, go ? '#FF6A2B' : '#2F6FD6', sx, sy + 0.23, dz, g));
      if (go && k === left - 1) { const tg = box(0.9, 0.5, 0.05, '#FFFFFF', sx, sy + 0.9, len / 2 - 0.05, g); tg.material = new THREE.MeshBasicMaterial({ map: signT('#FF6A2B', '#FFFFFF', '출고') }); }
    }
    for (let k = left; k < N; k++) { const sx = (k % 2) * 3.2 - 1.6; if (k < 2) { box(2.9, 0.03, len, '#B7AE9E', sx, 0.01, 0, g); [-1.1, 0, 1.1].forEach((dx) => box(0.42, 0.04, len, '#A79E8E', sx + dx, 0.02, 0, g)); } }   // 나간 자리 — 바닥 자국
    if (!left) box(6, 0.05, len, '#B7AE9E', 0, 0.01, 0, g);
    clickable(g, 'item:' + it.key);
    tag('item:' + it.key, bar(it), x0, Math.ceil(Math.max(left, 1) / 2) * 2.03 + 0.9, z0 + len * 0.45);   // 번들 바로 위 앞쪽
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
  const patrol = (c, pts, sp, pause = 1.2) => {   // 점 따라 왕복 — 끝에서 잠깐 섬, 걷는 속도에 맞춰 다리
    let i = 1, dir = 1, wait = 0; c.g.position.set(pts[0][0], 0, pts[0][1]);
    return (dt) => {
      if (wait > 0) { wait -= dt; c.idle(dt); return; }
      const p = c.g.position, [tx, tz] = pts[i], dx = tx - p.x, dz = tz - p.z, L = Math.hypot(dx, dz);
      if (L < 0.08) { if (i + dir >= pts.length || i + dir < 0) dir = -dir; i += dir; wait = pause; return; }
      const st = Math.min(L, sp * dt); p.x += dx / L * st; p.z += dz / L * st; c.face(dx, dz); c.walk(dt, sp / 3.2);
    };
  };
  const dogP = patrol(dog, [[-12, 9], [0, 11], [12, 9]], 3.6, 2.0), nohP = patrol(noh, [[-14, -16.5], [0, -16.5], [14, -16.5], [14, -7]], 2.8, 2.5);
  drivers.forEach((d, i) => { d.walk = patrol(d.c, [[d.x + 2.4, 27], [d.x + 2.4, 20], [d.x + 2.4 - 4 + i, 14]], 3.0, 2.2 + i * 0.4); });
  ticks.push((dt, t) => {
    const a = t * 0.25; fk.position.set(Math.sin(a) * 20, 0, 14 + Math.cos(a) * 2); fk.rotation.y = Math.cos(a) > 0 ? Math.PI / 2 : -Math.PI / 2; fork.position.y = 0.4 + Math.max(0, Math.sin(t * 0.8)) * 3;
    dogP(dt); nohP(dt); nohT.p.set(noh.g.position.x, 6.2, noh.g.position.z); drivers.forEach((d) => d.walk(dt));   // 실제로 움직이는 만큼만 발걸음 (10/30 대표 "제자리걸음")
    waiters.forEach((w2, i) => w2.c.idle(dt));
  });
  return { noh, drivers, removeWaiter: (id) => { const w2 = waiters.find((x) => x.u.id === id); if (w2) { scene.remove(w2.c.g); waiters.splice(waiters.indexOf(w2), 1); } } };
}
