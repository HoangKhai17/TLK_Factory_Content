// === Video Types ===

export type VideoType = "youtube" | "social" | "text-animation" | "marketing";
export type VideoStatus =
  | "pending"
  | "generating"
  | "rendering"
  | "completed"
  | "failed";
export type VideoResolution = "1920x1080" | "1080x1920" | "1080x1080" | "1280x720";

// === Scene Types ===

export type SceneType =
  | "intro"
  | "text-animation"
  | "bullet-list"
  | "stat"
  | "quote"
  | "timeline"
  | "split"
  | "motion-graphics"   // NEW: high-quality animated scene with particles/glow/gradient text
  | "cards"             // NEW: 2–4 feature cards with staggered entrance
  | "diagram"           // NEW: circular node diagram
  | "image"
  | "split-screen"      // legacy alias → split
  | "outro"
  | "transition";

export type AnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideInLeft"
  | "slideInRight"
  | "slideInUp"
  | "slideInDown"
  | "zoomIn"
  | "zoomOut"
  | "typewriter"
  | "wordByWord"        // NEW: word-by-word slide up entrance
  | "charStagger"       // NEW: character by character stagger
  | "springBounce"      // NEW: spring scale bounce in
  | "none";

export type TransitionType =
  | "fade"
  | "wipe-left"
  | "wipe-right"
  | "slide-left"
  | "slide-right"
  | "flip"
  | "clock"
  | "none";

export interface TextElement {
  content: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "black";
  color?: string;
  align?: "left" | "center" | "right";
  animation?: AnimationType;
  animationDelay?: number;
  // NEW: gradient fill
  gradientFrom?: string;
  gradientTo?: string;
  // NEW: letter spacing
  letterSpacing?: string;
}

// === Rich data structures ===

export interface BulletItem {
  icon?: string;
  text: string;
}

export interface StatItem {
  value: string;
  label: string;
  color?: string;
}

export interface TimelineStep {
  number: number;
  title: string;
  description?: string;
}

export interface SplitPanel {
  title?: string;
  body?: string;
  items?: string[];
  icon?: string;
}

// NEW: Card item for "cards" scene type
export interface CardItem {
  icon?: string;
  title: string;
  body?: string;
  color?: string;
}

// NEW: Diagram node for "diagram" scene type
export interface DiagramNodeItem {
  id: string;
  label: string;
  icon?: string;
  position: "top" | "right" | "bottom" | "left";
  color?: string;
}

// NEW: Scene-level particle config
export interface ParticleConfig {
  color?: string;
  count?: number;
  opacity?: number;
  speed?: number;
}

// === Scene ===

export interface Scene {
  id: string;
  type: SceneType;
  duration: number;          // seconds
  background?: string;       // "#hex" or "gradient:#from,#to"
  overlay?: string;

  // Transition INTO this scene (from the previous one)
  transition?: TransitionType;
  transitionDuration?: number; // frames, default 15

  // Atmosphere
  particles?: ParticleConfig;
  glowColor?: string;        // ambient radial glow color
  showGrid?: boolean;        // cyberpunk grid overlay
  showScanlines?: boolean;   // CRT scanlines overlay

  // Text elements
  title?: TextElement;
  subtitle?: TextElement;
  body?: TextElement;

  // Existing scene data
  bullets?: BulletItem[];
  stats?: StatItem[];
  steps?: TimelineStep[];
  splitLeft?: SplitPanel;
  splitRight?: SplitPanel;

  // NEW scene data
  cards?: CardItem[];
  diagramNodes?: DiagramNodeItem[];
  diagramLabel?: string;     // center label in diagram
  imageUrl?: string;
}

// === Video Spec ===

export interface VideoSpec {
  type: VideoType;
  title: string;
  duration: number;
  fps: 24 | 30 | 60;
  resolution: VideoResolution;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  font: {
    heading: string;
    body: string;
  };
  scenes: Scene[];
  audio?: {
    backgroundMusic?: string;
    voiceover?: string;
  };
}

// === Video Record ===

export interface VideoRecord {
  id: string;
  projectId: string;
  title: string;
  prompt: string;
  spec: string | null;
  generationMode: "template" | "ai-code";
  generatedCode: string | null;
  status: VideoStatus;
  outputPath: string | null;
  thumbnailPath: string | null;
  errorMessage: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}
