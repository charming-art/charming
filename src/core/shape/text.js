import {format as numberFormat} from "d3-format";
import {center} from "./box.js";
import {define} from "./define.js";

// Like cm.circle, a text can be centered in a box from x to x1 and from y to y1; it's then aligned
// at its center along each position that spans, unless an alignment is given.
function maybeBox(value, options) {
  const {value: centered, spanX, spanY} = center(value, options);
  const n = (spanX ? value.x1 : value.y1)?.length;
  if (spanX && centered.textAlign === undefined) centered.textAlign = Array.from({length: n}, () => "center");
  if (spanY && centered.textBaseline === undefined) centered.textBaseline = Array.from({length: n}, () => "middle");
  return centered;
}

// A format is a function of the text, or a d3 number format, such as ",d", like an axis's tickFormat;
// each string is made a function once.
export function formatsOf(F) {
  const formats = new Map();
  return F.map((f) => {
    if (typeof f !== "string") return f;
    if (!formats.has(f)) formats.set(f, numberFormat(f));
    return formats.get(f);
  });
}

export const text = define((renderer, I, value, options) => {
  value = maybeBox(value, options);
  const {
    text: T = [],
    format: FM = [],
    x: X = [],
    y: Y = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
    textBaseline: TB = [],
    textAlign: TA = [],
    fontFamily: FF = [],
    fontSize: FS = [],
    fontWeight: FW = [],
    rotate: R = [],
    paintOrder: PO = [],
  } = value;
  const FT = formatsOf(FM);
  for (const i of I) {
    renderer.text({
      x: X[i],
      y: Y[i],
      text: T[i],
      format: FT[i],
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
      textBaseline: TB[i],
      textAlign: TA[i],
      fontFamily: FF[i],
      fontSize: FS[i],
      fontWeight: FW[i],
      ...(R[i] && {rotate: R[i]}),
      ...(PO[i] && {paintOrder: PO[i]}),
    });
  }
});
