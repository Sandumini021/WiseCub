type StockPriceChartProps = {
  points: number[];
  falling: boolean;
};

export function StockPriceChart({ points, falling }: StockPriceChartProps) {
  const width = 520;
  const height = 160;
  if (points.length < 2) {
    return <p className="muted">No chart points.</p>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");
  const color = falling ? "#dc2626" : "#15803d";
  return (
    <svg
      className="price-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Synthetic price chart"
    >
      <polyline fill="none" stroke={color} strokeWidth="3" points={coords} />
    </svg>
  );
}
