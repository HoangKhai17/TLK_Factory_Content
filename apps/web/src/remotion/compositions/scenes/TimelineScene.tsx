import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, TimelineStep } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

function StepRow({
  step, index, accentColor, palette, isLast,
}: {
  step: TimelineStep; index: number; accentColor: string; palette: ColorPalette; isLast: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const delay = index * Math.round(fps * 0.3);
  const eff = Math.max(0, frame - Math.round(fps * 0.2) - delay);

  const opacity = interpolate(eff, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const x = interpolate(eff, [0, fps * 0.35], [50, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const numScale = spring({ frame: eff, fps, config: { mass: 0.5, damping: 10 }, from: 0.2, to: 1 });
  const lineProgress = interpolate(Math.max(0, eff - Math.round(fps * 0.15)), [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const circleSize   = Math.round(52 * layout.scale);
  const connectorH   = Math.round(48 * layout.scale);
  const connectorW   = Math.round(22 * layout.scale);
  const titleFontSz  = Math.round(26 * layout.scale);
  const descFontSz   = Math.round(19 * layout.scale);

  return (
    <div style={{ display: "flex", gap: Math.round(22 * layout.scale), alignItems: "flex-start", opacity }}>
      {/* Number bubble + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ transform: `scale(${numScale})`, position: "relative" }}>
          <svg width={circleSize} height={circleSize} style={{ position: "absolute", inset: 0 }}>
            <circle cx={circleSize/2} cy={circleSize/2} r={circleSize/2 - 2} fill="none" stroke={hexToRgba(accentColor, 0.35)} strokeWidth={1.5} strokeDasharray="5 4" />
          </svg>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.6)})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: Math.round(20 * layout.scale), fontWeight: 900, color: "#fff",
            boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.5)}, 0 4px 12px rgba(0,0,0,0.3)`,
          }}>
            {step.number}
          </div>
        </div>

        {!isLast && (
          <svg width={connectorW} height={connectorH} style={{ marginTop: 4 }}>
            <line x1={connectorW/2} y1={0} x2={connectorW/2} y2={connectorH * lineProgress}
              stroke={hexToRgba(accentColor, 0.4)} strokeWidth={2} strokeDasharray="6 4" />
            {lineProgress > 0 && lineProgress < 0.95 && (
              <circle cx={connectorW/2} cy={connectorH * lineProgress} r={Math.round(3.5 * layout.scale)}
                fill={accentColor} style={{ filter: `drop-shadow(0 0 5px ${accentColor})` }} />
            )}
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ transform: `translateX(${x}px)`, paddingTop: Math.round(12 * layout.scale), paddingBottom: isLast ? 0 : Math.round(8 * layout.scale) }}>
        <div style={{ fontSize: titleFontSz, fontWeight: "bold", color: palette.text, lineHeight: 1.2, marginBottom: step.description ? Math.round(6 * layout.scale) : 0 }}>
          {step.title}
        </div>
        {step.description && (
          <div style={{ fontSize: descFontSz, color: hexToRgba(palette.text, 0.55), lineHeight: 1.55 }}>
            {step.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function TimelineScene({ scene, accentColor, palette }: TimelineSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const titleOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const steps = scene.steps ?? [];

  return (
    <AbsoluteFill style={{
      ...parseBackground(scene.background, palette),
      flexDirection: "column",
      padding: `${layout.py}px ${layout.px}px`,
      gap: layout.gap,
      overflow: "hidden",
    }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          letterSpacing: "-0.02em", lineHeight: layout.lineH,
          paddingBottom: Math.round(20 * layout.scale),
          borderBottom: `${layout.accentBorder}px solid ${accentColor}`,
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "column", gap: 0, flex: 1,
        justifyContent: steps.length <= 4 ? "center" : "flex-start",
        position: "relative", zIndex: 1,
      }}>
        {steps.map((step, i) => (
          <StepRow key={i} step={step} index={i} accentColor={accentColor} palette={palette} isLast={i === steps.length - 1} />
        ))}
      </div>
    </AbsoluteFill>
  );
}
