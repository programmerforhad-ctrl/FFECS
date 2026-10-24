// Tea-garden hill contour lines. Built once at render time (no client code), drawn as nested wavy loops.
function loop(cx: number, cy: number, r: number, k: number): string {
  const pts: [number, number][] = [];
  const N = 36;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob =
      1 +
      0.13 * Math.sin(a * 3 + k * 0.7) +
      0.07 * Math.sin(a * 5 - k * 0.45) +
      0.04 * Math.cos(a * 7 + k);
    pts.push([cx + Math.cos(a) * r * wob * 1.25, cy + Math.sin(a) * r * wob * 0.9]);
  }
  // closed Catmull-Rom spline -> cubic beziers
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

export default function Contours({ className = "", rings = 16 }: { className?: string; rings?: number }) {
  const paths = Array.from({ length: rings }, (_, i) => loop(500, 400, 40 + i * 36, i));
  return (
    <svg viewBox="0 0 1000 800" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <g className="contours" fill="none" stroke="currentColor" strokeWidth="1.2">
        {paths.map((d, i) => (
          <path key={i} d={d} opacity={0.25 + (i % 4 === 0 ? 0.35 : 0)} />
        ))}
      </g>
    </svg>
  );
}
