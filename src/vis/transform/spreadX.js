import {InternMap, InternSet, sort} from "d3-array";

function isNumeric(values) {
  return typeof values?.find((d) => d != null) === "number";
}

// Places each distinct x in a band of [0, 1], like a d3 band scale.
function band(X, {domain = sort(new InternSet(X)), paddingInner, paddingOuter, align}) {
  const n = domain.length;
  const step = 1 / Math.max(1, n - paddingInner + paddingOuter * 2);
  const start = (1 - step * (n - paddingInner)) * align;
  const index = new InternMap(domain.map((d, i) => [d, start + step * i]));
  return [X.map((x) => index.get(x)), step * (1 - paddingInner)];
}

export function spreadX(flow, data, {padding = 0.1, paddingInner = padding, paddingOuter = padding, align = 0.5} = {}) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.spreadX.");
  return data.map((context) => {
    const {x: X, y: Y, y1: Y1} = context.value;
    // The domain of the x hint, if any, orders the bands.
    const [X0, bandwidth] = band(X, {domain: context.hints?.x?.domain, paddingInner, paddingOuter, align});
    const value = {...context.value, x: X0, x1: X0.map((x) => x + bandwidth)};
    if (Y1 === undefined && isNumeric(Y)) value.y1 = Y.map(() => 0);
    // The bands are in [0, 1], so the outer padding is kept when fitted.
    const hints = {...context.hints, x: {domain: [0, 1]}};
    return {...context, value, hints};
  });
}
