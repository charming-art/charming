import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's penguins with the options of scales that change their values and domains: the body mass
// in kilograms with transform, from zero and to round values with zero and nice, and the culmen
// length in a domain of 35 to 50 mm with clamp, so that longer culmens sit on the right edge rather
// than past it.
export const visScaleOptions = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins.filter((d) => d.body_mass_g !== null))
        .transform(cm.encode, {x: "culmen_length_mm", y: "body_mass_g"})
        .transform(cm.plane, {
          x: {domain: [35, 50], clamp: true},
          y: {transform: (d) => d / 1000, label: "Body mass (kg)", zero: true, nice: true, grid: true},
        })
        .add(cm.circle, {r: 2.5, fillOpacity: 0.6});
    },
    {width: 640, height: 400},
  );
});
