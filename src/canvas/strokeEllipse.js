export function strokeEllipse(context, cx, cy, rx, ry) {
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  context.stroke();
}
