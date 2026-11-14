import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Continuous x and y axes, with labels that point to increasing values.
export const visScatterAxis = withSVG(() => {
  const data = [
    {weight: 3.2, height: 41},
    {weight: 4.8, height: 52},
    {weight: 5.5, height: 49},
    {weight: 6.1, height: 63},
    {weight: 7.4, height: 70},
  ];
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "weight", y: "height"})
        .transform(cm.plane)
        .add(cm.circle, {r: 3})
        .add(cm.axis);
    },
    {width: 640, height: 400},
  );
});
