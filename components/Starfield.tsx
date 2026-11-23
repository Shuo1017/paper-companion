import { useEffect, useRef, useState } from "react";

/**
 * 星空背景：三层景深 + 稀疏亮星 + 偶发流星。
 * 组件本身只负责绘制 canvas，页面级氛围（星云、噪点）由 globals.css 提供。
 * prefers-reduced-motion 下：星点保留但停止闪烁与流星，退化为静态背景。
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    type Star = {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      twinkleAmp: number;
      twinkleSpeed: number;
      phase: number;
      driftX: number;
      driftY: number;
      hue: number;
      bright: boolean;
    };
    type Shooter = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
    };

    let stars: Star[] = [];
    let shooters: Shooter[] = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let last = performance.now();

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function seed() {
      // 密度按视口面积估算，小屏不至于稀疏、大屏不至于过密。
      const area = width * height;
      const far = Math.round(area / 3200);
      const mid = Math.round(area / 8000);
      const near = Math.round(area / 26000);
      stars = [];
      // 远景：极小、偏暗、几乎不动
      for (let i = 0; i < far; i++) {
        stars.push({
          x: rand(0, width),
          y: rand(0, height),
          r: rand(0.35, 0.9),
          baseAlpha: rand(0.28, 0.55),
          twinkleAmp: rand(0.1, 0.28),
          twinkleSpeed: rand(0.4, 1.1),
          phase: rand(0, Math.PI * 2),
          driftX: rand(-0.006, 0.006),
          driftY: rand(-0.003, 0.003),
          hue: rand(215, 260),
          bright: false,
        });
      }
      // 中景：稍大，闪烁明显
      for (let i = 0; i < mid; i++) {
        stars.push({
          x: rand(0, width),
          y: rand(0, height),
          r: rand(0.9, 1.6),
          baseAlpha: rand(0.55, 0.85),
          twinkleAmp: rand(0.18, 0.38),
          twinkleSpeed: rand(0.9, 1.9),
          phase: rand(0, Math.PI * 2),
          driftX: rand(-0.012, 0.012),
          driftY: rand(-0.006, 0.006),
          hue: rand(210, 260),
          bright: false,
        });
      }
      // 近景：亮星，带光晕十字
      for (let i = 0; i < near; i++) {
        stars.push({
          x: rand(0, width),
          y: rand(0, height),
          r: rand(1.6, 2.6),
          baseAlpha: rand(0.75, 1),
          twinkleAmp: rand(0.2, 0.35),
          twinkleSpeed: rand(1.2, 2.6),
          phase: rand(0, Math.PI * 2),
          driftX: rand(-0.02, 0.02),
          driftY: rand(-0.01, 0.01),
          hue: rand(200, 250),
          bright: true,
        });
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawStar(s: Star, alpha: number) {
      const color = `hsla(${s.hue}, 85%, 88%, ${alpha.toFixed(3)})`;
      ctx!.beginPath();
      ctx!.fillStyle = color;
      ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx!.fill();
      if (s.bright) {
        // 十字星芒 + 光晕
        ctx!.save();
        ctx!.globalCompositeOperation = "lighter";
        const glow = ctx!.createRadialGradient(
          s.x,
          s.y,
          0,
          s.x,
          s.y,
          s.r * 8
        );
        glow.addColorStop(0, `hsla(${s.hue}, 90%, 85%, ${alpha * 0.35})`);
        glow.addColorStop(1, "transparent");
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r * 8, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = `hsla(${s.hue}, 90%, 92%, ${alpha * 0.7})`;
        ctx!.lineWidth = 0.6;
        ctx!.beginPath();
        ctx!.moveTo(s.x - s.r * 5, s.y);
        ctx!.lineTo(s.x + s.r * 5, s.y);
        ctx!.moveTo(s.x, s.y - s.r * 5);
        ctx!.lineTo(s.x, s.y + s.r * 5);
        ctx!.stroke();
        ctx!.restore();
      }
    }

    function spawnShooter() {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? rand(-40, width * 0.3) : rand(width * 0.7, width + 40);
      const y = rand(-20, height * 0.4);
      const angle = fromLeft ? rand(Math.PI / 5, Math.PI / 3.5) : rand((2 * Math.PI) / 3.5, (4 * Math.PI) / 5);
      const speed = rand(6, 10);
      shooters.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: rand(45, 80),
      });
    }

    function drawShooters(dt: number) {
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.life += dt;
        sh.x += sh.vx * dt * 60;
        sh.y += sh.vy * dt * 60;
        const t = sh.life / sh.max;
        const alpha = Math.sin(Math.PI * t) * 0.9;
        const tailX = sh.x - sh.vx * 8;
        const tailY = sh.y - sh.vy * 8;
        const grad = ctx!.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(220, 230, 255, ${alpha.toFixed(3)})`);
        grad.addColorStop(1, "transparent");
        ctx!.save();
        ctx!.globalCompositeOperation = "lighter";
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        ctx!.moveTo(sh.x, sh.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.stroke();
        ctx!.restore();
        if (sh.life > sh.max) shooters.splice(i, 1);
      }
    }

    let nextShooterAt = performance.now() + rand(2500, 6500);

    function render(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx!.clearRect(0, 0, width, height);

      for (const s of stars) {
        s.phase += dt * s.twinkleSpeed;
        s.x += s.driftX * dt * 60;
        s.y += s.driftY * dt * 60;
        if (s.x < -4) s.x = width + 4;
        if (s.x > width + 4) s.x = -4;
        if (s.y < -4) s.y = height + 4;
        if (s.y > height + 4) s.y = -4;
        const tw = reduced ? 0 : Math.sin(s.phase) * s.twinkleAmp;
        drawStar(s, Math.max(0.05, Math.min(1, s.baseAlpha + tw)));
      }

      if (!reduced) {
        if (now > nextShooterAt) {
          spawnShooter();
          nextShooterAt = now + rand(5200, 11500);
        }
        drawShooters(dt);
      }

      raf = requestAnimationFrame(render);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="cosmos-starfield"
        aria-hidden
      />
      <div className="cosmos-nebula" aria-hidden />
      <div className="cosmos-grain" aria-hidden />
    </>
  );
}
