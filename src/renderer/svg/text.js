import {append, degrees, paint} from "./create.js";

const anchors = {start: "start", left: "start", center: "middle", end: "end", right: "end"};

const baselines = {
  top: "text-before-edge",
  hanging: "hanging",
  middle: "central",
  alphabetic: null,
  ideographic: "ideographic",
  bottom: "text-after-edge",
};

export function svg$text({
  text,
  format,
  x,
  y,
  fill,
  stroke,
  fontFamily,
  textAlign,
  textBaseline,
  fontSize = 14,
  fontWeight = "normal",
  rotate,
  ...options
}) {
  // A missing text is empty, as browsers would write undefined; a format writes the value, such as
  // a number that a transition interpolates.
  const content = `${(typeof format === "function" ? format(text) : text) ?? ""}`;
  const node = append(this, "text", {
    x: x,
    y: y,
    // Like Canvas, the text turns around its position, in radians.
    transform: rotate ? `rotate(${degrees(rotate)},${x},${y})` : null,
    "font-family": fontFamily,
    "font-size": fontSize,
    "font-weight": fontWeight === "normal" ? null : fontWeight,
    "text-anchor": anchors[textAlign],
    "dominant-baseline": baselines[textBaseline],
    // Like Canvas, keep repeated, leading and trailing spaces, of the text as written.
    style: /^\s|\s$|\s\s/.test(content) ? "white-space: pre" : null,
    // Like Canvas, a stroked text is only filled if a fill is given.
    ...paint({fill: fill ?? (stroke ? "none" : undefined), stroke, ...options}),
  });
  if (node.textContent !== content) node.textContent = content;
  return this;
}
