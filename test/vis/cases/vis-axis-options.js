import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Options shared by both axes (grid), and options for each axis (x label, y tick format).
export const visAxisOptions = withSVG(() => {
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
        .add(cm.axis, {grid: true, x: {label: "Weight (kg) →"}, y: {tickFormat: (d) => `${d}cm`}})
        .add(cm.circle, {r: 3});
    },
    {width: 640, height: 400},
  );
});
