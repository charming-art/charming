// Clips what's drawn next, until restore, to a rect {x, y, width, height}, or to a path {x, y, d}
// at x and y, in the current coordinates.
export function canvas$clip({x = 0, y = 0, width, height, d}) {
  const context = this._context;
  if (d === undefined) {
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
  } else {
    context.translate(x, y);
    context.clip(new Path2D(d));
    context.translate(-x, -y);
  }
  return this;
}
