/* 论文通解 · 下潜封面 —— 真实 3D MacBook（three.js r160，本地 vendored，零 CDN）
   真实铰链几何 + PBR 铝壳 +  studio 环境反射 + 键盘贴图 + 自发光玻璃屏幕播放精读演示。
   三幕：闭合银机身由远及近停稳 → 缓缓掀盖 → 屏幕点亮。WebGL 不可用时不挂载，回退 CSS 路径。 */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const canvas = document.getElementById('gl');
const diveEl = document.getElementById('dive');
const screenEl = document.getElementById('screen');
const body = document.body;
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---- 屏幕演示轮播内容（与页面 reel 同源） ---- */
const SLIDES = [
  { i: '1', t: '逐句人话对照', s: '学术黑话 → 一句话讲明白', kind: 'plain', txt: '"说人话：模型不再一个字一个字地读，而是一眼看完整个句子。"', terms: ['self-attention 自注意力', 'encoder 编码器'] },
  { i: '2', t: '红笔拆解', s: '像老师在你的句子上圈点批注', kind: 'pen', txt: '红笔：这里出现 however，作者要拆前面的"主流做法"了——注意转折。' },
  { i: '3', t: '理解度滑杆', s: '小学生 → 审稿人，同一句话五档讲法', kind: 'scale', txt: '切到"本科生"：并行计算 + 位置编码，兼顾速度与长距离依赖。' },
  { i: '4', t: '费曼考官 · 小通', s: '它讲不算数，你能复述才算懂', kind: 'bubble', txt: '用你自己的话说说：为什么"一眼看完整个句子"比"逐个读"快？' }
];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { window.dive3d = null; }
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // 烘焙 studio 环境，一次生成
  pmrem.dispose();

  /* 屏幕/边框专用暗环境：RoomEnvironment 的白色灯板会在玻璃上烧出死白反光，
     这里单独烘焙一个低亮度靛蓝棚景，只留一条柔和的柔光箱高光。 */
  function makeScreenEnv() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x080a14);
    const panel = (hex, w, h, x, y, z, rx, ry) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide })
      );
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    panel(0x313a63, 7, 2.2, 0, 4.5, 0, Math.PI / 2, 0);   // 顶部柔光箱
    panel(0x1d2340, 6, 3, -4.5, 1.5, 1, 0, Math.PI / 3);   // 左
    panel(0x171b30, 6, 3, 4.5, 1.5, -1, 0, -Math.PI / 3);  // 右
    const p = new THREE.PMREMGenerator(renderer);
    const tex = p.fromScene(s, 0.04).texture; p.dispose();
    return tex;
  }
  const screenEnv = makeScreenEnv();

  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);

  /* ---- 材质（复用，不重建） ----
     机身保留 studio 反射有金属感；屏幕/边框改用自建暗棚，避免白光板洗白黑玻璃。 */
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xc2c6cc, metalness: 0.9, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.9 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x8d9198, metalness: 0.88, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.7 });
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.8, roughness: 0.5 });
  const bezelMat = new THREE.MeshPhysicalMaterial({ color: 0x08090c, metalness: 0.1, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMap: screenEnv, envMapIntensity: 0.22 });

  /* ---- 尺寸（ MacBook 14" 比例） ---- */
  const BW = 3.04, BD = 2.12, BH = 0.16;      // 机身
  const LW = 3.04, LT = 0.06, LL = 2.02;      // 上盖
  const SW = 2.86, SH = 1.86;                // 屏幕

  const group = new THREE.Group(); scene.add(group);

  const base = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 4, 0.05), alu);
  base.position.y = BH / 2; group.add(base);

  /* 键盘顶面贴图（正交绘制，映射到 3D 顶面才正确） */
  const kbTex = new THREE.CanvasTexture(drawKeyboard());
  kbTex.colorSpace = THREE.SRGBColorSpace; kbTex.anisotropy = 4;
  const kbPlane = new THREE.Mesh(roundedPlane(BW - 0.05, BD - 0.05, 0.09), new THREE.MeshStandardMaterial({ map: kbTex, metalness: 0.05, roughness: 0.82, envMap: screenEnv, envMapIntensity: 0.25 }));
  kbPlane.rotation.x = -Math.PI / 2; kbPlane.position.y = BH + 0.0015; group.add(kbPlane);

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, BW - 0.24, 24), hingeMat);
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, BH + 0.01, -BD / 2 + 0.08); group.add(hinge);

  /* 上盖：铰链组在机身后缘；rotation.x=0 闭合平伏，负角掀开 */
  const lidGroup = new THREE.Group(); lidGroup.position.set(0, BH, -BD / 2 + 0.08); group.add(lidGroup);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(LW, LT, LL, 4, 0.028), alu);
  lid.position.set(0, 0, LL / 2); lidGroup.add(lid);

  /* 玻璃屏幕：闭合时朝下贴键盘，开启后朝向镜头；自发光贴图播放演示。
     环境反射压低——熄屏时是黑玻璃而非白镜；点亮后内容自发光主导。 */
  const bezel = new THREE.Mesh(roundedPlane(LW - 0.05, LL - 0.05, 0.04), bezelMat);
  bezel.rotation.x = Math.PI / 2; bezel.position.set(0, -LT / 2 - 0.001, LL / 2); lidGroup.add(bezel);
  const reelCanvas = drawReel(0);
  const reelTex = new THREE.CanvasTexture(reelCanvas);
  reelTex.colorSpace = THREE.SRGBColorSpace; reelTex.anisotropy = 4;
  const screenMat = new THREE.MeshPhysicalMaterial({ color: 0x05060a, metalness: 0, roughness: 0.22, clearcoat: 0.35, clearcoatRoughness: 0.28, emissive: 0xffffff, emissiveMap: reelTex, emissiveIntensity: 0, envMap: screenEnv, envMapIntensity: 0.18 });
  const screenMesh = new THREE.Mesh(roundedPlane(SW, SH, 0.05), screenMat);
  screenMesh.rotation.x = Math.PI / 2; screenMesh.position.set(0, -LT / 2 - 0.003, LL / 2); lidGroup.add(screenMesh);

  /* 太空中的接地辉光（代替地板阴影） */
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0x4353c9, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.06; group.add(glow);

  /* ---- 灯光：主光 + 靛蓝轮廓光 + 半球补光 ---- */
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3.5, 6, 4.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8090ff, 2.2); rim.position.set(-4, 2.5, -3.5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x93a0ff, 0x0a0c12, 0.35));

  /* ---- 缓动 ---- */
  const clamp01 = t => Math.max(0, Math.min(1, t));
  const eInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eBack = t => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- 机位：两段构图随开盖度混合——闭合俯拍英雄机位（顶面可见、居中），
     开启后降到产品片机位（键盘可读、屏幕近正对）；距离按前缘占屏宽反解，杜绝出框 ---- */
  const ZERO = new THREE.Vector3(0, 0, 0);
  let startPos = new THREE.Vector3(), startScale = 0.26, startRotY = 0.45, startRotX = 0.10;
  let camD = 6, camY = 2, lookY = 0.12, lookZ = 0;
  const TAN19 = Math.tan(THREE.MathUtils.degToRad(19));
  function frameFor(eO) {
    const tanH = TAN19 * (innerWidth / innerHeight);
    const dC = BW / (0.72 * 2 * tanH) + BD / 2;
    const dO = BW / (0.94 * 2 * tanH) + BD / 2;
    camD = lerp(dC, dO, eO); camY = lerp(2.35, 1.95, eO);
    lookY = lerp(0.12, 0.98, eO); lookZ = lerp(0, -0.3, eO);
  }
  function placeCamera() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    frameFor(0);
    camera.position.set(0, camY, camD); camera.lookAt(0, lookY, lookZ); camera.updateMatrixWorld();
    // 起点：老师照片中笔记本中心的射线远处 → 保证从她手中位置出发
    const sT = Math.max(innerWidth / 1536, innerHeight / 1024);
    const px = (innerWidth - 1536 * sT) / 2 + 1147.5 * sT, py = (innerHeight - 1024 * sT) / 2 + 592.5 * sT;
    const dir = new THREE.Vector3(px / innerWidth * 2 - 1, -(py / innerHeight * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize();
    startPos = camera.position.clone().add(dir.multiplyScalar(8.0));
  }
  placeCamera();

  /* ---- 时间线（纯函数，可 seek 验证） ---- */
  let state = 'idle', t0 = 0, paused = false, slide = 0, reelTimer = null;
  function evalT(t, out) {
    let eA, eO, eP, fade;
    if (!out) {
      eA = eInOut(clamp01(t / 1500));
      eO = eBack(clamp01((t - 1600) / 1800));
      eP = eOut(clamp01((t - 3400) / 700));
      fade = clamp01(t / 250);
    } else {
      eA = 1 - eInOut(clamp01((t - 700) / 900));
      eO = 1 - eInOut(clamp01(t / 700));
      eP = 1 - clamp01(t / 300);
      fade = 1 - clamp01((t - 1200) / 400);
    }
    group.position.lerpVectors(startPos, ZERO, eA);
    group.scale.setScalar(lerp(startScale, 1, eA));
    group.rotation.y = lerp(startRotY, 0, eA);
    group.rotation.x = lerp(startRotX, 0, eA);
    lidGroup.rotation.x = -THREE.MathUtils.degToRad(100) * eO;
    frameFor(eO);
    camera.position.set(0, camY, camD); camera.lookAt(0, lookY, lookZ);
    screenMat.emissiveIntensity = 1.15 * eP;
    glow.material.opacity = 0.1 + 0.1 * eP;
    glow.scale.setScalar(0.7 + 0.5 * eO);
    canvas.style.opacity = fade.toFixed(3);
  }

  /* 屏幕四角投影 → DOM 锚点（供点击与阅读页 FLIP 放大） */
  const corners = [[-SW / 2, -SH / 2], [SW / 2, -SH / 2], [SW / 2, SH / 2], [-SW / 2, SH / 2]].map(c => new THREE.Vector3(c[0], c[1], 0));
  const v = new THREE.Vector3();
  function anchor() {
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    for (const c of corners) {
      v.copy(c); screenMesh.localToWorld(v); v.project(camera);
      const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
      l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
    }
    screenEl.style.left = l.toFixed(1) + 'px'; screenEl.style.top = t.toFixed(1) + 'px';
    screenEl.style.width = (r - l).toFixed(1) + 'px'; screenEl.style.height = (b - t).toFixed(1) + 'px';
    screenEl.style.transform = 'none';
    // 锚点随掀盖角度淡入：盖未朝向镜头时不露出 DOM 层（闭合飞近阶段保持纯净 3D 机身）
    const deg = -THREE.MathUtils.radToDeg(lidGroup.rotation.x);
    screenEl.style.opacity = clamp01((deg - 55) / 35).toFixed(3);
  }

  function render(now) {
    if (state === 'in') { const t = now - t0; evalT(t, false); if (t >= 4100) state = 'steady'; }
    else if (state === 'out') { evalT(now - t0, true); }
    else if (state === 'steady') { evalT(4100, false); }
    if (state !== 'idle') {
      camera.position.x = Math.sin(now * 0.0004) * 0.02; // 极微漂移，保持"活着"
      camera.lookAt(0, lookY, lookZ);
      renderer.render(scene, camera); anchor();
    }
  }
  function loop(now) { requestAnimationFrame(loop); if (!paused && state !== 'idle') render(now); }
  requestAnimationFrame(loop);

  function startReel() { stopReel(); slide = 0; drawReelInto(reelCanvas, 0); reelTex.needsUpdate = true;
    reelTimer = setInterval(() => { slide = (slide + 1) % 4; drawReelInto(reelCanvas, slide); reelTex.needsUpdate = true; }, 2100); }
  function stopReel() { if (reelTimer) { clearInterval(reelTimer); reelTimer = null; } }

  /* ---- 对外 API ---- */
  body.classList.add('gl3d');
  diveEl.insertBefore(screenEl, document.getElementById('plane')); // 屏幕锚点脱离 CSS plane，独立浮在 canvas 上
  window.dive3d = {
    ready: true,
    start(onPowered) {
      diveEl.classList.add('live'); placeCamera();
      if (RM) { state = 'steady'; evalT(4100, false); renderer.render(scene, camera); anchor(); startReel(); onPowered(); return; }
      state = 'in'; t0 = performance.now();
      setTimeout(() => { startReel(); onPowered(); }, 3450);
    },
    back(onDone) {
      stopReel(); state = 'out'; t0 = performance.now();
      setTimeout(() => { state = 'idle'; canvas.style.opacity = '0'; diveEl.classList.remove('live'); onDone(); }, RM ? 0 : 1650);
      if (RM) { evalT(1650, true); }
    },
    setPaused(p) { paused = p; },
    resize() { renderer.setSize(innerWidth, innerHeight, false); placeCamera(); if (state !== 'idle') render(performance.now()); },
    seek(t, out) { evalT(t, !!out); renderer.render(scene, camera); anchor(); },
    debug() { return { state, hingeDeg: -THREE.MathUtils.radToDeg(lidGroup.rotation.x), emissive: +screenMat.emissiveIntensity.toFixed(2), scale: +group.scale.x.toFixed(2) }; }
  };
}

/* ---- 圆角矩形平面 + 正确 UV ---- */
function roundedPlane(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 8);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}

/* ---- 键盘顶面贴图 ---- */
function drawKeyboard() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 712;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 712); bg.addColorStop(0, '#b0b4ba'); bg.addColorStop(0.5, '#a6aab1'); bg.addColorStop(1, '#b6bac0');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 712);
  // 扬声器格栅
  g.fillStyle = 'rgba(60,64,70,.55)';
  for (let side = 0; side < 2; side++) { const ox = side ? 946 : 30; for (let yy = 60; yy < 400; yy += 7) for (let xx = 0; xx < 48; xx += 6) g.fillRect(ox + xx, yy, 2, 2); }
  // 键区：先画黑色凹陷键槽（真机键盘是沉在铝面下的一块黑域），键帽略亮于槽底
  const kx = 108, kw = 808, rows = 6, ky = 46, kh = 396;
  g.fillStyle = '#050609'; rr(g, kx - 16, ky - 14, kw + 32, kh + 26, 16); g.fill();
  g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, kx - 12, ky - 10, kw + 24, kh + 18, 14); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.5; rr(g, kx - 16, ky - 14, kw + 32, kh + 26, 16); g.stroke();
  g.fillStyle = '#26292f';
  const rh = kh / rows;
  for (let r = 0; r < rows; r++) {
    const n = r === 0 ? 14 : r === 5 ? 8 : 13;
    const gap = 6, cw = (kw - gap * (n - 1)) / n, hh = r === 0 ? rh * 0.62 : rh - gap;
    for (let i = 0; i < n; i++) {
      let w = cw, xx = kx + i * (cw + gap);
      if (r === 5) { const widths = [1.3, 1, 1, 1.6, 4.6, 1.6, 1, 1]; const tot = widths.reduce((a, b) => a + b, 0); const unit = (kw - gap * 7) / tot; w = widths[i] * unit; xx = kx + widths.slice(0, i).reduce((a, b) => a + b, 0) * unit + i * gap; }
      rr(g, xx, ky + r * rh, w, hh, 5); g.fill();
      g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, xx, ky + r * rh, w, 2.5, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, xx, ky + r * rh + hh - 2.5, w, 2.5, 2); g.fill(); g.fillStyle = '#26292f';
    }
  }
  // 触控板
  g.fillStyle = 'rgba(158,162,169,.92)'; rr(g, 332, 470, 360, 200, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; rr(g, 334, 472, 356, 196, 11); g.stroke();
  g.strokeStyle = 'rgba(70,74,80,.6)'; g.lineWidth = 2; rr(g, 332, 470, 360, 200, 12); g.stroke();
  return c;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* ---- 屏幕演示轮播贴图 ---- */
function drawReel(i) { const c = document.createElement('canvas'); c.width = 1024; c.height = 640; drawReelInto(c, i); return c; }
function drawReelInto(c, i) {
  const g = c.getContext('2d'); const sl = SLIDES[i];
  g.fillStyle = '#05060c'; g.fillRect(0, 0, 1024, 640);           // 黑 bezel
  const bg = g.createLinearGradient(0, 0, 0, 640); bg.addColorStop(0, '#0d1030'); bg.addColorStop(1, '#07091a');
  g.fillStyle = bg; rr(g, 24, 24, 976, 592, 14); g.fill();
  const F = '"Inter Tight","PingFang SC","Microsoft YaHei",sans-serif';
  // 标题
  g.fillStyle = '#a5b4fc'; g.beginPath(); g.arc(86, 96, 26, 0, 6.283); g.fill();
  g.fillStyle = '#05071a'; g.font = '800 30px ' + F; g.textAlign = 'center'; g.fillText(sl.i, 86, 107); g.textAlign = 'left';
  g.fillStyle = '#ffffff'; g.font = '800 44px ' + F; g.fillText(sl.t, 132, 111);
  g.fillStyle = '#a7aec4'; g.font = '500 26px ' + F; g.fillText(sl.s, 70, 160);
  // 正文骨架线
  g.fillStyle = 'rgba(255,255,255,.16)'; rr(g, 70, 200, 700, 14, 7); g.fill(); rr(g, 70, 232, 420, 14, 7); g.fill();
  g.fillStyle = '#dfe4ff'; g.font = '500 27px ' + F;
  if (sl.kind === 'plain') { wrap(g, sl.txt, 70, 300, 880, 40);
    let tx = 70; g.font = '600 22px ' + F;
    for (const t of sl.terms) { const w = g.measureText(t).width + 44; g.fillStyle = 'rgba(165,180,252,.18)'; rr(g, tx, 420, w, 44, 22); g.fill(); g.strokeStyle = 'rgba(165,180,252,.4)'; g.lineWidth = 1.5; rr(g, tx, 420, w, 44, 22); g.stroke(); g.fillStyle = '#a5b4fc'; g.fillText(t, tx + 22, 449); tx += w + 16; }
  } else if (sl.kind === 'pen') { g.fillStyle = 'rgba(165,180,252,.9)'; rr(g, 70, 200, 780, 14, 7); g.fill();
    g.fillStyle = '#f87171'; g.fillRect(70, 300, 8, 120); g.fillStyle = '#ffb4b4'; wrap(g, sl.txt, 100, 330, 840, 40);
  } else if (sl.kind === 'scale') { g.fillStyle = '#a7aec4'; g.font = '600 24px ' + F; g.fillText('小学生', 70, 330); g.fillText('审稿人', 880, 330);
    g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, 170, 316, 680, 10, 5); g.fill();
    g.fillStyle = '#a5b4fc'; g.shadowColor = '#a5b4fc'; g.shadowBlur = 24; g.beginPath(); g.arc(640, 321, 16, 0, 6.283); g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#dfe4ff'; g.font = '500 27px ' + F; wrap(g, sl.txt, 70, 400, 880, 40);
  } else { g.fillStyle = 'rgba(165,180,252,.12)'; rr(g, 70, 280, 880, 240, 24); g.fill(); g.strokeStyle = 'rgba(165,180,252,.3)'; g.lineWidth = 1.5; rr(g, 70, 280, 880, 240, 24); g.stroke();
    g.fillStyle = '#a5b4fc'; g.font = '800 26px ' + F; g.fillText('小通', 104, 330); g.fillStyle = '#e8ecf5'; g.font = '500 27px ' + F; wrap(g, sl.txt, 104, 380, 810, 40);
    g.fillStyle = 'rgba(255,255,255,.16)'; rr(g, 104, 450, 600, 12, 6); g.fill(); }
}
function wrap(g, text, x, y, maxW, lh) { let line = '', yy = y; for (const ch of text) { if (g.measureText(line + ch).width > maxW) { g.fillText(line, x, yy); line = ch; yy += lh; } else line += ch; } g.fillText(line, x, yy); }