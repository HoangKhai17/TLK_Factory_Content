import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BulletItem, Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { CheckIcon } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface BulletRowProps {
  item: BulletItem;
  index: number;
  delayFrames: number;
  accentColor: string;
  palette: ColorPalette;
}

function BulletRow({ item, index, delayFrames, accentColor, palette }: BulletRowProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stagger = index * Math.round(fps * 0.22);
  const eff = Math.max(0, frame - delayFrames - stagger);

  const opacity = interpolate(eff, [0, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const x = interpolate(eff, [0, fps * 0.35], [-80, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      opacity, transform: `translateX(${x}px)`,
      display: "flex", alignItems: "center", gap: 20,
      padding: "16px 28px",
      backgroundColor: hexToRgba(accentColor, 0.07),
      borderRadius: 14,
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: `inset 0 0 0 1px ${hexToRgba(accentColor, 0.15)}`,
    }}>
      {/* Icon or animated checkmark */}
      {item.icon ? (
        <span style={{ fontSize: 32, lineHeight: 1, minWidth: 42, textAlign: "center" }}>
          {item.icon}
        </span>
      ) : (
        <CheckIcon size={28} color={accentColor} startFrame={delayFrames + stagger + 4} />
      )}
      <span style={{
        fontSize: 27, fontWeight: "600",
        color: palette.text,
        lineHeight: 1.4, letterSpacing: "-0.01em",
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

  const titleOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.45], [-36, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const bullets = scene.bullets ?? [];

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${LAYOUT.py}px ${LAYOUT.px}px`, gap: LAYOUT.gap }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          display: "flex", flexDirection: "column", gap: 8,
          paddingBottom: 24, borderBottom: `${LAYOUT.accentBorder}px solid ${accentColor}`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            fontSize: scene.title.fontSize ?? LAYOUT.titleSize,
            fontWeight: scene.title.fontWeight ?? "bold",
            color: scene.title.color ?? palette.text,
            lineHeight: LAYOUT.lineH, letterSpacing: "-0.02em",
          }}>
            {scene.title.content}
          </div>
          {scene.subtitle && (
            <div style={{
              fontSize: scene.subtitle.fontSize ?? LAYOUT.subtitleSize,
              color: scene.subtitle.color ?? hexToRgba(accentColor, 0.85),
            }}>
              {scene.subtitle.content}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "column", gap: 12, flex: 1,
        justifyContent: bullets.length <= 4 ? "center" : "flex-start",
        position: "relative", zIndex: 1,
      }}>
        {bullets.map((item, i) => (
          <BulletRow
            key={i} item={item} index={i}
            delayFrames={Math.round(fps * 0.35)}
            accentColor={accentColor} palette={palette}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
