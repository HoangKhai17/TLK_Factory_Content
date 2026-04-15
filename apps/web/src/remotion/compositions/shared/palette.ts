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
  bg: string | undefined,
  palette: ColorPalette
): React.CSSProperties {
  if (!bg) {
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

/** Layout constants — all scenes use these for consistency */
export const LAYOUT = {
  px: 100,        // horizontal padding
  py: 60,         // vertical padding
  gap: 36,        // section gap
  titleSize: 52,
  subtitleSize: 26,
  bodySize: 22,
  lineH: 1.15,
  accentBorder: 3,
} as const;
