import React from 'react'
import { useThemeStore } from '@/store/theme.store'

/* ── Deterministic star positions ── */
const STARS = [
  { id: 0,  x: 67, y: 5,  s: 1.5, o: 0.7, d: 2.1 },
  { id: 1,  x: 73, y: 15, s: 1.0, o: 0.4, d: 3.4 },
  { id: 2,  x: 81, y: 8,  s: 2.0, o: 0.6, d: 2.8 },
  { id: 3,  x: 57, y: 21, s: 1.0, o: 0.5, d: 1.9 },
  { id: 4,  x: 89, y: 13, s: 1.5, o: 0.7, d: 3.1 },
  { id: 5,  x: 77, y: 29, s: 1.0, o: 0.3, d: 2.5 },
  { id: 6,  x: 94, y: 7,  s: 2.0, o: 0.6, d: 1.8 },
  { id: 7,  x: 84, y: 24, s: 1.0, o: 0.4, d: 3.8 },
  { id: 8,  x: 62, y: 11, s: 1.5, o: 0.5, d: 2.2 },
  { id: 9,  x: 69, y: 34, s: 1.0, o: 0.3, d: 4.1 },
  { id: 10, x: 87, y: 19, s: 2.0, o: 0.7, d: 2.6 },
  { id: 11, x: 54, y: 27, s: 1.0, o: 0.4, d: 3.0 },
  { id: 12, x: 92, y: 31, s: 1.5, o: 0.6, d: 2.3 },
  { id: 13, x: 75, y: 3,  s: 1.0, o: 0.5, d: 3.5 },
  { id: 14, x: 59, y: 17, s: 2.0, o: 0.4, d: 2.0 },
  { id: 15, x: 96, y: 39, s: 1.0, o: 0.3, d: 4.5 },
  { id: 16, x: 64, y: 37, s: 1.5, o: 0.5, d: 2.8 },
  { id: 17, x: 79, y: 41, s: 1.0, o: 0.4, d: 1.9 },
  { id: 18, x: 86, y: 35, s: 1.5, o: 0.6, d: 3.2 },
  { id: 19, x: 51, y: 9,  s: 1.0, o: 0.3, d: 2.7 },
  { id: 20, x: 90, y: 26, s: 2.0, o: 0.5, d: 3.9 },
]

/* ── Wireframe Camry-80-inspired sedan ── */
function WireframeCar({ color }: { color: string }) {
  /*
    viewBox 0 0 500 150
    Rear wheel:  cx=112 cy=121 r=21  (bottom y=142)
    Front wheel: cx=383 cy=121 r=21  (bottom y=142)
    Wheelbase:   271px  ≈ Camry XV80 2825mm at scale
    Ground:      y=142
    Sill:        y=111
    Roof peak:   y=17
  */
  const c = color           // stroke color
  const o = 0.82            // base opacity

  /* 5-spoke rim generator */
  function spokes(cx: number, cy: number, r1: number, r2: number) {
    return Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72 - 90) * (Math.PI / 180)
      return (
        <line key={i}
          x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
          x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
          stroke={c} strokeWidth="0.7" opacity={0.55}
        />
      )
    })
  }

  return (
    <svg viewBox="0 0 500 150" width="100%" height="auto" style={{ overflow: 'visible' }}>

      {/* ── Ground shadow ── */}
      <ellipse cx="250" cy="145" rx="220" ry="4.5" fill={c} opacity={0.07} />

      {/* ── MAIN BODY SILHOUETTE ──
          Traced counterclockwise (exterior boundary):
          Rear bumper → trunk → C-pillar → roof → A-pillar → hood → front bumper
          → front arch (up) → sill → rear arch (up) → close */}
      <path
        d={`
          M 16,111
          Q 11,100 13,89
          L 18,78
          Q 24,67 34,62
          L 36,60
          Q 40,55 50,51
          L 115,41
          Q 127,33 137,25
          Q 148,17 163,16
          L 291,14
          Q 314,12 332,18
          L 358,49
          Q 366,61 372,72
          L 462,71
          Q 474,75 480,86
          L 482,106
          Q 482,118 476,120
          L 416,111
          C 416,86 352,86 352,111
          L 138,111
          C 138,86 78,86 78,111
          Z
        `}
        stroke={c} strokeWidth="1.6" fill="none" opacity={o}
        strokeLinejoin="round" strokeLinecap="round"
      />

      {/* ── WINDOWS ── */}

      {/* Front door window
          Front-bottom A-pillar base: (354,90)  Front-top: (330,18)
          Rear-top B-pillar: (211,15)  Rear-bottom B-pillar: (208,100)
          Belt line is almost level on front door */}
      <path
        d="M 354,90 L 330,18 L 211,15 L 208,100 Q 280,96 354,90 Z"
        stroke={c} strokeWidth="0.9" fill={c} fillOpacity="0.05" opacity={o}
        strokeLinejoin="round"
      />

      {/* Rear door window — Camry XSE style: dramatically rising belt line
          Front: B-pillar (208,100)→(211,15)
          Rear:  C-pillar inner (162,16)→(148,40)
          Bottom: steep curve matching character line */}
      <path
        d="M 208,100 L 211,15 L 162,16 L 148,40 Q 178,66 208,100 Z"
        stroke={c} strokeWidth="0.9" fill={c} fillOpacity="0.05" opacity={o}
        strokeLinejoin="round"
      />

      {/* Rear glass (between C-pillar and trunk) */}
      <path
        d="M 163,16 L 164,16 L 115,41 L 148,40 Z"
        stroke={c} strokeWidth="0.75" fill={c} fillOpacity="0.04" opacity={o * 0.85}
        strokeLinejoin="round"
      />

      {/* ── PILLARS ── */}

      {/* B-pillar solid */}
      <line x1="210" y1="15" x2="207" y2="111"
        stroke={c} strokeWidth="2.2" opacity={o} strokeLinecap="round"
      />

      {/* A-pillar inner edge (parallel to outer) */}
      <path d="M 354,90 L 330,18" stroke={c} strokeWidth="0.65" opacity={o * 0.7} />

      {/* ── DETAIL LINES ── */}

      {/* Roof drip rail (inner roof edge) */}
      <path d="M 332,18 L 211,15"
        stroke={c} strokeWidth="0.5" opacity={o * 0.55} />

      {/* Hood crease — running line from windshield base to front */}
      <path d="M 374,74 L 462,71"
        stroke={c} strokeWidth="0.6" opacity={o * 0.65} />
      {/* Secondary hood edge crease */}
      <path d="M 382,79 Q 420,79 462,78"
        stroke={c} strokeWidth="0.45" fill="none" opacity={o * 0.4} />

      {/* Trunk lid crease */}
      <path d="M 115,41 L 50,51"
        stroke={c} strokeWidth="0.55" opacity={o * 0.55} />

      {/* Door gap (between front/rear door) */}
      <line x1="208" y1="111" x2="210" y2="73"
        stroke={c} strokeWidth="0.55" opacity={o * 0.65} strokeDasharray="3 2"
      />

      {/* Camry character line — rises steeply from front door to rear */}
      <path d="M 353,91 Q 280,97 208,100 Q 178,88 148,72 Q 120,61 50,59"
        stroke={c} strokeWidth="0.75" fill="none" opacity={o * 0.7}
      />

      {/* Sill / rocker panel line */}
      <path d="M 78,111 L 138,111 M 352,111 L 416,111"
        stroke={c} strokeWidth="0.4" opacity={o * 0.45}
      />

      {/* ── HEADLIGHT (Camry XV80 style — angular swept-back) ── */}
      <path d="M 480,85 L 462,72 L 448,73 L 450,88 L 480,91 Z"
        stroke={c} strokeWidth="0.9" fill="none" opacity={o * 0.85}
        strokeLinejoin="round"
      />
      {/* DRL inner strip */}
      <path d="M 464,74 L 450,76 L 451,86 L 476,88"
        stroke={c} strokeWidth="0.45" fill="none" opacity={o * 0.5}
      />
      {/* Headlight glow line */}
      <line x1="451" y1="79" x2="478" y2="82"
        stroke={c} strokeWidth="0.35" opacity={o * 0.4}
      />

      {/* ── TAILLIGHTS (Camry XV80 — arrow-shaped) ── */}
      <path d="M 16,78 L 26,67 L 36,67 L 36,90 L 18,94 Z"
        stroke={c} strokeWidth="0.9" fill="none" opacity={o * 0.85}
        strokeLinejoin="round"
      />
      {/* Taillight inner detail */}
      <path d="M 19,80 L 27,71 L 34,71 L 34,88"
        stroke={c} strokeWidth="0.45" fill="none" opacity={o * 0.5}
      />

      {/* ── FRONT GRILLE / LOWER BUMPER ── */}
      {/* Upper grille mesh area */}
      <path d="M 480,92 Q 483,100 482,110 L 478,112"
        stroke={c} strokeWidth="0.65" fill="none" opacity={o * 0.6}
      />
      {/* Lower grille slats */}
      {[95, 101, 107].map(y => (
        <line key={y} x1="470" y1={y} x2="481" y2={y + 1}
          stroke={c} strokeWidth="0.35" opacity={o * 0.35}
        />
      ))}

      {/* ── REAR BUMPER LOWER DETAIL ── */}
      <path d="M 14,103 Q 13,108 15,113"
        stroke={c} strokeWidth="0.55" fill="none" opacity={o * 0.5}
      />

      {/* ── WHEELS ── */}

      {/* Rear wheel */}
      <circle cx="112" cy="121" r="21" stroke={c} strokeWidth="1.2" fill="none" opacity={o} />
      <circle cx="112" cy="121" r="16" stroke={c} strokeWidth="0.5" fill="none" opacity={o * 0.55} />
      {spokes(112, 121, 5, 16)}
      <circle cx="112" cy="121" r="5" stroke={c} strokeWidth="0.9" fill="none" opacity={o * 0.8} />
      <circle cx="112" cy="121" r="2" stroke={c} strokeWidth="0.6" fill={c} fillOpacity={0.3} opacity={o} />

      {/* Front wheel */}
      <circle cx="383" cy="121" r="21" stroke={c} strokeWidth="1.2" fill="none" opacity={o} />
      <circle cx="383" cy="121" r="16" stroke={c} strokeWidth="0.5" fill="none" opacity={o * 0.55} />
      {spokes(383, 121, 5, 16)}
      <circle cx="383" cy="121" r="5" stroke={c} strokeWidth="0.9" fill="none" opacity={o * 0.8} />
      <circle cx="383" cy="121" r="2" stroke={c} strokeWidth="0.6" fill={c} fillOpacity={0.3} opacity={o} />

      {/* Brake disc hint (inner circle) */}
      <circle cx="112" cy="121" r="10" stroke={c} strokeWidth="0.35" fill="none" opacity={o * 0.3} />
      <circle cx="383" cy="121" r="10" stroke={c} strokeWidth="0.35" fill="none" opacity={o * 0.3} />

    </svg>
  )
}

export function DrivingCar3D() {
  const isDark = useThemeStore(s => s.theme === 'dark')

  const wireColor  = isDark ? '#dcdce8' : '#22222e'
  const skyGrad    = isDark
    ? 'linear-gradient(168deg, #060610 0%, #0e0c1a 35%, #1b0f1e 62%, #14080a 100%)'
    : 'linear-gradient(168deg, #d6e8f8 0%, #b8d0ee 38%, #9ab8e0 65%, #8aacda 100%)'
  const roadColor1 = isDark ? '#1c1c22' : '#c8cdd8'
  const roadColor2 = isDark ? '#0d0d12' : '#aeb5c2'
  const edgeColor  = isDark ? '#b8880e' : '#b8880e'
  const dashOpacity = isDark ? 0.75 : 0.55
  const horizonOpacity = isDark ? 0.45 : 0.25

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: skyGrad }} />

      {/* Stars (dark only) */}
      {isDark && STARS.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.s}px`, height: `${s.s}px`,
            background: 'white', opacity: s.o,
            animationDuration: `${s.d}s`,
          }}
        />
      ))}

      {/* Moon (dark) / Sun hint (light) */}
      <div
        className="absolute rounded-full"
        style={{
          right: '8%', top: '6%',
          width: '28px', height: '28px',
          background: isDark
            ? 'radial-gradient(circle, rgba(240,235,210,0.95) 40%, rgba(200,195,170,0.6) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(255,240,180,0.95) 40%, rgba(255,220,120,0.5) 70%, transparent 100%)',
          boxShadow: isDark
            ? '0 0 18px 6px rgba(220,215,180,0.2)'
            : '0 0 30px 12px rgba(255,220,100,0.35)',
        }}
      />

      {/* Horizon glow */}
      <div
        className="absolute"
        style={{
          top: '57%',
          left: '30%',
          right: 0,
          height: '3px',
          background: isDark
            ? `linear-gradient(to right, transparent 0%, rgba(180,40,30,0.2) 25%, rgba(210,70,40,${horizonOpacity}) 60%, rgba(180,40,30,0.15) 85%, transparent 100%)`
            : `linear-gradient(to right, transparent 0%, rgba(255,180,60,0.15) 25%, rgba(255,200,80,${horizonOpacity}) 60%, rgba(255,180,60,0.12) 85%, transparent 100%)`,
          filter: 'blur(4px)',
        }}
      />

      {/* ── Road SVG ──
          Perspective road going right: trapezoid wider on left (near), narrower on right (far).
          viewBox 0 0 1000 300, top edge: (0,0)→(1000,40).
          Lane geometry:
            left yellow edge  10%: y=30→66
            center dashes     50%: y=150→170
            right shoulder    88%: y=264→269  */}
      <svg
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '43%' }}
      >
        <defs>
          <linearGradient id="roadFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={roadColor1} />
            <stop offset="100%" stopColor={roadColor2} />
          </linearGradient>
        </defs>

        {/* Road surface */}
        <polygon points="0,0 1000,40 1000,300 0,300" fill="url(#roadFill)" />

        {/* Top edge */}
        <line x1="0" y1="0" x2="1000" y2="40"
          stroke={isDark ? 'rgba(180,180,220,0.2)' : 'rgba(80,80,120,0.2)'} strokeWidth="2" />

        {/* Left yellow edge */}
        <line x1="0" y1="30" x2="1000" y2="66" stroke={edgeColor} strokeWidth="2" opacity="0.65" />

        {/* Right shoulder */}
        <line x1="0" y1="264" x2="1000" y2="269"
          stroke={isDark ? 'rgba(200,200,220,0.1)' : 'rgba(80,80,100,0.12)'} strokeWidth="1.5" />

        {/* Center dashes — animate right→left */}
        <line x1="0" y1="150" x2="1000" y2="170"
          stroke={isDark ? `rgba(255,255,255,${dashOpacity})` : `rgba(80,80,100,${dashOpacity})`}
          strokeWidth="3" strokeDasharray="60 60" strokeLinecap="square"
        >
          <animate attributeName="strokeDashoffset" from="120" to="0" dur="0.55s" repeatCount="indefinite" />
        </line>

        {/* Subtle road glow under car */}
        <ellipse cx="480" cy="148" rx="160" ry="16"
          fill={isDark ? 'rgba(200,50,30,0.06)' : 'rgba(100,100,120,0.04)'} />
      </svg>

      {/* Headlight beam cone (front-right of car) */}
      <div
        className="absolute"
        style={{
          left: '66%',
          top: '42%',
          width: '36%',
          height: '18%',
          background: isDark
            ? 'linear-gradient(to right, rgba(255,255,190,0.12) 0%, transparent 100%)'
            : 'linear-gradient(to right, rgba(255,240,150,0.08) 0%, transparent 100%)',
          clipPath: 'polygon(0% 38%, 100% 0%, 100% 100%, 0% 62%)',
        }}
      />

      {/* ── Car ── */}
      <div
        className="absolute"
        style={{
          bottom: '36%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          maxWidth: '380px',
          minWidth: '240px',
        }}
      >
        {/* Speed lines behind car (left side) */}
        <div className="absolute" style={{ right: '97%', top: '28%', width: '100px' }}>
          {[
            { w: 80, t: 3,  o: 0.22 },
            { w: 50, t: 13, o: 0.15 },
            { w: 95, t: 22, o: 0.26 },
            { w: 40, t: 32, o: 0.13 },
            { w: 70, t: 41, o: 0.19 },
          ].map((l, i) => (
            <div key={i} style={{
              position: 'absolute', right: 0, top: `${l.t}px`,
              height: '1.5px', width: `${l.w}px`,
              background: `linear-gradient(to left, ${wireColor.replace(')', `, ${l.o})`).replace('rgb', 'rgba')}, transparent)`,
              borderRadius: '2px',
              opacity: isDark ? 1 : 0.7,
            }} />
          ))}
        </div>

        {/* Wireframe car bouncing */}
        <div className="car-bounce">
          <WireframeCar color={wireColor} />
        </div>
      </div>
    </div>
  )
}
