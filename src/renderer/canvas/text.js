import {normalizeColorString} from "../../core/color.js";

export function canvas$text({
  text,
  format,
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
  rotate,
}) {
  if (format) text = format(text);
  stroke = normalizeColorString(stroke, strokeOpacity);
  fill = normalizeColorString(fill, fillOpacity);
  const context = this._context;
  context.save();
  if (stroke) context.strokeStyle = stroke;
  if (strokeWidth) context.lineWidth = strokeWidth;
  if (fill) context.fillStyle = fill;
  if (textAlign) context.textAlign = textAlign;
  if (textBaseline) context.textBaseline = textBaseline;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`.trim();
  // A rotated text turns around its position, in radians.
  if (rotate) (context.translate(x, y), context.rotate(rotate), (x = 0), (y = 0));
  if (fill || !stroke) context.fillText(text, x, y);
  if (stroke) context.strokeText(text, x, y);
  context.restore();
}
