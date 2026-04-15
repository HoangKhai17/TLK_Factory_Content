import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, SplitPanel } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface PanelProps {
  panel: SplitPanel;
  side: "left" | "right";
  accentColor: string;
  palette: ColorPalette;
}

function Panel({ panel, side, accentColor, palette }: PanelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = side === "right" ? Math.round(fps * 0.2) : 0;
  const eff = Math.max(0, frame - delay);

  const x = interpolate(eff, [0, fps * 0.4], [side === "left" ? -70 : 70, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = interpolate(eff, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const iconScale = spring({ frame: Math.max(0, eff - Math.round(fps * 0.1)), fps, config: { mass: 0.4, damping: 9 }, from: 0.1, to: 1 });

  return (
    <div style={{
      opacity, transform: `translateX(${x}px)`,
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "36px 40px",
      backgroundColor: hexToRgba(accentColor, 0.06),
      borderRadius: 20,
      border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
      gap: 16, position: "relative", overflow: "hidden",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
      }} />

      {panel.icon && (
        <div style={{ transform: `scale(${iconScale})`, fontSize: 68, lineHeight: 1 }}>
          {panel.icon}
        </div>
      )}
      {panel.title && (
        <div style={{ fontSize: 30, fontWeight: "bold", color: palette.text, textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {panel.title}
        </div>
      )}
      {panel.body && (
        <div style={{ fontSize: 20, color: hexToRgba(palette.text, 0.65), textAlign: "center", lineHeight: 1.55 }}>
          {panel.body}
        </div>
      )}
      {panel.items && panel.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "stretch" }}>
          {panel.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, color: hexToRgba(palette.text, 0.8) }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: accentColor, flexShrink: 0, boxShadow: `0 0 6px ${accentColor}` }} />
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SplitSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function SplitScene({ scene, accentColor, palette }: SplitSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Vertical divider grows
  const dividerH = interpolate(frame, [fps * 0.1, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const left = scene.splitLeft ?? { title: "", body: "" };
  const right = scene.splitRight ?? { title: "", body: "" };

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${LAYOUT.py}px ${LAYOUT.px - 20}px`, gap: LAYOUT.gap }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          fontSize: scene.title.fontSize ?? LAYOUT.titleSize, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.02em",
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      <div style={{ display: "flex", gap: 0, flex: 1, alignItems: "stretch", position: "relative", zIndex: 1 }}>
        <Panel panel={left} side="left" accentColor={accentColor} palette={palette} />

        {/* Vertical divider with SVG glow dot */}
        <div style={{ width: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={24} height={400} style={{ overflow: "visible" }}>
            <line x1={12} y1={0} x2={12} y2={400 * dividerH} stroke={hexToRgba(accentColor, 0.4)} strokeWidth={2} />
            {dividerH > 0.45 && (
              <circle cx={12} cy={200} r={6} fill={accentColor} style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }} />
            )}
          </svg>
          <div style={{ fontSize: 22, color: hexToRgba(accentColor, 0.6), fontWeight: "bold", marginTop: -200 }}>VS</div>
        </div>

        <Panel panel={right} side="right" accentColor={accentColor} palette={palette} />
      </div>
    </AbsoluteFill>
  );
}
