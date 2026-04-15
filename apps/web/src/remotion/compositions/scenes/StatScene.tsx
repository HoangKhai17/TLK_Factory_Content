import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, StatItem } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { ProgressRing, BarChart, HexGrid } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

/** Detect if value looks like a percentage */
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
  const delay = index * Math.round(fps * 0.28);
  const eff = Math.max(0, frame - delay);

  const scale = spring({ frame: eff, fps, config: { mass: 0.5, damping: 11 }, from: 0.3, to: 1 });
  const opacity = interpolate(eff, [0, fps * 0.25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const cardColor = stat.color ?? accentColor;
  const pct = parsePercent(stat.value);
  const isPercent = pct !== null;
  const isLarge = total <= 2;

  return (
    <div style={{
      opacity, transform: `scale(${scale})`,
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: isLarge ? "48px 60px" : "32px 36px",
      backgroundColor: hexToRgba(cardColor, 0.07),
      borderRadius: 24,
      border: `1px solid ${hexToRgba(cardColor, 0.3)}`,
      boxShadow: `0 0 40px ${hexToRgba(cardColor, 0.12)}, inset 0 1px 0 ${hexToRgba(cardColor, 0.2)}`,
      gap: 16, position: "relative", overflow: "hidden",
    }}>
      {/* Hex grid bg decoration */}
      <HexGrid color={cardColor} opacity={0.06} width={300} height={200} />

      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "50%", height: 3, backgroundColor: cardColor, borderRadius: "0 0 4px 4px",
        boxShadow: `0 0 12px ${cardColor}`,
      }} />

      {/* Circular ring for percentages */}
      {isPercent && (
        <div style={{ position: "relative" }}>
          <ProgressRing
            percent={pct!} color={cardColor}
            size={isLarge ? 160 : 130}
            strokeWidth={isLarge ? 14 : 11}
            startFrame={delay}
          />
          {/* Centered value inside ring */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: isLarge ? 38 : 30, fontWeight: "black", color: cardColor, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {stat.value}
            </span>
          </div>
        </div>
      )}

      {/* Big value text for non-percent */}
      {!isPercent && (
        <div style={{
          fontSize: isLarge ? 96 : total === 3 ? 76 : 60,
          fontWeight: "black", color: cardColor, lineHeight: 1,
          letterSpacing: "-0.04em",
          textShadow: `0 0 40px ${hexToRgba(cardColor, 0.5)}`,
        }}>
          {stat.value}
        </div>
      )}

      <div style={{
        fontSize: isLarge ? 24 : 20,
        color: hexToRgba(palette.text, 0.7),
        textAlign: "center", fontWeight: "500", lineHeight: 1.4, maxWidth: 200,
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

  const headerOpacity = interpolate(frame, [0, fps * 0.35], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const headerY = interpolate(frame, [0, fps * 0.4], [-28, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const stats = scene.stats ?? [];
  // Bar chart values for non-percent stats
  const barValues = stats.map((s) => parsePercent(s.value) ?? 70);
  const barColors = stats.map((s) => s.color ?? accentColor);

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", padding: `${LAYOUT.py}px ${LAYOUT.px}px`, gap: LAYOUT.gap, alignItems: "center", justifyContent: "center" }}>
      <BackgroundDecor palette={palette} />

      {scene.title && (
        <div style={{
          opacity: headerOpacity, transform: `translateY(${headerY}px)`,
          fontSize: scene.title.fontSize ?? 46, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.2,
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      {/* Stats grid */}
      <div style={{
        display: "flex",
        flexDirection: stats.length > 3 ? "row" : "row",
        flexWrap: stats.length > 3 ? "wrap" : "nowrap",
        gap: 24, width: "100%",
        maxHeight: stats.length > 3 ? "none" : 320,
        position: "relative", zIndex: 1,
      }}>
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} index={i} accentColor={accentColor} palette={palette} total={stats.length} />
        ))}
      </div>

      {/* Optional bar chart below for visual richness */}
      {stats.length >= 2 && stats.length <= 4 && (
        <div style={{ opacity: headerOpacity, position: "relative", zIndex: 1 }}>
          <BarChart
            values={barValues} colors={barColors}
            width={Math.min(stats.length * 140, 560)} height={80}
            startFrame={Math.round(fps * 0.4)}
          />
        </div>
      )}

      {scene.subtitle && (
        <div style={{
          opacity: headerOpacity,
          fontSize: scene.subtitle.fontSize ?? 22,
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
