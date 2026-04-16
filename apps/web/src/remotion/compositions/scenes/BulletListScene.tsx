import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BulletItem, Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { CheckIcon } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

function BulletRow({
  item, index, delayFrames, accentColor, palette,
}: {
  item: BulletItem; index: number; delayFrames: number; accentColor: string; palette: ColorPalette;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const stagger = index * Math.round(fps * 0.2);
  const eff = Math.max(0, frame - delayFrames - stagger);

  const opacity = interpolate(eff, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const x = interpolate(eff, [0, fps * 0.35], [-60, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      opacity, transform: `translateX(${x}px)`,
      display: "flex", alignItems: "center", gap: Math.round(18 * layout.scale),
      padding: `${Math.round(14 * layout.scale)}px ${Math.round(24 * layout.scale)}px`,
      backgroundColor: hexToRgba(accentColor, 0.07),
      borderRadius: Math.round(12 * layout.scale),
      borderLeft: `${layout.accentBorder}px solid ${accentColor}`,
      boxShadow: `inset 0 0 0 1px ${hexToRgba(accentColor, 0.15)}`,
    }}>
      {item.icon ? (
        <span style={{ fontSize: Math.round(28 * layout.scale), lineHeight: 1, minWidth: Math.round(36 * layout.scale), textAlign: "center" }}>
          {item.icon}
        </span>
      ) : (
        <CheckIcon size={Math.round(26 * layout.scale)} color={accentColor} startFrame={delayFrames + stagger + 4} />
      )}
      <span style={{
        fontSize: Math.round(24 * layout.scale), fontWeight: 600,
        color: palette.text, lineHeight: 1.4, letterSpacing: "-0.01em",
      }}>
        {item.text}
      </span>
    </div>
  );
}

interface BulletListSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function BulletListScene({ scene, accentColor, palette }: BulletListSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const titleOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.45], [-30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const bullets = scene.bullets ?? [];

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
          display: "flex", flexDirection: "column", gap: Math.round(8 * layout.scale),
          paddingBottom: Math.round(20 * layout.scale),
          borderBottom: `${layout.accentBorder}px solid ${accentColor}`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            fontSize: scene.title.fontSize ?? layout.titleSize,
            fontWeight: scene.title.fontWeight ?? "bold",
            color: scene.title.color ?? palette.text,
            lineHeight: layout.lineH, letterSpacing: "-0.02em",
          }}>
            {scene.title.content}
          </div>
          {scene.subtitle && (
            <div style={{
              fontSize: scene.subtitle.fontSize ?? layout.subtitleSize,
              color: scene.subtitle.color ?? hexToRgba(accentColor, 0.85),
            }}>
              {scene.subtitle.content}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "column", gap: Math.round(10 * layout.scale), flex: 1,
        justifyContent: bullets.length <= 4 ? "center" : "flex-start",
        position: "relative", zIndex: 1,
      }}>
        {bullets.map((item, i) => (
          <BulletRow
            key={i} item={item} index={i}
            delayFrames={Math.round(fps * 0.3)}
            accentColor={accentColor} palette={palette}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
