export function circle(context, I, value) {
  const { x: X, y: Y, fill: F = [], r: R } = value;
  for (const i of I) {
    context.beginPath();
    context.fillStyle = F[i];
    context.arc(X[i], Y[i], R[i], 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }
}
