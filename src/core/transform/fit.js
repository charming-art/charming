import {domainOf, point, scale} from "./scale.js";

// The keys share one domain, inferred from all their values unless specified.
function channels(value, keys, {scale, domain, range}) {
  keys = keys.filter((key) => key in value);
  const V = keys.flatMap((key) => value[key]);
  if (domain === undefined) domain = domainOf(scale, V);
  return keys.map((key) => [key, {scale, domain, range}]);
}

function fitContext(
  flow,
  context,
  {width, height},
  {
    scaleX,
    scaleY,
    domainX,
    domainY,
    reverseY = false,
    reverseX = false,
    padding = 0,
    marginTop = padding,
    marginRight = padding,
    marginBottom = padding,
    marginLeft = padding,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  },
) {
  const {value} = context;
  const rangeX = [marginLeft, width - marginRight];
  const rangeY = [marginTop, height - marginBottom];

  if (reverseX) rangeX.reverse();
  if (reverseY) rangeY.reverse();

  const X = channels(value, keysX, {scale: scaleX, domain: domainX, range: rangeX});
  const Y = channels(value, keysY, {scale: scaleY, domain: domainY, range: rangeY});

  return scale(flow, [context], Object.fromEntries([...X, ...Y]), point)[0];
}

export function fit(flow, data, options = {}) {
  if (!data) throw new Error("No channels: call flow.transform(cm.bind, channels) before cm.fit.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.fit.");
  return data.map((context) => fitContext(flow, context, renderer._props, {...context.fit, ...options}));
}
