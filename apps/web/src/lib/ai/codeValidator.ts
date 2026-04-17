export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedCode?: string;
}

const FORBIDDEN_PATTERNS = [
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\brequire\s*\(/,
  /\bprocess\s*\./,
  /\bfs\s*\./,
  /\bfetch\s*\(/,
  /\baxios\s*\./,
  /\bhttp\.get/,
  /\bexec\s*\(/,
  /\bspawn\s*\(/,
  /\bchild_process/,
  /\bwindow\s*\./,
  /\bdocument\s*\./,
  /\blocalStorage/,
  /\bsessionStorage/,
  /\bIndexedDB/,
  /\bXMLHttpRequest/,
  /\bWebSocket\s*\(/,
  /\b__dirname\b/,
  /\b__filename\b/,
  /\bglobal\s*\./,
];

export function validateGeneratedCode(code: string): ValidationResult {
  // Must start with META comment
  if (!code.trimStart().startsWith("// META:")) {
    return { valid: false, error: "Code must start with // META:{...} JSON comment" };
  }

  // Parse metadata
  const metaMatch = code.match(/^\/\/ META:(\{.*?\})/m);
  if (!metaMatch) {
    return { valid: false, error: "Invalid META comment format" };
  }
  let parsedMeta: Partial<{ duration: number; fps: number; width: number; height: number; title: string }>;
  try {
    parsedMeta = JSON.parse(metaMatch[1]!) as typeof parsedMeta;
  } catch {
    return { valid: false, error: "META JSON is not valid" };
  }

  // Warn about suspicious duration (but don't reject — parseCodeMeta will clamp it)
  const fps = parsedMeta.fps ?? 30;
  const rawDur = parsedMeta.duration ?? 10;
  if (rawDur > 1000) {
    // Very likely frames, not seconds — this will produce an absurdly long video
    return { valid: false, error: `META duration=${rawDur} looks like frames (${(rawDur/fps).toFixed(0)}s at ${fps}fps). Set duration in SECONDS (e.g. 10).` };
  }

  // Check all from "..." statements — handles single-line AND multi-line imports
  const fromMatches = code.matchAll(/\bfrom\s+["']([^"']+)["']/g);
  for (const match of fromMatches) {
    const pkg = match[1] ?? "";
    if (pkg !== "react" && pkg !== "remotion" && pkg !== "@tlk/motion") {
      return { valid: false, error: `Import from "${pkg}" is not allowed. Only "react", "remotion", and "@tlk/motion" are permitted.` };
    }
  }

  // Check forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { valid: false, error: `Forbidden pattern detected: ${pattern.toString()}` };
    }
  }

  // Must export a default function named GeneratedVideo
  if (!/export\s+default\s+function\s+GeneratedVideo/.test(code)) {
    return { valid: false, error: "Code must export default function GeneratedVideo" };
  }

  return { valid: true, sanitizedCode: code };
}

// Duration sanity bounds (seconds)
const MIN_DURATION_S = 3;
const MAX_DURATION_S = 60;

export function parseCodeMeta(code: string): {
  duration: number;
  fps: number;
  width: number;
  height: number;
  title: string;
} {
  const metaMatch = code.match(/^\/\/ META:(\{.*?\})/m);
  if (!metaMatch) throw new Error("No META comment found");
  const meta = JSON.parse(metaMatch[1]!) as Partial<{
    duration: number; fps: number; width: number; height: number; title: string;
  }>;

  const fps = meta.fps ?? 30;
  let rawDuration = meta.duration ?? 10;

  // AI sometimes confuses duration (seconds) with durationInFrames.
  // Heuristic: if rawDuration >= 100 AND rawDuration % fps === 0, it's probably frames.
  if (rawDuration >= 100 && fps > 0 && rawDuration % fps === 0) {
    const asSecs = rawDuration / fps;
    console.warn(`[META] duration=${rawDuration} looks like frames — converting to ${asSecs}s`);
    rawDuration = asSecs;
  }

  // Hard cap: never render more than MAX_DURATION_S seconds
  let duration = Math.min(MAX_DURATION_S, Math.max(MIN_DURATION_S, rawDuration));

  // If META duration is suspiciously large (> 30s), try auto-detect from interpolate ranges
  if (rawDuration > 30) {
    const detected = detectDurationFromCode(code, fps);
    if (detected !== null && detected < rawDuration) {
      console.warn(`[META] duration=${rawDuration}s seems too long; auto-detected ${detected}s from code`);
      duration = Math.min(MAX_DURATION_S, Math.max(MIN_DURATION_S, detected));
    }
  }

  return {
    duration,
    fps,
    width: meta.width ?? 1920,
    height: meta.height ?? 1080,
    title: meta.title ?? "Generated Video",
  };
}

/**
 * Scan interpolate() and spring() frame references to estimate actual content duration.
 * Returns duration in seconds, or null if can't determine.
 */
function detectDurationFromCode(code: string, fps: number): number | null {
  let maxFrame = 0;

  // interpolate(frame, [start, end], ...) — capture the end value
  for (const match of code.matchAll(/interpolate\s*\([^,]+,\s*\[([^\]]+)\]/g)) {
    const nums = (match[1] ?? "").split(",").map((s) => parseFloat(s.trim())).filter((n) => isFinite(n) && n >= 0);
    for (const n of nums) {
      if (n > maxFrame && n < 100_000) maxFrame = n;
    }
  }

  // spring({ frame: Math.max(0, frame - delay), ... }) — capture delay values
  for (const match of code.matchAll(/Math\.max\s*\(\s*0\s*,\s*frame\s*-\s*(\d+)\s*\)/g)) {
    const delay = parseInt(match[1] ?? "0", 10);
    if (delay > maxFrame && delay < 100_000) maxFrame = delay;
  }

  if (maxFrame === 0) return null;

  // Add 20% buffer for hold/outro after animations complete
  return Math.ceil((maxFrame / fps) * 1.2);
}
