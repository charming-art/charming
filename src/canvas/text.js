import { normalizeColor } from "./normalize.js";

export function canvas$text({
  text,
  x,
  y,
  fill,
  stroke,
  strokeWidth,
  fillOpacity,
  strokeOpacity,
  fontFamily,
  textAlign,
  textBaseline,
  fontSize = 14,
  fontWeight = "normal",
}) {
  stroke = normalizeColor(stroke, strokeOpacity);
  fill = normalizeColor(fill, fillOpacity);
  const context = this._context;
  context.save();
  if (stroke) context.strokeStyle = stroke;
  if (strokeWidth) context.lineWidth = strokeWidth;
  if (fill) context.fill = fill;
  if (textAlign) context.textAlign = textAlign;
  if (textBaseline) context.textBaseline = textBaseline;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily ?? ""}`.trim();
  context.fillText(text, x, y);
  context.restore();
}