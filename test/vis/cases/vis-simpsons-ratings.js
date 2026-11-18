import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's Simpsons ratings (https://observablehq.com/@observablehq/plot-simpsons-ratings): the IMDb
// rating of each episode by season, in cells colored with PiYG and labeled with their ratings,
// which cm.label centers in the cells, and the seasons along the top, with a ramp of the ratings
// right of the chart. Like Plot, the episodes
// without a rating are left out.
export const visSimpsonsRatings = withSVG(async () => {
  const simpsons = (await d3.csv("data/simpsons.csv", d3.autoType)).filter((d) => d.imdb_rating != null);
  return renderFlow(
    (root) => {
      root
        .data(simpsons)
        .transform(cm.encode, {
          x: "season",
          y: "number_in_season",
          fill: "imdb_rating",
        })
        .transform(cm.spreadX, {padding: 0})
        .transform(cm.spreadY, {padding: 0})
        .transform(cm.plane, {
          marginBottom: 10,
          marginRight: 140,
          x: {axis: "top", label: "Season", grid: true},
          y: {label: "Episode", grid: true},
          fill: {type: "linear", scheme: "PiYG", label: "IMDb rating", legend: true},
        })
        .add(cm.rect, cm.inset(0.5))
        .add(cm.label, {text: (d) => d.datum.imdb_rating.toFixed(1), fill: "black"});
    },
    {width: 640, height: 560},
  );
});
