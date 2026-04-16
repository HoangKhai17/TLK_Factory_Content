import { useVideoConfig } from "remotion";
import type { VideoSpec } from "@tlk/shared";

export type ColorPalette = VideoSpec["colorPalette"];

/** Parse hex to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Parse scene background field to CSS */
export function parseBackground(
  bg: string | undefined | null | unknown,
  palette: ColorPalette
): React.CSSProperties {
  // Guard: AI may produce non-string values (null, object, number)
  if (!bg || typeof bg !== "string") {
    return {
      background: `linear-gradient(145deg, ${palette.background} 0%, ${palette.primary} 100%)`,
    };
  }
  if (bg.startsWith("gradient:")) {
    const colors = bg.replace("gradient:", "").split(",");
    return {
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] ?? colors[0]})`,
    };
  }
  return { backgroundColor: bg };
}

/** Static layout constants — kept for legacy imports. Prefer useLayout() in new code. */
export const LAYOUT = {
  px: 100,
  py: 60,
  gap: 36,
  titleSize: 52,
  subtitleSize: 26,
  bodySize: 22,
  lineH: 1.15,
  accentBorder: 3,
} as const;

/**
 * Resolution-aware layout hook.
 * Scales all values proportionally to the video dimensions.
 * Baseline: 1920×1080. Uses shortest side / 1080 as the scale factor so
 * portrait (1080×1920) and square (1080×1080) both look correct.
 */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const s = Math.min(width, height) / 1080;
  const isPortrait = height > width;
  return {
    px:           Math.round(92 * s),
    py:           Math.round(58 * s),
    gap:          Math.round(30 * s),
    titleSize:    Math.round(52 * s),
    subtitleSize: Math.round(26 * s),
    bodySize:     Math.round(21 * s),
    smallSize:    Math.round(16 * s),
    iconSize:     Math.round(48 * s),
    cardRadius:   Math.round(20 * s),
    lineH:        1.2,
    accentBorder: Math.max(2, Math.round(3 * s)),
    scale:        s,
    width,
    height,
    isPortrait,
  } as const;
}
