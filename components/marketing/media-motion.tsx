"use client";

import { useEffect, useRef } from "react";

/**
 * Cinematic motion-blur background — ported verbatim from the CoachPro design
 * artifact's `paintMotion`. Grainy warm-dark field with directional light
 * streaks, soft masses, a vignette and per-pixel grain. This IS the imagery in
 * the reference — generated, not a photograph. Fills its (relative) parent.
 */

type Slot = "hero" | "s1" | "s2" | "d1" | "d2" | "d3" | "cta";

// [seed, centerXFactor, angle] — exactly the artifact's SEEDS table.
const SEEDS: Record<Slot, [number, number, number]> = {
  hero: [42, 0.64, -0.28],
  s1: [113, 0.5, -0.2],
  s2: [271, 0.6, -0.32],
  d1: [7, 0.55, -0.24],
  d2: [88, 0.48, -0.3],
  d3: [150, 0.58, -0.22],
  cta: [333, 0.5, -0.18],
};

function rng(s: number) {
  s = s >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function paintMotion(cv: HTMLCanvasElement, seed: number, cxf: number, ang: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (!w || !h) return;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const g = cv.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = rng(seed || 7);

  // Crushed near-black base — pure monochrome, no warm tint (Tern).
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#151515");
  bg.addColorStop(0.5, "#090909");
  bg.addColorStop(1, "#000000");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  // Bright, blurred motion streaks — like blown-out light dragging across frame.
  function streak(cx: number, cy: number, len: number, th: number, a: number, bl: number) {
    g!.save();
    g!.globalCompositeOperation = "lighter";
    g!.translate(cx, cy);
    g!.rotate(ang);
    g!.filter = "blur(" + bl + "px)";
    const gr = g!.createLinearGradient(-len / 2, 0, len / 2, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.5, "rgba(255,255,255," + a + ")");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g!.fillStyle = gr;
    g!.fillRect(-len / 2, -th / 2, len, th);
    g!.restore();
  }
  // Big blown-out highlight mass (a blurred bright figure/backlight).
  function glow(cx: number, cy: number, r: number, a: number) {
    g!.save();
    g!.globalCompositeOperation = "lighter";
    g!.filter = "blur(" + r * 0.4 + "px)";
    const gr = g!.createRadialGradient(cx, cy, 2, cx, cy, r);
    gr.addColorStop(0, "rgba(255,255,255," + a + ")");
    gr.addColorStop(0.6, "rgba(255,255,255," + a * 0.5 + ")");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g!.fillStyle = gr;
    g!.beginPath();
    g!.arc(cx, cy, r, 0, 7);
    g!.fill();
    g!.restore();
  }
  // Deep black blurred mass — carves a shadowed silhouette.
  function shadow(cx: number, cy: number, rx: number, ry: number, a: number) {
    g!.save();
    g!.filter = "blur(48px)";
    g!.translate(cx, cy);
    g!.rotate(ang);
    const dm = g!.createRadialGradient(0, 0, 6, 0, 0, Math.max(rx, ry));
    dm.addColorStop(0, "rgba(0,0,0," + a + ")");
    dm.addColorStop(1, "rgba(0,0,0,0)");
    g!.fillStyle = dm;
    g!.beginPath();
    g!.ellipse(0, 0, rx, ry, 0, 0, 7);
    g!.fill();
    g!.restore();
  }

  // Two big blown highlights + a bright drag — the "blurred athlete" read.
  glow(w * (cxf - 0.12), h * (0.3 + 0.1 * R()), Math.min(w, h) * 0.5, 0.9);
  glow(w * (cxf + 0.22), h * (0.66 + 0.1 * R()), Math.min(w, h) * 0.42, 0.78);
  streak(w * cxf, h * 0.46, w * 1.25, h * 0.26, 0.85, 46);
  streak(w * (cxf - 0.06), h * 0.6, w * 1.05, h * 0.1, 0.7, 24);
  streak(w * (cxf + 0.05), h * 0.32, w * 0.95, h * 0.05, 0.75, 14);
  for (let i = 0; i < 10; i++) {
    streak(w * (0.2 + 0.6 * R()), h * (0.15 + 0.7 * R()), w * (0.5 + 0.5 * R()), 1.5 + 5 * R(), 0.14 + 0.2 * R(), 4 + 10 * R());
  }

  // Dark silhouette masses.
  shadow(w * 0.52, h * 0.55, w * 0.26, h * 0.62, 0.95);
  shadow(w * 0.85, h * 0.78, w * 0.24, h * 0.44, 0.9);
  shadow(w * 0.12, h * 0.85, w * 0.22, h * 0.4, 0.85);

  // Hard vignette so the frame melts into pure black.
  g.save();
  const vg = g.createRadialGradient(w * 0.5, h * 0.44, Math.min(w, h) * 0.12, w * 0.5, h * 0.5, Math.max(w, h) * 0.82);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(0.7, "rgba(0,0,0,.35)");
  vg.addColorStop(1, "rgba(0,0,0,.95)");
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  g.restore();

  // Heavy film grain — the defining Tern texture. Strong amplitude, applied to
  // a contrast-stretched signal so blacks stay crushed and whites blow out.
  try {
    const id = g.getImageData(0, 0, cv.width, cv.height);
    const d = id.data;
    for (let p = 0; p < d.length; p += 4) {
      // contrast stretch around mid
      let v = d[p];
      v = (v - 128) * 1.35 + 128;
      const n = (Math.random() * 2 - 1) * 52;
      v += n;
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      d[p] = d[p + 1] = d[p + 2] = v;
    }
    g.putImageData(id, 0, 0);
  } catch {
    /* tainted canvas / blocked — skip grain */
  }
}

export function MediaMotion({ slot }: { slot: Slot }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const [seed, cxf, ang] = SEEDS[slot];
    let t: ReturnType<typeof setTimeout>;
    const render = () => paintMotion(cv, seed, cxf, ang);
    render();
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(render, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [slot]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full"
    />
  );
}
