'use client';

import { useEffect, useRef } from 'react';

const CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const FONT_SIZE = 14;
const COLUMN_GAP = FONT_SIZE + 2;
const FADE_ALPHA = 0.04;
const DROP_SPEED_MIN = 0.3;
const DROP_SPEED_MAX = 1.2;

function getThemeColor(): string {
  if (typeof document === 'undefined') return '#22c55e';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--primary').trim() || '#22c55e';
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let w = 0;
    let h = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      const newColumns = Math.floor(w / COLUMN_GAP);
      if (newColumns !== columns) {
        columns = newColumns;
        drops = Array.from({ length: columns }, () =>
          Math.random() * (h / FONT_SIZE)
        );
        speeds = Array.from(
          { length: columns },
          () => DROP_SPEED_MIN + Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN)
        );
      }
    }

    resize();

    if (prefersReducedMotion()) {
      const color = getThemeColor();
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT_SIZE}px monospace`;
      for (let i = 0; i < columns; i++) {
        const y = drops[i] * FONT_SIZE;
        ctx.fillStyle =
          color + Math.floor(Math.random() * 30 + 10).toString(16).padStart(2, '0');
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * COLUMN_GAP, y);
      }
      return;
    }

    let hidden = document.hidden;

    function onVisibilityChange() {
      hidden = document.hidden;
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    function draw() {
      if (hidden) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const color = getThemeColor();

      ctx!.fillStyle = `rgba(10, 10, 10, ${FADE_ALPHA})`;
      ctx!.fillRect(0, 0, w, h);
      ctx!.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * COLUMN_GAP;
        const y = drops[i] * FONT_SIZE;

        const brightness = 0.15 + Math.random() * 0.1;
        ctx!.fillStyle = color + Math.floor(brightness * 255).toString(16).padStart(2, '0');
        ctx!.fillText(char, x, y);

        drops[i] += speeds[i];

        if (drops[i] * FONT_SIZE > h && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] =
            DROP_SPEED_MIN + Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
