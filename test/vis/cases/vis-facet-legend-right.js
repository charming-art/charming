import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {calendar, cells, days} from "./calendar.js";

// The calendar of pies of visFacetRectPie, with the legend of the activities on the right of the
// grid: the pies are charts nested in its cells, so their legend is drawn once for all of them.
export const visFacetLegendRight = withSVG(async () => {
  return renderFlow(
    (root) => {
      root
        .data(cells(calendar()))
        .transform(cm.encode, {x: "day", y: "week"})
        .transform(cm.spreadX, {domain: days})
        .transform(cm.spreadY)
        .transform(cm.plane)
        .append(cm.g)
        .data((cell) => cell.rows)
        .transform(cm.encode, {x: "value", fill: "activity"})
        .transform(cm.stackX)
        .transform(cm.polar, {resolve: {x: "independent"}, fill: {legend: "right"}})
        .add(cm.arc, {stroke: "white"});
    },
    {width: 800, height: 500},
  );
});
