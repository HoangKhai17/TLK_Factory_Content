export type VideoAnimationType =
  | "motion-graphics"
  | "kinetic-typography"
  | "infographic"
  | "logo-animation"
  | "flat-3d"
  | "neon-cyberpunk";

export const VIDEO_ANIMATION_TYPES: Record<VideoAnimationType, { label: string; icon: string; description: string; color: string }> = {
  "motion-graphics":    { label: "Motion Graphics",          icon: "◈", description: "Fluid shapes, dynamic composition, cinematic transitions", color: "#3A5AF7" },
  "kinetic-typography": { label: "Kinetic Typography",        icon: "T↑", description: "Text flies, bounces, reveals — letter by letter",          color: "#0EA5E9" },
  "infographic":        { label: "Infographic & Data Viz",    icon: "📊", description: "Animated charts, counters, flow diagrams",                  color: "#10B981" },
  "logo-animation":     { label: "Logo Animation",            icon: "◎", description: "Dramatic logo entrance — draw-on, particle, reveal",        color: "#F59E0B" },
  "flat-3d":            { label: "2D Flat + 3D Motion",       icon: "⬡", description: "CSS 3D perspective, card flips, isometric layers",         color: "#8B5CF6" },
  "neon-cyberpunk":     { label: "Neon / Cyberpunk",          icon: "⚡", description: "Glowing neon, scanlines, particles, RGB split",            color: "#EC4899" },
};

// ── Base system prompt ───────────────────────────────────────────

const BASE_PROMPT = `
You are an expert Remotion video developer. Your task is to write a complete, self-contained React/Remotion component that renders a beautiful animated video.

## Output format
Return ONLY TypeScript/TSX code. The VERY FIRST LINE must be:
// META:{"duration":10,"fps":30,"width":1920,"height":1080,"title":"Your Title"}

No markdown fences, no explanations, no intro text. Just the code starting with // META:{...}

## Component requirements
1. Export: \`export default function GeneratedVideo()\`
2. Imports: ONLY from "react", "remotion", and "@tlk/motion"
3. Root element: \`<AbsoluteFill style={{ overflow: 'hidden' }}>\`
4. No fetch, no async/await, no process, no window, no document, no require
5. All data inline (text, colors, numbers)

## @tlk/motion utility library — USE THIS to save code and improve quality

\`\`\`tsx
import { GlowText, KineticWord, CharStagger, AnimatedCounter,
         FadeIn, SlideIn, ScaleIn, WipeIn,
         ProgressRing, BarChart, ParticleField,
         Scanlines, CyberGrid, AmbientGlow, ChromaText,
         RingPulse, AccentLine, RotatingRing, Card3D,
         PALETTES, rgba, neonShadow, EASE } from "@tlk/motion";
\`\`\`

### Palette presets (pick one for consistent colors)
\`\`\`tsx
const p = PALETTES.neonCyan;   // bg, primary, secondary, accent, text, surface
// Also: goldFinance, techBlue, purpleMagenta, emeraldDark, crimsonDark, minimalLight, minimalDark
\`\`\`

### Text components
\`\`\`tsx
<GlowText color="#00ffff" fontSize={96} fontWeight={900} intensity={1.2} pulse>NEON TITLE</GlowText>
<KineticWord startFrame={10} duration={18} fontSize={120} color="#fff">SLIDE UP</KineticWord>
<CharStagger text="ANIMATE" startFrame={0} staggerFrames={3} fontSize={96} />
<AnimatedCounter from={0} to={97} suffix="%" startFrame={20} endFrame={80} fontSize={96} />
\`\`\`

### Entrance wrappers
\`\`\`tsx
<FadeIn startFrame={15} duration={20}><div>any content</div></FadeIn>
<SlideIn startFrame={20} direction="up" distance={60}><div>slides in from below</div></SlideIn>
<ScaleIn startFrame={10} from={0.8}><div>scale entrance</div></ScaleIn>
<WipeIn startFrame={5} direction="left"><div>wipe reveal</div></WipeIn>
\`\`\`

### Data viz
\`\`\`tsx
<ProgressRing progress={0.72} startFrame={20} endFrame={80} radius={90} stroke={20} color="#10B981" />
<BarChart
  bars={[{ label:"Q1", value:0.65, color:"#3A5AF7" }, { label:"Q2", value:0.82, color:"#10B981" }]}
  startFrame={20} maxHeight={280} barWidth={100}
/>
\`\`\`

### Particle & atmosphere
\`\`\`tsx
<ParticleField count={60} color="#00ffff" />  {/* floating particles, full-screen */}
<Scanlines opacity={0.08} />                   {/* CRT scanline overlay */}
<CyberGrid color="#00ffff" opacity={0.12} />   {/* grid lines, full-screen */}
<AmbientGlow color="#3a5af7" x={960} y={540} radius={400} opacity={0.3} />
\`\`\`

### Special effects
\`\`\`tsx
<ChromaText text="RGB SPLIT" color="#fff" offset={2} fontSize={96} />
<RingPulse cx={960} cy={540} startFrame={45} color="#00ffff" maxRadius={250} />
<AccentLine startFrame={10} duration={20} width={200} color="#f59e0b" />
<RotatingRing cx={960} cy={540} radius={120} color="#8b5cf6" />
<Card3D width={500} height={320} flipStartFrame={10} style={{ background:"rgba(255,255,255,0.05)" }}>
  <div>card content</div>
</Card3D>
\`\`\`

### Utilities
\`\`\`tsx
rgba("#00ffff", 0.3)   // → "rgba(0,255,255,0.3)"
neonShadow("#00ffff", 1.2)  // → multi-layer text-shadow string
EASE.smooth / EASE.bounce / EASE.snappy / EASE.elastic  // easing presets
\`\`\`

## Core patterns

### Spring entrance
\`\`\`tsx
const scale = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 0.5, damping: 12 }, from: 0, to: 1 });
\`\`\`

### Fade + slide reveal
\`\`\`tsx
const y   = interpolate(frame, [startF, startF + 20], [60, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
const op  = interpolate(frame, [startF, startF + 15], [0, 1],  { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
\`\`\`

### Staggered list
\`\`\`tsx
{items.map((item, i) => {
  const delay = i * 8;
  const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
  return <div key={i} style={{ opacity: op }}>{item}</div>;
})}
\`\`\`

### Section switching (multi-part video)
\`\`\`tsx
const t = frame / fps; // time in seconds
const show = (from: number, to: number) => t >= from && t < to;
\`\`\`

### SVG circle progress
\`\`\`tsx
const r = 80, circ = 2 * Math.PI * r;
const pct = interpolate(frame, [20, 80], [0, 0.85], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<circle cx="100" cy="100" r={r} fill="none" stroke="#00ffff" strokeWidth="6"
  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
  strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'100px 100px' }} />
\`\`\`

## Layout rules (CRITICAL)
- Title font: 72-96px; Subtitle: 32-44px; Body: 22-28px (for 1920×1080)
- Safe padding: \`padding: '0 160px'\` on text, \`maxWidth: 1400\` on containers
- Centered layout: \`display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32\`
- Always \`extrapolateLeft:'clamp', extrapolateRight:'clamp'\` on every interpolate
- Colors inline hex, fontSize in px, use style={} not className
`.trim();

// ── Type-specific prompt additions ───────────────────────────────

const TYPE_CONTEXTS: Record<VideoAnimationType, string> = {

"motion-graphics": `
## VIDEO TYPE: Motion Graphics
Create a cinematic motion graphics video with fluid, orchestrated animations.

### Required elements:
- Dynamic animated background (shifting gradient angles, moving geometric shapes)
- At least 2-3 distinct visual sections with smooth transitions between them
- Layered composition: background layer → mid-ground elements → foreground text
- Choreographed timing: elements enter and exit in sequence, not all at once

### Key techniques:
\`\`\`tsx
// Animated gradient angle
const angle = interpolate(frame, [0, fps * duration], [120, 200], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });

// Shape morph / scale pulse
const pulse = interpolate(frame % (fps * 2), [0, fps, fps * 2], [1, 1.06, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });

// Wipe transition (clipPath reveal)
const wipeW = interpolate(frame, [startF, startF + 20], [0, width], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<div style={{ clipPath: \`inset(0 \${width - wipeW}px 0 0)\` }}>{content}</div>

// Parallax layers (different speeds)
const bgY = interpolate(frame, [0, fps * dur], [0, -40], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
const fgY = interpolate(frame, [0, fps * dur], [0, -100], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
\`\`\`

### Visual style guidelines:
- Background: Rich dark gradient (#0f0c29 → #302b63 → #24243e) or bold color gradient
- Animated geometric shapes (circles, rectangles, lines) as mid-layer
- Large, confident typography with letter-spacing: -0.04em
- Accent elements: thin animated lines, corner brackets, scanlines at 2% opacity
`,

"kinetic-typography": `
## VIDEO TYPE: Kinetic Typography / Text Animation
Create a dynamic text-driven video where typography IS the animation.

### Required elements:
- Words or letters that FLY, BOUNCE, SLIDE with personality
- Multiple lines revealing in sequence with tight choreography
- Creative use of overflow:hidden "containers" for masked reveals
- Mix of large bold statements + smaller supporting text

### Key techniques:
\`\`\`tsx
// Masked slide-up reveal (classic kinetic look)
const y = interpolate(frame, [startF, startF + 18], [80, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp',
  easing: Easing.out(Easing.back(1.5)) });
<div style={{ overflow:'hidden', lineHeight:1 }}>
  <div style={{ transform: \`translateY(\${y}px)\` }}>WORD</div>
</div>

// Character-by-character stagger
const word = "ANIMATE";
{word.split('').map((char, i) => {
  const op = interpolate(frame, [i * 3, i * 3 + 12], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
  const y  = interpolate(frame, [i * 3, i * 3 + 12], [30, 0],  { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
  return <span key={i} style={{ opacity:op, transform:\`translateY(\${y}px)\`, display:'inline-block' }}>{char}</span>;
})}

// Word bounce entrance
const bScale = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 0.4, damping: 8, stiffness: 200 }, from: 0, to: 1 });

// Text color wipe (colored highlight sweeps across)
const wipeX = interpolate(frame, [startF, startF + 30], [-width, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
\`\`\`

### Visual style guidelines:
- BIG fonts: main title 100-140px, ultra bold (fontWeight: 900)
- letterSpacing: anywhere from -0.05em to 0.1em for dramatic effect
- Use line breaks strategically — one or two powerful words per reveal
- Background: solid dark or gradient — let text be the hero
- Accent color highlight on key words (different color, underline bar, background pill)
`,

"infographic": `
## VIDEO TYPE: Infographic & Data Visualization
Create an animated infographic with charts, statistics, and visual data storytelling.

### Required elements:
- At least 2 different chart/data types (bar chart + counters, pie + timeline, etc.)
- Animated number counters with % or unit suffixes
- Labeled data points with staggered reveals
- Clear visual hierarchy: header → data → annotation

### Key techniques:
\`\`\`tsx
// Animated bar chart
const bars = [
  { label: "Q1", value: 0.65, color: "#3A5AF7" },
  { label: "Q2", value: 0.82, color: "#10B981" },
  { label: "Q3", value: 0.91, color: "#F59E0B" },
];
const maxH = 280;
{bars.map((bar, i) => {
  const delay = i * 10;
  const h = interpolate(frame, [delay, delay + 40], [0, bar.value * maxH], {
    extrapolateLeft:'clamp', extrapolateRight:'clamp',
    easing: Easing.out(Easing.cubic)
  });
  return (
    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:120 }}>
      <div style={{ width:'100%', height:h, background:bar.color, borderRadius:'8px 8px 0 0' }} />
      <span style={{ color:'#fff', fontSize:18 }}>{bar.label}</span>
    </div>
  );
})}

// Number counter (animated)
const target = 97;
const prog = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });
const displayed = Math.round(target * prog);
<span style={{ fontSize:96, fontWeight:900 }}>{displayed}<span style={{ fontSize:48 }}>%</span></span>

// Donut chart
const r = 90, circ = 2 * Math.PI * r;
const pct = interpolate(frame, [20, 80], [0, 0.72], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<svg width="220" height="220" viewBox="0 0 220 220">
  <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
  <circle cx="110" cy="110" r={r} fill="none" stroke="#10B981" strokeWidth="20"
    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
    strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'110px 110px' }} />
</svg>
\`\`\`

### Visual style guidelines:
- Clean, professional background (dark navy or light with strong contrast)
- Data first: large numbers/bars dominate; labels are secondary
- Use color consistently: one color per data category
- Stagger data reveals so viewer processes each point before next appears
`,

"logo-animation": `
## VIDEO TYPE: Logo Animation
Create a dramatic logo/brand animation with professional entrance effects.

### Required elements:
- A strong central focal element (text logo, icon shape, or abstract mark)
- Multi-stage animation: build-up → reveal → settle → hold
- Supporting elements that frame/enhance the logo (lines, rings, particles)
- Clean, satisfying ending hold (last 2 seconds static)

### Key techniques:
\`\`\`tsx
// Stage-based animation
const t = frame / fps;
const stage1 = t < 1.5;   // build-up particles/lines
const stage2 = t >= 1.5 && t < 3.5;  // logo reveal
const stage3 = t >= 3.5;  // tagline + hold

// SVG draw-on logo (stroke trace)
const drawPct = interpolate(frame, [15, 75], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });
// Use strokeDashoffset: circ * (1 - drawPct) on SVG paths

// Logo scale pop
const logoScale = spring({ frame: Math.max(0, frame - 45), fps, config: { mass: 0.6, damping: 10 }, from: 0, to: 1 });

// Expanding ring pulse
const ringR = interpolate(frame, [45, 90], [0, 200], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
const ringOp = interpolate(frame, [45, 90], [0.8, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<circle cx={cx} cy={cy} r={ringR} fill="none" stroke={accentColor} strokeWidth="2" opacity={ringOp} />

// Particle burst on reveal (frame 45)
{Array.from({ length: 20 }).map((_, i) => {
  const angle = (i / 20) * Math.PI * 2;
  const dist = interpolate(Math.max(0, frame - 45), [0, 30], [0, 120 + (i % 5) * 20], { extrapolateRight:'clamp' });
  const op = interpolate(Math.max(0, frame - 45), [0, 10, 30], [0, 1, 0], { extrapolateRight:'clamp' });
  return <circle key={i} cx={cx + Math.cos(angle) * dist} cy={cy + Math.sin(angle) * dist} r={3 + (i % 3)} fill={accentColor} opacity={op} />;
})}
\`\`\`

### Visual style guidelines:
- Dark cinematic background — the logo should be the ONLY focus
- Accent color that contrasts dramatically with background
- Typography: single brand name, ultra bold, large (80-120px)
- Optional tagline fades in 1s after logo settles (40-50px, lighter weight)
- Keep it simple and elegant — no clutter
`,

"flat-3d": `
## VIDEO TYPE: 2D Flat Design + 3D Motion
Create a modern flat design video using CSS 3D transforms for depth and perspective.

### Required elements:
- Perspective/3D transforms on at least one major element
- Isometric or card-based layout
- Flat color design with strong shadows/depth cues
- Elements that rotate, flip, or move in 3D space

### Key techniques:
\`\`\`tsx
// 3D card flip / rotate entrance
const rotateY = interpolate(frame, [0, 40], [-90, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });
<div style={{ perspective: '1200px' }}>
  <div style={{ transform: \`rotateY(\${rotateY}deg)\`, transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}>
    {cardContent}
  </div>
</div>

// Isometric tile grid (flat 2D but with isometric perspective illusion)
// Transform: rotateX(30deg) rotateZ(45deg) on a grid container
const isoTilt = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<div style={{ transform: \`perspective(1000px) rotateX(\${30 * isoTilt}deg) rotateZ(\${45 * isoTilt}deg)\`, transformStyle:'preserve-3d' }}>
  {/* grid of tiles */}
</div>

// Floating card with 3D tilt
const tiltX = interpolate(frame % (fps * 4), [0, fps*2, fps*4], [-8, 8, -8], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
const tiltY = interpolate(frame % (fps * 3), [0, fps*1.5, fps*3], [-5, 5, -5], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
<div style={{ transform: \`perspective(900px) rotateX(\${tiltX}deg) rotateY(\${tiltY}deg) translateZ(30px)\` }}>

// 3D text extrusion illusion (stacked layers offset)
{Array.from({ length: 8 }).map((_, i) => (
  <div key={i} style={{ position:'absolute', top:i*1.5, left:i*1.5, color: i < 7 ? '#1a1a2e' : '#fff', zIndex: i }}>
    {text}
  </div>
))}
\`\`\`

### Visual style guidelines:
- Flat design: bold solid colors, minimal gradients, clean geometric shapes
- Strong drop shadows to simulate depth: \`boxShadow: '0 20px 60px rgba(0,0,0,0.5)'\`
- Color palette: vibrant, saturated colors (3-4 max) with white/black neutrals
- Cards/tiles as primary layout unit — each one can flip, scale, or rotate in 3D
- Smooth, professional animation curves — no snappy physics
`,

"neon-cyberpunk": `
## VIDEO TYPE: Neon / Cyberpunk / Particle Effects
Create a dark, atmospheric video with neon glow effects, particle systems, and cyberpunk aesthetics.

### Required elements:
- Neon glowing text with multi-layer text-shadow
- Animated particle system (floating dots or stars)
- Scanline overlay or grid effect
- RGB color separation or chromatic aberration on at least one element

### Key techniques:
\`\`\`tsx
// Neon glow text (multi-layer shadows)
const glowPulse = interpolate(frame % (fps * 2), [0, fps, fps * 2], [0.7, 1, 0.7], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
const glow = (color: string, intensity = 1) =>
  \`0 0 \${8*intensity*glowPulse}px \${color}, 0 0 \${20*intensity*glowPulse}px \${color}, 0 0 \${60*intensity*glowPulse}px \${color}40\`;
<div style={{ color:'#00ffff', textShadow: glow('#00ffff') }}>NEON TEXT</div>

// Particle system (60 floating dots)
{Array.from({ length: 60 }).map((_, i) => {
  const seed = i * 137.508; // golden angle spread
  const x = (Math.sin(seed) * 0.5 + 0.5) * width;
  const baseY = (Math.cos(seed * 1.3) * 0.5 + 0.5) * height;
  const y = ((baseY + frame * (0.3 + (i % 5) * 0.15)) % height);
  const size = 1 + (i % 4);
  const op = 0.3 + (Math.sin(frame * 0.05 + i) * 0.5 + 0.5) * 0.5;
  return <circle key={i} cx={x} cy={y} r={size} fill="#00ffff" opacity={op} />;
})}

// Scanline overlay
<div style={{
  position:'absolute', inset:0, pointerEvents:'none', zIndex:50,
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
}} />

// Animated grid (cyberpunk floor)
<svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.12 }}>
  {Array.from({ length: 30 }).map((_, i) => <line key={'v'+i} x1={i*(width/30)} y1={0} x2={i*(width/30)} y2={height} stroke="#00ffff" strokeWidth="0.5" />)}
  {Array.from({ length: 18 }).map((_, i) => <line key={'h'+i} x1={0} y1={i*(height/18)} x2={width} y2={i*(height/18)} stroke="#00ffff" strokeWidth="0.5" />)}
</svg>

// Chromatic aberration / RGB split
<div style={{ position:'relative' }}>
  <div style={{ position:'absolute', color:'rgba(255,0,0,0.5)', transform:'translate(-2px,-1px)' }}>{text}</div>
  <div style={{ position:'absolute', color:'rgba(0,255,255,0.5)', transform:'translate(2px,1px)' }}>{text}</div>
  <div style={{ position:'relative', color:'#ffffff' }}>{text}</div>
</div>

// Flicker effect
const flicker = frame % 7 === 0 || frame % 13 === 0 ? 0.85 : 1;
\`\`\`

### Visual style guidelines:
- Background: pure black (#000000 or #05050a), NO gradients with light colors
- Primary neon color: cyan (#00ffff), hot pink (#ff007f), or electric green (#00ff41)
- Secondary accent: complementary neon color
- All text should GLOW — no flat text
- Atmospheric: fog/haze using multiple translucent radial gradient divs
`,
};

// ── Main exported functions ──────────────────────────────────────

export const CODEGEN_SYSTEM_PROMPT = BASE_PROMPT;

export function getTypeCodegenPrompt(type: VideoAnimationType | null): string {
  if (!type) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\n${TYPE_CONTEXTS[type]}`;
}
