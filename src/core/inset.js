import {textWidth} from "./textWidth.js";
import {outlineOf} from "./transition/outline.js";

// The clip insets of a primitive: the fractions of its box cut from each side, such as clipTop: 1
// for none of it, which a transition opens from the bottom, or clipRight: 0.5 for its left half.
export const insets = ["clipTop", "clipRight", "clipBottom", "clipLeft"];

// The primitives that a shape draws, which take clip insets.
const primitives = ["point", "circle", "rect", "line", "triangle", "path", "polygon", "text", "arc"];

// Draws a primitive, clipped to its box less its insets, if any: the box of its outline, or of its
// text, estimated like Plot's, with half its stroke. A primitive without a box, such as a path,
// isn't clipped.
export function drawPrimitive(renderer, type, attrs) {
  if (!insets.some((key) => key in attrs)) return renderer[type](attrs);
  const {clipTop = 0, clipRight = 0, clipBottom = 0, clipLeft = 0, ...rest} = attrs;
  const box = clipTop || clipRight || clipBottom || clipLeft ? boxOf(type, rest) : null;
  if (!box || !renderer.clip) return renderer[type](rest);
  const [x0, y0, x1, y1] = box;
  const [w, h] = [x1 - x0, y1 - y0];
  const [left, top] = [x0 + w * clipLeft, y0 + h * clipTop];
  const [right, bottom] = [x1 - w * clipRight, y1 - h * clipBottom];
  renderer.save();
  renderer.clip({x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top)});
  renderer[type](rest);
  renderer.restore();
  return renderer;
}

// The box of a primitive in the coordinates it's drawn in, [x0, y0, x1, y1], with half its stroke,
// or null if it has none.
function boxOf(type, attrs) {
  const points = type === "text" ? textCorners(attrs) : outlineOf({type, attrs})?.points;
  if (!points?.length) return null;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  const pad = attrs.stroke && attrs.stroke !== "none" ? (attrs.strokeWidth ?? 1) / 2 : 0;
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}

// The corners of the box of a text, by its alignment and baseline, turned around its position, as
// the renderers draw it, 14px by default. Its width is estimated by the widths of its characters,
// and an alphabetic baseline, the default, is 0.8em under its top.
function textCorners({text, format, x = 0, y = 0, fontSize = 14, textAlign, textBaseline, rotate}) {
  const content = `${(typeof format === "function" ? format(text) : text) ?? ""}`;
  const w = textWidth(content, fontSize);
  const h = fontSize;
  const left = textAlign === "center" ? x - w / 2 : textAlign === "end" || textAlign === "right" ? x - w : x;
  const top =
    textBaseline === "top" || textBaseline === "hanging"
      ? y
      : textBaseline === "middle"
        ? y - h / 2
        : textBaseline === "bottom" || textBaseline === "ideographic"
          ? y - h
          : y - 0.8 * h;
  const corners = [
    [left, top],
    [left + w, top],
    [left + w, top + h],
    [left, top + h],
  ];
  if (!rotate) return corners;
  const [cos, sin] = [Math.cos(rotate), Math.sin(rotate)];
  return corners.map(([px, py]) => [x + (px - x) * cos - (py - y) * sin, y + (px - x) * sin + (py - y) * cos]);
}

// The renderer of a shape whose rows have clip insets: each primitive it draws takes the insets of
// its row, in order, or of the first row of its group for a shape that draws one per group, such
// as a line, and is clipped by them, as drawPrimitive draws it. A renderer that records primitives,
// for transitions, keeps the insets as attributes instead, so that they interpolate. Shapes draw
// one primitive at a time through it, rather than in batches, such as the rects of WebGL.
export function withInsets(renderer, I, value) {
  const keys = insets.filter((key) => key in value);
  if (!keys.length) return renderer;
  let k = 0;
  const own = (attrs) => {
    const r = I[k++];
    if (r === undefined) return attrs;
    const row = {...attrs};
    for (const key of keys) if (value[key][r] !== undefined) row[key] = value[key][r];
    return row;
  };
  const draw = (type) => (attrs) =>
    renderer.recorded ? renderer[type](own(attrs)) : drawPrimitive(renderer, type, own(attrs));
  return new Proxy(renderer, {
    get(target, key) {
      if (primitives.includes(key) && typeof target[key] === "function") return draw(key);
      if (key === "rects" || key === "circles" || key === "triangles") return undefined;
      const v = target[key];
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}
