import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The getting started example of G2 (https://g2.antv.antgroup.com/manual/introduction/getting-started),
// with four more genres so that the nine colors of the default scheme are all shown.
export const visGenreColumn = withSVG(() => {
  const data = [
    {genre: "Sports", sold: 275},
    {genre: "Strategy", sold: 115},
    {genre: "Action", sold: 120},
    {genre: "Shooter", sold: 350},
    {genre: "Other", sold: 150},
    {genre: "Racing", sold: 180},
    {genre: "Puzzle", sold: 60},
    {genre: "RPG", sold: 300},
    {genre: "Fighting", sold: 90},
  ];
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "genre", y: "sold", fill: "genre"})
        .transform(cm.spreadX)
        .transform(cm.plane)
        // The y axis is added before the bars, so that its grid lines are drawn behind them.
        .add(cm.axisY, {grid: true, tickFormat: (d) => `${d}k`})
        .add(cm.rect)
        .add(cm.axisX);
    },
    {width: 640, height: 400},
  );
});
