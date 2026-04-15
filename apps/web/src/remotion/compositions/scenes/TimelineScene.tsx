import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, TimelineStep } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface StepRowProps {
  step: TimelineStep;
  index: number;
  accentColor: string;
  palette: ColorPalette;
  isLast: boolean;
}

function StepRow({ step, index, accentColor, palette, isLast }: StepRowProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = index * Math.round(fps * 0.32);
  const eff = Math.max(0, frame - Math.round(fps * 0.2) - delay);

  const opacity = interpolate(eff, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const x = interpolate(eff, [0, fps * 0.35], [60, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const numScale = spring({ frame: eff, fps, config: { mass: 0.5, damping: 10 }, from: 0.2, to: 1 });

  // Connector line animates after number
  const lineProgress = interpolate(Math.max(0, eff - Math.round(fps * 0.15)), [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const connectorHeight = 54;

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", opacity }}>
      {/* Number bubble + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        {/* Step number circle with SVG glow */}
        <div style={{ transform: `scale(${numScale})`, position: "relative" }}>
          <svg width={56} height={56} style={{ position: "absolute", inset: 0 }}>
            <circle cx={28} cy={28} r={26} fill="none" stroke={hexToRgba(accentColor, 0.35)} strokeWidth={1.5} strokeDasharray="5 4" />
          </svg>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.6)})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: "black", color: "#ffffff",
            boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.5)}, 0 4px 12px rgba(0,0,0,0.3)`,
          }}>
            {step.number}
          </div>
        </div>

        {/* SVG animated connector */}
        {!isLast && (
          <svg width={24} height={connectorHeight} style={{ marginTop: 4 }}>
            {/* Static dashed line */}
            <line x1={12} y1={0} x2={12} y2={connectorHeight * lineProgress} stroke={hexToRgba(accentColor, 0.4)} strokeWidth={2} strokeDasharray="6 4" />
            {/* Traveling dot */}
            {lineProgress > 0 && lineProgress < 0.95 && (
              <circle cx={12} cy={connectorHeight * lineProgress} r={3.5} fill={accentColor} style={{ filter: `drop-shadow(0 0 5px ${accentColor})` }} />
            )}
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ transform: `translateX(${x}px)`, paddingTop: 14, paddingBottom: isLast ? 0 : 8 }}>
        <div style={{ fontSize: 28, fontWeight: "bold", color: palette.text, lineHeight: 1.2, marginBottom: step.description ? 8 : 0 }}>
          {step.title}
        </div>
        {step.description && (
          <div style={{ fontSize: 20, color: hexToRgba(palette.text, 0.55), lineHeight: 1.55 }}>
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

  const titleOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const steps = scene.steps ?? [];

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${LAYOUT.py}px ${LAYOUT.px}px`, gap: LAYOUT.gap }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          fontSize: scene.title.fontSize ?? LAYOUT.titleSize, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          letterSpacing: "-0.02em", lineHeight: LAYOUT.lineH,
          paddingBottom: 22, borderBottom: `${LAYOUT.accentBorder}px solid ${accentColor}`,
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
