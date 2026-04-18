import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, CardItem } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

function Card({ card, index, palette, layout }: { card: CardItem; index: number; palette: ColorPalette; layout: ReturnType<typeof useLayout> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = Math.round(0.3 * fps) + index * Math.round(0.2 * fps);
  const sc = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 0.45, damping: 11 }, from: 0.85, to: 1 });
  const op = interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y  = interpolate(Math.max(0, frame - delay), [0, 16], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = card.color ?? palette.accent;

  return (
    <div style={{ opacity: op, transform: `translateY(${y}px) scale(${sc})`, flex: 1, minWidth: 0, background: hexToRgba(color, 0.08), border: `1px solid ${hexToRgba(color, 0.28)}`, borderRadius: Math.round(20 * layout.scale), padding: `${Math.round(28 * layout.scale)}px ${Math.round(20 * layout.scale)}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(12 * layout.scale), position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "55%", height: Math.max(2, Math.round(3 * layout.scale)), backgroundColor: color, borderRadius: "0 0 4px 4px" }} />
      {card.icon && <div style={{ fontSize: Math.round(44 * layout.scale), lineHeight: 1 }}>{card.icon}</div>}
      <div style={{ fontSize: Math.round(layout.bodySize * 1.05), fontWeight: 700, color: palette.text, textAlign: "center", lineHeight: 1.3 }}>{card.title}</div>
      {card.body && <div style={{ fontSize: layout.smallSize ?? Math.round(layout.bodySize * 0.9), color: hexToRgba(palette.text, 0.65), textAlign: "center", lineHeight: 1.5 }}>{card.body}</div>}
    </div>
  );
}

export function CardsScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const cards = scene.cards ?? [];

  const headerOp = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headerY  = interpolate(frame, [0, 16], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subDelay = Math.round(fps * 0.8);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${layout.py}px ${layout.px}px`, gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: 700, color: scene.title.color ?? palette.text, textAlign: "center", lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: layout.isPortrait ? "column" : "row", gap: Math.round(18 * layout.scale), flex: 1, alignItems: "stretch" }}>
        {cards.map((card, i) => <Card key={i} card={card} index={i} palette={palette} layout={layout} />)}
      </div>
      {scene.subtitle && (
        <div style={{ opacity: subOp, fontSize: layout.subtitleSize, color: hexToRgba(palette.text, 0.5), textAlign: "center" }}>
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
