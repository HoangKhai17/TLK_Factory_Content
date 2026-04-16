import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface OutroSceneProps {
  scene: Scene;
  primaryColor: string;
  accentColor: string;
  palette: ColorPalette;
}

export function OutroScene({ scene, accentColor, palette }: OutroSceneProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const layout = useLayout();

  const titleScale = spring({ frame, fps, config: { mass: 0.5, damping: 10 }, from: 0.6, to: 1 });
  const titleOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [fps * 0.4, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [fps * 0.4, fps * 0.8], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const ripples = [0, fps * 0.4, fps * 0.8].map((offset) =>
    interpolate(Math.max(0, frame - offset), [0, fps * 1.5], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const maxR = Math.max(width, height) * 0.7;

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), justifyContent: "center", alignItems: "center", flexDirection: "column", gap: Math.round(32 * layout.scale), overflow: "hidden" }}>
      <BackgroundDecor palette={palette} intensity={0.6} />

      {/* Expanding ripple rings */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox={`0 0 ${width} ${height}`}>
        {ripples.map((r, i) => (
          <circle key={i} cx={width / 2} cy={height / 2} r={r * maxR} fill="none" stroke={hexToRgba(accentColor, (1 - r) * 0.28)} strokeWidth={2} />
        ))}
      </svg>

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `scale(${titleScale})`,
          fontSize: scene.title.fontSize ?? 72, fontWeight: scene.title.fontWeight ?? "black",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.03em", lineHeight: 1.15, padding: "0 80px",
          textShadow: `0 4px 40px ${hexToRgba(accentColor, 0.4)}`,
        }}>
          {scene.title.content}
        </div>
      )}

      {scene.subtitle && (
        <div style={{
          opacity: subOpacity, transform: `translateY(${subY}px)`,
          padding: `${Math.round(14 * layout.scale)}px ${Math.round(44 * layout.scale)}px`,
          background: `linear-gradient(135deg, ${accentColor}, ${palette.primary})`,
          borderRadius: 100, fontSize: scene.subtitle.fontSize ?? layout.subtitleSize,
          fontWeight: "bold", color: "#ffffff",
          boxShadow: `0 8px 32px ${hexToRgba(accentColor, 0.4)}`, letterSpacing: "0.02em",
        }}>
          {scene.subtitle.content}
        </div>
      )}

      {scene.body && (
        <div style={{ opacity: subOpacity, fontSize: scene.body.fontSize ?? 22, color: hexToRgba(palette.text, 0.55), textAlign: "center" }}>
          {scene.body.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
