import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {calendar, cells, days} from "./calendar.js";

// G2's rect-pie facet (https://g2.antv.antgroup.com/en/examples/composition/facet/rect-pie/): the
// calendar of June 2022 whose cells are pies of three activities. Each pie is a full turn: its
// angle is independent of the other cells.
export const visFacetRectPie = withSVG(async () => {
  return renderFlow(
    (root) => {
      root
        .data(cells(calendar()))
        .transform(cm.encode, {x: "day", y: "week"})
        .transform(cm.spreadX, {domain: days})
        .transform(cm.spreadY)
        .transform(cm.plane)
        .add(cm.axis)
        .append(cm.g)
        .data((cell) => cell.rows)
        .transform(cm.encode, {x: "value", fill: "activity"})
        .transform(cm.stackX)
        .transform(cm.polar, {resolve: {x: "independent"}})
        .add(cm.arc, {stroke: "white"});
    },
    {width: 800, height: 500},
  );
});
