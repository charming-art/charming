export function pathPolygon(points) {
  return `M ${points.map((p) => `${p[0]} ${p[1]}`).join(" L ")} Z`;
}
