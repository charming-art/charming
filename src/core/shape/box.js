// Centers a shape in its box, from x to x1 and from y to y1, in either order, like cm.rect spans
// it. A position spans if its pair is given, unless the position is set in the options without its
// pair, such as {y: "v2"} over a bound y1, which makes it a point. Returns the centered values and
// whether each position spans.
export function center(value, options = {}) {
  const span = (key, key1) => value[key1] !== undefined && (options[key] === undefined || options[key1] !== undefined);
  const spanX = span("x", "x1");
  const spanY = span("y", "y1");
  if (!spanX && !spanY) return {value, spanX, spanY};
  const {x: X, x1: X1, y: Y, y1: Y1} = value;
  value = {...value};
  if (spanX) value.x = X.map((x, i) => (x + X1[i]) / 2);
  if (spanY) value.y = Y.map((y, i) => (y + Y1[i]) / 2);
  return {value, spanX, spanY};
}
