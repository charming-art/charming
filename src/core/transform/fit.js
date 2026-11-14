import {point, scale} from "./scale.js";

export function fit(
  flow,
  data,
  {
    scaleX,
    scaleY,
    domainX,
    domainY,
    reverseY = false,
    reverseX = false,
    margin = 0,
    marginTop = margin,
    marginRight = margin,
    marginBottom = margin,
    marginLeft = margin,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.bind, channels) before cm.fit.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.fit.");
  const {width, height} = renderer._props;
  const rangeX = [marginLeft, width - marginRight];
  const rangeY = [marginTop, height - marginBottom];

  if (reverseX) rangeX.reverse();
  if (reverseY) rangeY.reverse();

  const X = keysX.map((key) => [
    key,
    {
      domain: domainX,
      range: rangeX,
      scale: scaleX,
    },
  ]);

  const Y = keysY.map((key) => [
    key,
    {
      domain: domainY,
      range: rangeY,
      scale: scaleY,
    },
  ]);

  return scale(flow, data, Object.fromEntries([...X, ...Y]), point);
}
