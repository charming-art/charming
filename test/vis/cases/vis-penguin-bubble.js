import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A bubble chart of Plot's penguins: culmen length against depth, one dot per penguin sized by its
// body mass and colored by its species. Like Plot's r scale, the radius is a square root of the
// mass from 0, so that a dot's area tracks it; its range is widened from Plot's default, which
// would make these masses 3 to 4px, so that the differences show. Legends of the species and the
// masses are in a column right of the chart.
export const visPenguinBubble = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins)
        .transform(cm.encode, {x: "culmen_length_mm", y: "culmen_depth_mm", r: "body_mass_g", fill: "species"})
        .transform(cm.plane, {marginRight: 130, scales: {r: {range: [0, 10]}}})
        .add(cm.axis, {grid: true})
        .add(cm.legend)
        .add(cm.circle, {fillOpacity: 0.5, stroke: "white", strokeWidth: 0.5});
    },
    {width: 640, height: 480},
  );
});
