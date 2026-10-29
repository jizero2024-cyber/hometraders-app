// 홈트 사무실 · 창고 3D (10/29 대표 "창고랑 홈트사무실도 마을처럼 실제처럼") — 앞벽을 뗀 인형집 모양.
// 직원(AI 작업)·물건은 실제 자료 숫자만 보여 줌 — 숫자는 town.js 가 공유 DB 에서 읽어 tag()/setIdle() 로 넣음.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { critter } from './kit3d.js?v=1';

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
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.target.set(...o.target); ctl.enableDamping = true; ctl.minDistance = 25; ctl.maxDistance = 220; ctl.maxPolarAngle = 1.45; ctl.minAzimuthAngle = -1.1; ctl.maxAzimuthAngle = 1.1; ctl.update();
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
  const K = base(host, { ...o, cam: [30, 52, 108], target: [0, 18, 0], bg: '#D8E9FA' });
  const { scene, box, cyl, mat, clickable, tag, ticks } = K;
  const FW = 46, FD = 20, FH = 7.2, NF = 5;
  box(70, 1, 50, '#D9D3C6', 0, -1, 8);   // 땅
  box(64, 0.3, 22, '#8CCB6A', 0, 0, 22);   // 마당 잔디
  const FLOORS = [['#F6F1EA', '1F 디자인실'], ['#EEF3FA', '2F 배차 · 통신'], ['#FBF4EC', '3F 서류 · 확인'], ['#F1EFEA', '4F 회계'], ['#FFF3E8', '5F 대표실']];
  FLOORS.forEach(([c, name], f) => {
    const y = f * FH; box(FW, 0.5, FD, c, 0, y, 0); box(FW, FH, 0.5, '#FFFFFF', 0, y + 0.5, -FD / 2);
    box(0.5, FH, FD, '#F4F1EC', -FW / 2, y + 0.5, 0); const gl = box(0.3, FH - 0.5, FD, '#CDE6F5', FW / 2, y + 0.5, 0, scene, { transparent: true, opacity: 0.35, roughness: 0.1 }); gl.castShadow = false;
    tag(null, pill(name, 'rgba(255,255,255,.92)', '#6B5E55'), -FW / 2 + 5, y + FH - 0.6, FD / 2 - 1).d.style.pointerEvents = 'none';
  });
  box(FW + 1, 0.8, FD + 1, '#E8732C', 0, NF * FH, 0);   // 지붕
  const logoT = new THREE.TextureLoader().load('/icons/logo-full.png'); logoT.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: logoT, transparent: true })); logo.position.set(0, NF * FH + 4.5, 0); scene.add(logo);
  // 계단 (오른쪽 바깥)
  for (let f = 0; f < NF; f++) for (let i = 0; i < 8; i++) box(5, 0.4, 2, '#E3DED6', FW / 2 + 3.5, f * FH + i * (FH / 8), -FD / 2 + 2 + i * 2.1);
  const desk = (x, f, z = -2, c = '#D9B88C') => { const y = f * FH + 0.5; box(6, 0.3, 3, c, x, y + 2.2, z); [-2.7, 2.7].forEach((a) => box(0.3, 2.2, 2.6, '#BFA27A', x + a, y, z)); box(2.6, 1.6, 0.2, '#2B2F36', x, y + 2.5, z - 1.1); box(2.4, 1.4, 0.05, '#7FB7E8', x, y + 2.6, z - 0.98, scene, { emissive: '#7FB7E8', emissiveIntensity: 0.4 }); };
  // 직원 자리 (AI 작업) — o.staff: [{k,who,f,x}]
  const seats = {};
  (o.staff || []).forEach((s) => {
    desk(s.x, s.f); const c = critter(s.av); c.g.scale.setScalar(1.6); c.g.position.set(s.x, s.f * FH + 0.5, -4.6); c.g.rotation.y = 0; scene.add(c.g); clickable(c.g, s.k);
    seats[s.k] = { c, home: [s.x, s.f * FH + 0.5, -4.6], at: 'desk', s };
  });
  // 물건
  const OBJ = {};
  { const f = 2, y = f * FH + 0.5, g = new THREE.Group(); g.position.set(13, y, -6); scene.add(g); box(4, 2.6, 3, '#E6E8EB', 0, 0, 0, g); box(3.4, 0.3, 2.2, '#FFFFFF', 0, 2.6, 0.2, g); box(2.8, 0.1, 2, '#FFFFFF', 0, 1.5, 1.6, g); clickable(g, 'printer'); OBJ.printer = [13, y + 4.5, -6]; }
  { const f = 2, y = f * FH + 0.5, g = new THREE.Group(); g.position.set(-14, y, -9.6); scene.add(g); box(10, 4.6, 0.3, '#FFFFFF', 0, 1.2, 0, g); box(10.4, 0.3, 0.6, '#9AA5B1', 0, 1.0, 0.2, g); [['#FFE680', -3], ['#FFB5C8', -0.5], ['#B5E3FF', 2], ['#C8F0B0', 3.5]].forEach(([c, x], i) => box(1.6, 1.4, 0.05, c, x, 2.2 + (i % 2) * 1.6, 0.2, g)); clickable(g, 'board'); OBJ.board = [-14, y + 6.6, -9.4]; }
  { const f = 0, y = 0.5, g = new THREE.Group(); g.position.set(-16, y, -7.5); scene.add(g); box(6, 5, 1.6, '#C9A26B', 0, 0, 0, g); [0, 1, 2].forEach((r) => { box(5.6, 0.2, 1.4, '#B08A55', 0, 1 + r * 1.5, 0.1, g); [0, 1, 2, 3].forEach((i) => box(1, 1.2, 0.15, ['#E8732C', '#3F7FE0', '#2E9A5A', '#F5B400'][(i + r) % 4], -2.1 + i * 1.4, 1.2 + r * 1.5, 0.6, g, null)); }); clickable(g, 'pamph'); OBJ.pamph = [-16, y + 6.6, -7.5]; }
  { const y = (NF - 1) * FH + 0.5, g = new THREE.Group(); g.position.set(-10, y, 2); scene.add(g); cyl(3.6, 0.3, '#E2C9A0', 0, 2.2, 0, g, 28); cyl(0.4, 2.2, '#BFA27A', 0, 0, 0, g); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(1.2, 1.4, 1.2, '#FFFFFF', Math.cos(a) * 4.8, 0, Math.sin(a) * 4.8, g); } clickable(g, 'meet'); OBJ.meet = [-10, y + 5, 2]; }
  { const g = new THREE.Group(); g.position.set(20, 0.3, 26); scene.add(g); cyl(0.25, 2.6, '#555', 0, 0, 0, g, 8); box(2.6, 2.2, 1.8, '#E8732C', 0, 2.6, 0, g); g.scale.setScalar(1.3); clickable(g, 'mail'); OBJ.mail = [20, 7.5, 26]; }
  // 마당 — 빈백 (할 일 0 인 직원) · 와인바
  const REST = [[-20, 24], [-15, 25], [-10, 24], [-5, 26], [0, 25], [5, 26], [10, 24], [-24, 28]];
  REST.slice(0, 5).forEach(([x, z], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), mat(['#F7A8C8', '#FFE07A', '#A6E3B8', '#B5D4F4', '#F0B48A'][i])); b.scale.y = 0.6; b.position.set(x, 0.9, z + 1.4); b.castShadow = true; scene.add(b); });
  box(8, 3, 2.6, '#A8774A', 26, 0.3, 14); box(8.6, 0.3, 3.2, '#7A5232', 26, 3.3, 14);
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
    setTag(key, html, pos) { if (tagsBy[key]) { tagsBy[key].d.innerHTML = html; if (pos) tagsBy[key].p.set(...pos); return; } const p = pos || (seats[key] ? [seats[key].home[0], seats[key].home[1] + 6.2, seats[key].home[2]] : OBJ[key]); if (p) tagsBy[key] = tag(key, html, ...p); },
    setIdle(k, idle, ri) {   // 할 일 0 → 마당 빈백, 생기면 자리로
      const st = seats[k]; if (!st) return; const want = idle ? 'rest' : 'desk'; if (st.at === want || st.at === 'walk') return;
      st.at = 'walk'; const [hx, hy, hz] = st.home, [rx, rz] = REST[ri % REST.length];
      if (idle) goTo(k, new THREE.Vector3(rx, 0.3, rz), () => { st.at = 'rest'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(rx, 5.2, rz); });
      else goTo(k, new THREE.Vector3(hx, hy, hz), () => { st.at = 'desk'; st.c.g.rotation.y = 0; if (tagsBy[k]) tagsBy[k].p.set(hx, hy + 6.2, hz); });
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
  box(WW, 0.6, WD, '#C9C4BA', 0, -0.6, 0); box(WW, WH, 0.6, '#EDEFF2', 0, 0, -WD / 2); box(0.6, WH, WD, '#E4E7EB', -WW / 2, 0, 0); box(0.6, WH, WD, '#E4E7EB', WW / 2, 0, 0);
  box(WW + 1, 0.8, 4, '#3F7FE0', 0, WH, -WD / 2 + 1.4);
  for (let i = -3; i <= 3; i++) box(0.3, 0.02, WD - 4, '#F5C431', i * 9, 0.01, 0);
  // 선반 — 실제 품목 (o.items: [{key,name,qty,unit,cat}])
  const items = (o.items || []).slice(0, 24), colC = { 구조재: '#E2B87A', 방부목: '#B9925E', 실리콘: '#F2F2F2', 철물: '#9AA5B1', 세라믹: '#D9D4CA', OSB: '#D7B37A' };
  const rackX = [-24, -8, 8, 24];
  rackX.forEach((x) => { [-1, 1].forEach((s) => box(0.4, 14, 0.4, '#E8732C', x + s * 6.5, 0, -13)); [-1, 1].forEach((s) => box(0.4, 14, 0.4, '#E8732C', x + s * 6.5, 0, -7)); [0, 4.6, 9.2].forEach((y) => box(13.4, 0.35, 6.4, '#3F6FB8', x, y + 0.3, -10)); });
  items.forEach((it, i) => {
    const r = i % 4, lvl = Math.floor(i / 4) % 3, slot = Math.floor(i / 12), x = rackX[r] + (slot ? 3.1 : -3.1), y = lvl * 4.6 + 0.65, z = -10;
    const c = Object.entries(colC).find(([k]) => (it.cat || it.name).includes(k)); const h = Math.min(3.6, 0.8 + Math.log10(1 + it.qty) * 1.2);
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g); box(5.4, 0.3, 5, '#B88B55', 0, 0, 0, g); box(5, h, 4.6, c ? c[1] : '#E9C98F', 0, 0.3, 0, g); clickable(g, 'item:' + it.key);
    tag('item:' + it.key, pill(`${it.name} ${Math.floor(it.qty)}${it.unit || ''}`, 'rgba(255,255,255,.95)', '#4A3F3A'), x, y + h + 1.4, z + 2.4);
  });
  // 키오스크 · 지게차 · 불독 · 노훈님
  { const g = new THREE.Group(); g.position.set(-28, 0, 12); scene.add(g); box(2.4, 5.4, 1.6, '#FFFFFF', 0, 0, 0, g); box(2, 2.6, 0.1, '#2B2F36', 0, 2.4, 0.82, g); box(1.8, 2.3, 0.05, '#9FD0FF', 0, 2.55, 0.88, g, { emissive: '#9FD0FF', emissiveIntensity: 0.5 }); clickable(g, 'kiosk'); }
  const fk = new THREE.Group(); scene.add(fk); box(3, 2.2, 4.2, '#F5B400', 0, 0.6, 0, fk); box(0.3, 6, 0.3, '#333', -1, 0, 2.3, fk); box(0.3, 6, 0.3, '#333', 1, 0, 2.3, fk); const fork = box(2.6, 0.25, 2.6, '#333', 0, 0.4, 3.4, fk); box(2.8, 0.2, 2.8, '#B88B55', 0, 0.65, 3.4, fork.parent);
  const dog = critter('dog'); dog.g.scale.setScalar(1.6); scene.add(dog.g); const noh = critter('worker'); noh.g.scale.setScalar(1.7); scene.add(noh.g); clickable(noh.g, 'noh');
  const nohT = tag('noh', pill('노훈님 · 창고', '#fff', '#4A3F3A', DOT.ok), 0, 0, 0);
  // 기사님 — 오늘 출고 건만 (o.drivers: [{key,label}])
  const drivers = (o.drivers || []).slice(0, 6).map((d, i) => { const c = critter('driver'); c.g.scale.setScalar(1.6); scene.add(c.g); clickable(c.g, 'drv:' + d.key); return { c, d, ph: i * 2.3 }; });
  box(12, 6, 6, '#7FB2FF', 22, 0.6, 26); box(4.6, 4.6, 5.6, '#3F7FE0', 30, 0.6, 26);   // 문 앞 트럭
  ticks.push((dt, t) => {
    const a = t * 0.25; fk.position.set(Math.sin(a) * 18, 0, 4 + Math.cos(a) * 3); fk.rotation.y = Math.cos(a) > 0 ? Math.PI / 2 : -Math.PI / 2; fork.position.y = 0.4 + Math.max(0, Math.sin(t * 0.8)) * 3;
    dog.g.position.set(-14 + Math.sin(t * 0.4) * 10, 0, 2); dog.face(Math.cos(t * 0.4), 0); dog.walk(dt, 0.8);
    const nz = Math.sin(t * 0.3); noh.g.position.set(8 + nz * 12, 0, -3); noh.face(Math.cos(t * 0.3), 0); noh.walk(dt, 0.7);
    nohT.p.set(8 + nz * 12, 6.2, -3);
    drivers.forEach((d, i) => { const p = ((t * 0.08 + d.ph) % 2); const f = p < 1 ? p : 2 - p; const x = -28 + f * 50, z = 16 + i * 1.6; d.c.g.position.set(x, 0, z); d.c.face(p < 1 ? 1 : -1, 0); d.c.walk(dt); });
  });
  return { noh, drivers };
}
