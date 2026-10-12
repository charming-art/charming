import {mapAttrs} from "./mapAttrs.js";

export function mapPosition(
  flow,
  data,
  {
    scaleX,
    scaleY,
    domainX,
    domainY,
    reverseY = false,
    reverseX = false,
    padding = 0,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.mapPosition.");
  const {width, height} = renderer._props;
  const rangeX = [padding, width - padding];
  const rangeY = [padding, height - padding];

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

  return mapAttrs(flow, data, Object.fromEntries([...X, ...Y]));
}
