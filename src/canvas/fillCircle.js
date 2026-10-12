export function fillCircle(context, cx, cy, r) {
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fill();
}
