import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, SplitPanel } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

function Panel({
  panel, side, accentColor, palette,
}: {
  panel: SplitPanel; side: "left" | "right"; accentColor: string; palette: ColorPalette;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const delay = side === "right" ? Math.round(fps * 0.2) : 0;
  const eff = Math.max(0, frame - delay);

  const x = interpolate(eff, [0, fps * 0.4], [side === "left" ? -60 : 60, 0], {
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
      padding: `${Math.round(32 * layout.scale)}px ${Math.round(36 * layout.scale)}px`,
      backgroundColor: hexToRgba(accentColor, 0.06),
      borderRadius: layout.cardRadius,
      border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
      gap: Math.round(14 * layout.scale), position: "relative", overflow: "hidden",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
      }} />

      {panel.icon && (
        <div style={{ transform: `scale(${iconScale})`, fontSize: Math.round(58 * layout.scale), lineHeight: 1 }}>
          {panel.icon}
        </div>
      )}
      {panel.title && (
        <div style={{
          fontSize: Math.round(28 * layout.scale), fontWeight: "bold",
          color: palette.text, textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.01em",
        }}>
          {panel.title}
        </div>
      )}
      {panel.body && (
        <div style={{
          fontSize: Math.round(18 * layout.scale), color: hexToRgba(palette.text, 0.65),
          textAlign: "center", lineHeight: 1.55,
        }}>
          {panel.body}
        </div>
      )}
      {panel.items && panel.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(7 * layout.scale), alignSelf: "stretch" }}>
          {panel.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: Math.round(9 * layout.scale),
              fontSize: Math.round(17 * layout.scale), color: hexToRgba(palette.text, 0.8),
            }}>
              <div style={{
                width: Math.round(6 * layout.scale), height: Math.round(6 * layout.scale), borderRadius: "50%",
                backgroundColor: accentColor, flexShrink: 0,
                boxShadow: `0 0 6px ${accentColor}`,
              }} />
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
  const layout = useLayout();

  const titleOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const dividerH = interpolate(frame, [fps * 0.1, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const left  = scene.splitLeft  ?? { title: "", body: "" };
  const right = scene.splitRight ?? { title: "", body: "" };

  // Divider height as % of available area — use actual layout height
  const panelH = layout.height - layout.py * 2 - layout.gap - (scene.title ? layout.titleSize * layout.lineH + layout.gap : 0);
  const divH   = Math.max(80, Math.min(panelH * 0.85, 400)) * layout.scale;
  const divW   = Math.round(44 * layout.scale);

  return (
    <AbsoluteFill style={{
      ...parseBackground(scene.background, palette),
      flexDirection: "column",
      padding: `${layout.py}px ${Math.round((layout.px - 16) * 1)}px`,
      gap: layout.gap,
      overflow: "hidden",
    }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.02em",
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      <div style={{ display: "flex", gap: 0, flex: 1, alignItems: "stretch", position: "relative", zIndex: 1 }}>
        <Panel panel={left}  side="left"  accentColor={accentColor} palette={palette} />

        {/* Vertical divider */}
        <div style={{ width: divW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
          <svg width={divW} height={divH} style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={accentColor} stopOpacity="0" />
                <stop offset="50%"  stopColor={accentColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1={divW/2} y1={0} x2={divW/2} y2={divH * dividerH} stroke="url(#divGrad)" strokeWidth={2} />
            {dividerH > 0.45 && (
              <circle cx={divW/2} cy={divH * 0.5} r={Math.round(6 * layout.scale)} fill={accentColor}
                style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }} />
            )}
          </svg>
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            fontSize: Math.round(18 * layout.scale), color: hexToRgba(accentColor, 0.7),
            fontWeight: "bold", marginTop: Math.round(20 * layout.scale),
          }}>VS</div>
        </div>

        <Panel panel={right} side="right" accentColor={accentColor} palette={palette} />
      </div>
    </AbsoluteFill>
  );
}
