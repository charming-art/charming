import {append, paint} from "./create.js";

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
  x,
  y,
  fill,
  stroke,
  fontFamily,
  textAlign,
  textBaseline,
  fontSize = 14,
  fontWeight = "normal",
  ...options
}) {
  const node = append(this, "text", {
    x: x,
    y: y,
    "font-family": fontFamily,
    "font-size": fontSize,
    "font-weight": fontWeight === "normal" ? null : fontWeight,
    "text-anchor": anchors[textAlign],
    "dominant-baseline": baselines[textBaseline],
    // Like Canvas, a stroked text is only filled if a fill is given.
    ...paint({fill: fill ?? (stroke ? "none" : undefined), stroke, ...options}),
  });
  node.textContent = text;
  return this;
}
