import {rgb} from "d3-color";
import {define} from "../../core/shape/define.js";
import {formatsOf} from "../../core/shape/text.js";
import {font} from "../font.js";
import {polarPoint} from "../transform/scales.js";
import {alignOf} from "./axisUtils.js";

// The sides of a position in a plane, such as "inside-top-left": horizontally and vertically, -1
// for the left or top, 1 for the right or bottom, 0 for the middle, and whether it's inside the box.
// An unknown position is the center.
function sidesOf(position) {
  const name = `${position ?? "center"}`;
  const inside = name.startsWith("inside-");
  const parts = (inside ? name.slice(7) : name).split("-");
  const h = parts.includes("left") ? -1 : parts.includes("right") ? 1 : 0;
  const v = parts.includes("top") ? -1 : parts.includes("bottom") ? 1 : 0;
  return {h, v, inside: inside && (h !== 0 || v !== 0)};
}

const aligns = {"-1": "start", 0: "center", 1: "end"};
const baselines = {"-1": "top", 0: "middle", 1: "bottom"};

// The point and alignment of a label in a plane, on the box from x0 to x1 and from y0 to y1, in
// screen terms: at the middle of an edge or a corner, padding inside or outside it, and aligned
// toward the inside, or away from the box outside.
function planeAnchor(position, [x0, x1, y0, y1], padding) {
  const {h, v, inside} = sidesOf(position);
  const k = inside ? -1 : 1;
  const x = (h < 0 ? x0 : h > 0 ? x1 : (x0 + x1) / 2) + h * k * padding;
  const y = (v < 0 ? y0 : v > 0 ? y1 : (y0 + y1) / 2) + v * k * padding;
  return {x, y, textAlign: aligns[-h * k], textBaseline: baselines[-v * k]};
}

// The point and alignment of a label on a wedge of cm.polar, from the angles a0 to a1 and the radii
// r0 to r1 around cx and cy: at its middle, or at its mid angle, padding inside or outside the outer
// radius, aligned by the direction from the center, outward or inward.
function polarAnchor(position, [a0, a1, r0, r1], center, padding) {
  const a = (a0 + a1) / 2;
  const outer = Math.max(r0, r1);
  const k = position === "outside" ? 1 : position === "inside" ? -1 : 0;
  const r = k ? outer + k * padding : (r0 + r1) / 2;
  const [x, y] = polarPoint(center, r, a);
  return {x, y, ...(k ? alignOf(k * Math.sin(a), -k * Math.cos(a)) : alignOf(0, 0))};
}

// The fill, black or white, that contrasts more with a color, by the WCAG contrast ratio of their
// relative luminances, such as for a label inside a bar of that color. A color painted with an
// opacity, or with an alpha of its own, is seen over white. A color that isn't one, such as
// "currentColor", has no contrast, so the label keeps its fill.
function contrastOf(color, opacity = 1) {
  const c = rgb(color);
  if (!(c.r >= 0)) return undefined;
  const alpha = (c.opacity >= 0 ? c.opacity : 1) * (opacity >= 0 ? opacity : 1);
  const [r, g, b] = [c.r, c.g, c.b].map((v) => alpha * v + (1 - alpha) * 255);
  const linear = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? "black" : "white";
}

// The paint of a label comes from its own options only, not the bound channels of the mark it
// labels, such as the colors of bars, which it would vanish into.
const paints = ["fill", "fillOpacity", "stroke", "strokeOpacity", "strokeWidth"];

// Like G2's labels, a text placed in or around the box of each row, from x to x1 and from y to y1,
// such as the bar of a bar chart, with the font of the axes. The position is "center", the default;
// a side or corner inside the box, such as "inside-right"; or outside it, such as "right" or
// "top-left"; with padding from the edge. On a wedge of cm.polar, it's "center", "inside" or
// "outside" its outer radius. Every option can vary by row, such as a position that flips sides
// with the sign of a value; dx and dy nudge a label after it's placed. With contrast true, the fill
// is black or white by the fill of the mark bound to the flow, and its opacity; with contrast a
// color, such as a fill given only to the mark, by that color. With halo, a stroke of haloWidth is
// painted under it.
export const label = define((renderer, I, value, options = {}) => {
  // Like cm.text, a position set in the options without its pair is a point, such as {x: (d) =>
  // d.x1} over a bar, rather than an edge of the box.
  const point = (key, key1) => key in options && !(key1 in options);
  const {
    x: X = [],
    y: Y = [],
    cx: CX,
    cy: CY,
    text: T = [],
    format: FM = [],
    position: P = [],
    padding: PD = [],
    dx: DX = [],
    dy: DY = [],
    contrast: C = [],
    halo: H = [],
    haloWidth: HW = [],
    textAlign: TA = [],
    textBaseline: TB = [],
    fontFamily: FF = [],
    fontSize: FS = [],
    fontWeight: FW = [],
    rotate: R = [],
  } = value;
  const X1 = point("x", "x1") ? X : (value.x1 ?? X);
  const Y1 = point("y", "y1") ? Y : (value.y1 ?? Y);
  const own = Object.fromEntries(paints.map((key) => [key, key in options ? value[key] : []]));
  // The paint of the mark labeled: its fill and opacity bound to the flow, unless the label gives
  // its own; with contrast given a color, such as the fill given only to the mark, that color.
  const marked = value.fill ?? [];
  const markedOpacity = ("fillOpacity" in options ? undefined : value.fillOpacity) ?? [];
  const FT = formatsOf(FM);
  const contrasts = new Map();
  for (const i of I) {
    const padding = PD[i] ?? 4;
    // A position without its pair, in the row, is a box of zero size along it, such as a dot.
    const [x0, x1, y0, y1] = [X[i], X1[i] ?? X[i], Y[i], Y1[i] ?? Y[i]];
    const anchor = CX
      ? polarAnchor(P[i], [x0, x1, y0, y1], {cx: CX[i], cy: CY[i]}, padding)
      : planeAnchor(P[i], [Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1)], padding);
    let fill = own.fill[i];
    if (fill === undefined && C[i]) {
      const [color, opacity] = C[i] === true ? [marked[i], markedOpacity[i]] : [C[i], 1];
      const key = `${color} ${opacity}`;
      if (color != null && !contrasts.has(key)) contrasts.set(key, contrastOf(color, opacity));
      fill = contrasts.get(key);
    }
    const halo = H[i] === true ? "white" : H[i] || undefined;
    renderer.text({
      x: anchor.x + (DX[i] ?? 0),
      y: anchor.y + (DY[i] ?? 0),
      text: T[i],
      format: FT[i],
      fill: fill ?? font.fill,
      fillOpacity: own.fillOpacity[i],
      stroke: halo ?? own.stroke[i],
      strokeOpacity: own.strokeOpacity[i],
      strokeWidth: halo ? (HW[i] ?? 3) : own.strokeWidth[i],
      // A halo is painted under the fill, with round joins, so that sharp letters don't spike.
      ...(halo && {paintOrder: "stroke", strokeJoin: "round"}),
      textAlign: TA[i] ?? anchor.textAlign,
      textBaseline: TB[i] ?? anchor.textBaseline,
      fontFamily: FF[i] ?? font.fontFamily,
      fontSize: FS[i] ?? font.fontSize,
      fontWeight: FW[i],
      ...(R[i] && {rotate: R[i]}),
    });
  }
});
