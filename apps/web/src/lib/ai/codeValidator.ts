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
  try {
    JSON.parse(metaMatch[1]!);
  } catch {
    return { valid: false, error: "META JSON is not valid" };
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
  return {
    duration: meta.duration ?? 10,
    fps: meta.fps ?? 30,
    width: meta.width ?? 1920,
    height: meta.height ?? 1080,
    title: meta.title ?? "Generated Video",
  };
}
