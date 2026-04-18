import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function SplitScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;

  const titleOp = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY  = interpolate(frame, [0, 16], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const leftDelay  = Math.round(0.25 * fps);
  const rightDelay = Math.round(0.45 * fps);
  const panelOp = interpolate(Math.max(0, frame - leftDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const leftX   = interpolate(Math.max(0, frame - leftDelay),  [0, 20], [-60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rightX  = interpolate(Math.max(0, frame - rightDelay), [0, 20], [60, 0],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  type Panel = typeof scene.splitLeft;
  function renderPanel(panel: Panel, xOffset: number) {
    if (!panel) return null;
    return (
      <div style={{ opacity: panelOp, transform: `translateX(${xOffset}px)`, flex: 1, background: hexToRgba(accent, 0.07), border: `1px solid ${hexToRgba(accent, 0.22)}`, borderRadius: Math.round(16 * layout.scale), padding: `${Math.round(28 * layout.scale)}px ${Math.round(24 * layout.scale)}px`, display: "flex", flexDirection: "column", gap: Math.round(12 * layout.scale) }}>
        {panel.icon && <div style={{ fontSize: Math.round(44 * layout.scale) }}>{panel.icon}</div>}
        <div style={{ fontSize: Math.round(layout.bodySize * 1.1), fontWeight: 700, color: palette.text }}>{panel.title}</div>
        {panel.body && <div style={{ fontSize: layout.bodySize, color: hexToRgba(palette.text, 0.7), lineHeight: 1.5 }}>{panel.body}</div>}
        {panel.items?.map((item, i) => (
          <div key={i} style={{ fontSize: layout.smallSize ?? Math.round(layout.bodySize * 0.9), color: hexToRgba(palette.text, 0.65), display: "flex", alignItems: "center", gap: Math.round(8 * layout.scale) }}>
            <span style={{ color: accent, fontWeight: 700 }}>▸</span> {item}
          </div>
        ))}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${layout.py}px ${layout.px}px`, gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: 700, color: scene.title.color ?? palette.text, textAlign: "center", lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ display: "flex", gap: Math.round(20 * layout.scale), flex: 1 }}>
        {renderPanel(scene.splitLeft, leftX)}
        {renderPanel(scene.splitRight, rightX)}
      </div>
    </AbsoluteFill>
  );
}
