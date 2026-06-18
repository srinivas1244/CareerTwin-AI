"use client";

import { motion, useReducedMotion } from "framer-motion";

/** A single cog/gear built from a hub + radial teeth. */
function Gear({
  cx,
  cy,
  r,
  teeth = 8,
  color,
  spin,
  duration,
  reverse = false,
}: {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly teeth?: number;
  readonly color: string;
  readonly spin: boolean;
  readonly duration: number;
  readonly reverse?: boolean;
}) {
  const toothW = r * 0.34;
  const toothH = r * 0.42;
  const ticks = Array.from({ length: teeth }, (_, i) => (360 / teeth) * i);

  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={spin ? { rotate: reverse ? -360 : 360 } : undefined}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {ticks.map((deg) => (
        <rect
          key={deg}
          x={cx - toothW / 2}
          y={cy - r - toothH * 0.45}
          width={toothW}
          height={toothH}
          rx={toothW * 0.3}
          fill={color}
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.42} fill="var(--background)" opacity={0.9} />
    </motion.g>
  );
}

/** Animated illustration: a person and a robot working at laptops together. */
export function WorkspaceScene({ className = "" }: { readonly className?: string }) {
  const reduced = useReducedMotion();
  const spin = !reduced;

  return (
    <motion.div
      className={`animate-float-soft ${className}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <svg
        viewBox="0 0 600 330"
        fill="none"
        className="h-auto w-full"
        role="img"
        aria-label="A person and a robot working together at laptops"
      >
        {/* ── Dashed thought clouds ─────────────────────────────────── */}
        <path
          d="M70 96 q-26 -6 -22 -30 q4 -22 30 -18 q6 -22 34 -14 q20 -20 42 -2 q26 -4 22 24 q20 12 2 30 Z"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeDasharray="4 7"
          strokeLinecap="round"
          opacity={0.5}
          fill="none"
        />
        <path
          d="M430 86 q-24 -8 -18 -32 q6 -22 32 -14 q10 -22 36 -10 q22 -16 40 6 q24 0 16 28 q16 14 -4 28 Z"
          stroke="var(--brand-2)"
          strokeWidth={2}
          strokeDasharray="4 7"
          strokeLinecap="round"
          opacity={0.5}
          fill="none"
        />

        {/* ── Ground shadows ────────────────────────────────────────── */}
        <ellipse cx="165" cy="298" rx="92" ry="13" fill="var(--brand)" opacity={0.1} />
        <ellipse cx="435" cy="298" rx="92" ry="13" fill="var(--brand-2)" opacity={0.1} />

        {/* ── Floating gears (between the two) ───────────────────────── */}
        <Gear cx={300} cy={86} r={30} teeth={9} color="#f87171" spin={spin} duration={11} />
        <Gear cx={348} cy={120} r={21} teeth={8} color="#9aa0b8" spin={spin} duration={8} reverse />
        <Gear cx={286} cy={140} r={15} teeth={7} color="#fbbf24" spin={spin} duration={6} />

        {/* ── ROBOT (left) ──────────────────────────────────────────── */}
        <g>
          {/* body */}
          <rect x="120" y="168" width="90" height="86" rx="22" fill="#cdd2e6" />
          <rect x="142" y="196" width="46" height="34" rx="9" fill="#aeb4d0" />
          {/* arms */}
          <rect x="104" y="190" width="22" height="56" rx="11" fill="#bcc1d8" />
          <rect x="204" y="190" width="22" height="56" rx="11" fill="#bcc1d8" />
          {/* neck */}
          <rect x="158" y="156" width="14" height="16" fill="#aeb4d0" />
          {/* head */}
          <rect x="126" y="104" width="78" height="60" rx="20" fill="#cdd2e6" />
          <rect x="116" y="120" width="10" height="24" rx="5" fill="#aeb4d0" />
          <rect x="204" y="120" width="10" height="24" rx="5" fill="#aeb4d0" />
          {/* visor */}
          <rect x="138" y="118" width="54" height="30" rx="13" fill="#20243a" />
          {/* eyes (blink) */}
          <g className="animate-blink">
            <circle cx="153" cy="133" r="6" fill="#5ad1c4" />
            <circle cx="177" cy="133" r="6" fill="#5ad1c4" />
          </g>
          {/* antenna */}
          <line x1="165" y1="104" x2="165" y2="86" stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
          <circle cx="165" cy="80" r="6" fill="var(--brand)" className="animate-pulse-glow" />
        </g>

        {/* ── HUMAN (right) ─────────────────────────────────────────── */}
        <g>
          {/* torso / shirt */}
          <path d="M396 254 v-44 a40 40 0 0 1 80 0 v44 Z" fill="var(--brand)" />
          {/* arms */}
          <rect x="382" y="206" width="20" height="54" rx="10" fill="var(--brand)" />
          <rect x="470" y="206" width="20" height="54" rx="10" fill="var(--brand)" />
          <circle cx="392" cy="256" r="11" fill="#e8b894" />
          <circle cx="480" cy="256" r="11" fill="#e8b894" />
          {/* neck */}
          <rect x="427" y="156" width="18" height="20" rx="6" fill="#e8b894" />
          {/* head */}
          <circle cx="436" cy="138" r="28" fill="#e8b894" />
          {/* hair */}
          <path d="M408 136 a28 28 0 0 1 56 0 q-10 -10 -28 -10 q-18 0 -28 10 Z" fill="#2f2a45" />
          <path d="M462 134 q6 -2 4 10 q-4 -6 -4 -10 Z" fill="#2f2a45" />
          {/* face dots */}
          <circle cx="428" cy="138" r="2.4" fill="#2f2a45" />
          <circle cx="446" cy="138" r="2.4" fill="#2f2a45" />
          <path d="M430 148 q6 5 12 0" stroke="#b9805f" strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>

        {/* ── Laptops (drawn last so they overlap the figures) ──────── */}
        {/* robot laptop */}
        <g>
          <rect x="124" y="214" width="82" height="46" rx="7" fill="#34384e" />
          <rect x="132" y="222" width="66" height="30" rx="4" fill="#4f8cff" opacity={0.85} />
          <rect x="110" y="258" width="110" height="10" rx="4" fill="#262a3c" />
        </g>
        {/* human laptop */}
        <g>
          <rect x="394" y="214" width="82" height="46" rx="7" fill="#34384e" />
          <circle cx="435" cy="237" r="7" fill="var(--brand)" />
          <rect x="380" y="258" width="110" height="10" rx="4" fill="#262a3c" />
        </g>

        {/* connection spark between them */}
        <motion.circle
          cx="300"
          cy="240"
          r="3.5"
          fill="var(--brand-2)"
          animate={spin ? { opacity: [0.2, 1, 0.2], cx: [270, 330, 270] } : undefined}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
