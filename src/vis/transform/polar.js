import {scaleRadial} from "d3-scale";
import {point, scale} from "../../core/transform/scale.js";
import {
  axisHint,
  colorScales,
  hasAny,
  labeled,
  positionRecord,
  positionScale,
  resolve,
  withoutHints,
  withSeries,
} from "./scales.js";

// Rows from start to end, for a position that isn't encoded, such as the radius of a pie.
function span(n, [start, end]) {
  return [Array.from({length: n}, () => start), Array.from({length: n}, () => end)];
}

// The radial scale can be named, like the scales of cm.fit.
function radial(scale) {
  return scale === "radial" ? scaleRadial() : scale;
}

// Resolves the scales of the channels, and maps positions to polar coordinates: x to the angle,
// clockwise from 12 o'clock like d3.arc, and y to the radius, with a radial scale so that areas
// grow with values. A pie is then a stack along x, and a rose a spread along x. The center is
// kept in cx and cy for cm.arc. A renderer without a given size is resized to 640 × 640. The
// resolved scales are kept in context.scales, and the polar frame in context.frame.
export function polar(
  flow,
  data,
  {
    scaleX,
    scaleY,
    domainX,
    domainY,
    innerRadius = 0,
    startAngle = 0,
    endAngle = 2 * Math.PI,
    width,
    height,
    margin = 40,
    marginTop = margin,
    marginRight = margin,
    marginBottom = margin,
    marginLeft = margin,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.polar.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.polar.");

  const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
  width ??= auto?.width ? 640 : rendererWidth;
  height ??= auto?.height ? 640 : rendererHeight;
  renderer.resize?.(width, height);
  ({width, height} = renderer._props);

  const cx = (marginLeft + width - marginRight) / 2;
  const cy = (marginTop + height - marginBottom) / 2;
  const outerRadius = Math.max(0, Math.min(width - marginLeft - marginRight, height - marginTop - marginBottom) / 2);
  const r0 = innerRadius * outerRadius;
  const rangeX = [startAngle, endAngle];
  const rangeY = [r0, outerRadius];
  const frame = {type: "polar", cx, cy, innerRadius: r0, outerRadius, startAngle, endAngle};

  return data.map((context) => {
    context = withSeries(context);
    const {value, hints = {}} = context;
    const colors = colorScales(value, hints);

    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const x = positionScale(value, keysX, {
      scale: scaleX ?? hintX.scale,
      domain: domainX ?? hintX.domain,
      range: rangeX,
    });
    const y = positionScale(value, keysY, {
      scale: radial(scaleY ?? hintY.scale ?? "radial"),
      domain: domainY ?? hintY.domain,
      range: rangeY,
    });

    const [colored] = scale(flow, [context], colors);
    const descriptors = {};
    for (const key of keysX) if (key in value) descriptors[key] = {scale: x.scale, domain: x.domain, range: rangeX};
    for (const key of keysY) if (key in value) descriptors[key] = {scale: y.scale, domain: y.domain, range: rangeY};
    const [scaled] = scale(flow, [colored], descriptors, point);

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = labeled(positionRecord(x, rangeX, hintX), hintX);
    const recordY = labeled(positionRecord(y, rangeY, hintY), hintY);
    for (const key of keysX) if (key in value) scales[key] = recordX;
    for (const key of keysY) if (key in value) scales[key] = recordY;

    // A missing position fills its span: a pie has no y, so its wedges span the whole radius. Like a
    // stack, y is the outer radius and y1 the baseline.
    const newValue = {...scaled.value};
    const n = Object.values(value)[0]?.length ?? 0; // all channels have one value per row
    if (!hasAny(value, keysY)) [newValue[keysY[1]], newValue[keysY[0]]] = span(n, rangeY); // y outer, y1 inner
    if (!hasAny(value, keysX)) [newValue[keysX[0]], newValue[keysX[1]]] = span(n, rangeX);
    newValue.cx = Array.from({length: n}, () => cx);
    newValue.cy = Array.from({length: n}, () => cy);
    return {...withoutHints(scaled), value: newValue, scales, frame};
  });
}
