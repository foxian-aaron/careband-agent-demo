interface TrendPoint {
  label: string;
  value: number;
}

interface TrendMiniChartProps {
  title: string;
  points: TrendPoint[];
  unit?: string;
  variant?: "line" | "bar";
}

export const TrendMiniChart = ({
  title,
  points,
  unit = "",
  variant = "line",
}: TrendMiniChartProps) => {
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const width = 260;
  const height = 92;
  const padding = 14;
  const coords = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point.value - min) / range) * (height - padding * 2);
    return { x, y, ...point };
  });
  const polyline = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");

  return (
    <article className="trend-card">
      <div className="trend-card__head">
        <strong>{title}</strong>
        <span>
          {points[points.length - 1]?.value}
          {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {variant === "bar"
          ? coords.map((coord, index) => (
              <rect
                key={`${coord.label}-${index}`}
                x={coord.x - 9}
                y={coord.y}
                width="18"
                height={height - padding - coord.y}
                rx="4"
              />
            ))
          : (
              <>
                <polyline points={polyline} />
                {coords.map((coord, index) => (
                  <circle key={`${coord.label}-${index}`} cx={coord.x} cy={coord.y} r="3.5" />
                ))}
              </>
            )}
      </svg>
      <div className="trend-labels">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </article>
  );
};
