import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, StatItem } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { ProgressRing, BarChart, HexGrid, AnimatedCounter } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

function parsePercent(value: string): number | null {
  const m = value.match(/^(\d+(?:\.\d+)?)\s*%$/);
  return m ? parseFloat(m[1]!) : null;
}

interface StatCardProps {
  stat: StatItem;
  index: number;
  accentColor: string;
  palette: ColorPalette;
  total: number;
}

function StatCard({ stat, index, accentColor, palette, total }: StatCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const delay = index * Math.round(fps * 0.25);
  const eff = Math.max(0, frame - delay);

  const scale = spring({ frame: eff, fps, config: { mass: 0.45, damping: 11 }, from: 0.3, to: 1 });
  const opacity = interpolate(eff, [0, fps * 0.25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const cardColor = stat.color ?? accentColor;
  const pct = parsePercent(stat.value);
  const isPercent = pct !== null;
  const isLarge = total <= 2;

  const ringSize    = Math.round((isLarge ? 160 : 130) * layout.scale);
  const ringStroke  = Math.round((isLarge ? 14 : 11) * layout.scale);
  const valueFontSz = isLarge ? layout.titleSize * 1.7 : total === 3 ? layout.titleSize * 1.35 : layout.titleSize * 1.1;

  return (
    <div style={{
      opacity, transform: `scale(${scale})`,
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: isLarge ? `${layout.py}px ${layout.px}px` : `${layout.gap}px ${layout.gap * 0.8}px`,
      backgroundColor: hexToRgba(cardColor, 0.07),
      borderRadius: layout.cardRadius,
      border: `1px solid ${hexToRgba(cardColor, 0.3)}`,
      boxShadow: `0 0 40px ${hexToRgba(cardColor, 0.12)}, inset 0 1px 0 ${hexToRgba(cardColor, 0.2)}`,
      gap: Math.round(14 * layout.scale), position: "relative", overflow: "hidden",
    }}>
      <HexGrid color={cardColor} opacity={0.06} width={300} height={200} />

      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "50%", height: 3, backgroundColor: cardColor, borderRadius: "0 0 4px 4px",
        boxShadow: `0 0 12px ${cardColor}`,
      }} />

      {/* Circular ring for % */}
      {isPercent && (
        <div style={{ position: "relative" }}>
          <ProgressRing percent={pct!} color={cardColor} size={ringSize} strokeWidth={ringStroke} startFrame={delay} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: Math.round(valueFontSz * 0.62), fontWeight: 900, color: cardColor, lineHeight: 1, letterSpacing: "-0.03em" }}>
              <AnimatedCounter value={stat.value} startFrame={delay} />
            </span>
          </div>
        </div>
      )}

      {/* Count-up for non-% */}
      {!isPercent && (
        <div style={{
          fontSize: Math.round(valueFontSz), fontWeight: 900, color: cardColor, lineHeight: 1,
          letterSpacing: "-0.04em",
          textShadow: `0 0 40px ${hexToRgba(cardColor, 0.5)}`,
        }}>
          <AnimatedCounter value={stat.value} startFrame={delay} />
        </div>
      )}

      <div style={{
        fontSize: isLarge ? layout.subtitleSize : layout.bodySize,
        color: hexToRgba(palette.text, 0.7),
        textAlign: "center", fontWeight: 500, lineHeight: 1.4,
        maxWidth: Math.round(200 * layout.scale),
      }}>
        {stat.label}
      </div>
    </div>
  );
}

interface StatSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function StatScene({ scene, accentColor, palette }: StatSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const headerOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const headerY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const stats = scene.stats ?? [];
  const barValues = stats.map((s) => parsePercent(s.value) ?? 70);
  const barColors  = stats.map((s) => s.color ?? accentColor);

  return (
    <AbsoluteFill style={{
      ...parseBackground(scene.background, palette),
      flexDirection: "column",
      padding: `${layout.py}px ${layout.px}px`,
      gap: layout.gap,
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: headerOpacity, transform: `translateY(${headerY}px)`,
          fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.2,
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "row",
        flexWrap: stats.length > 3 ? "wrap" : "nowrap",
        gap: Math.round(20 * layout.scale), width: "100%",
        position: "relative", zIndex: 1,
      }}>
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} index={i} accentColor={accentColor} palette={palette} total={stats.length} />
        ))}
      </div>

      {stats.length >= 2 && stats.length <= 4 && (
        <div style={{ opacity: headerOpacity, position: "relative", zIndex: 1 }}>
          <BarChart
            values={barValues} colors={barColors}
            width={Math.min(stats.length * Math.round(130 * layout.scale), Math.round(560 * layout.scale))}
            height={Math.round(72 * layout.scale)}
            startFrame={Math.round(fps * 0.4)}
          />
        </div>
      )}

      {scene.subtitle && (
        <div style={{
          opacity: headerOpacity,
          fontSize: scene.subtitle.fontSize ?? layout.subtitleSize,
          color: hexToRgba(palette.text, 0.5),
          textAlign: "center", fontStyle: "italic",
          position: "relative", zIndex: 1,
        }}>
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
