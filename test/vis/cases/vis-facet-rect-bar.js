import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {calendar, cells, days} from "./calendar.js";

// G2's rect-bar facet (https://g2.antv.antgroup.com/en/examples/composition/facet/rect-bar/): a
// calendar of June 2022 whose cells are bar charts of three activities. Each cell is a chart nested
// in the bands of days and weeks.
export const visFacetRectBar = withSVG(async () => {
  return renderFlow(
    (root) => {
      root
        .data(cells(calendar()))
        .transform(cm.encode, {x: {value: "day", domain: days}, y: "week"})
        .transform(cm.spreadX)
        .transform(cm.spreadY)
        .transform(cm.plane, {marginBottom: 50})
        .add(cm.axis, {x: {tickSize: 0, tickPadding: 24}, y: {tickSize: 0, tickPadding: 24}})
        .append(cm.group)
        .data((cell) => cell.rows)
        .transform(cm.encode, {x: "activity", y: "value", fill: "activity"})
        .transform(cm.spreadX)
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.axis);
    },
    {width: 800, height: 600},
  );
});
