import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// G2's circle facet (https://g2.antv.antgroup.com/en/examples/composition/facet/circle/): twelve
// months around a circle, each a bar chart of four values. The months are bands of a polar chart,
// and each bar chart is a chart nested at its month.
export const visFacetCircle = withSVG(async () => {
  const random = d3.randomUniform.source(d3.randomLcg(0.42))();
  const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  const data = months.flatMap((month) => ["A", "B", "C", "D"].map((name) => ({month, name, value: random()})));
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(data, (d) => d.month))
        .transform(cm.encode, {x: {value: ([month]) => month, domain: months}})
        .transform(cm.spreadX)
        .transform(cm.polar, {innerRadius: 0.7})
        .add(cm.axisX)
        .append(cm.group)
        .data(([, rows]) => rows)
        .transform(cm.encode, {x: "name", y: "value", fill: "name"})
        .transform(cm.spreadX)
        .transform(cm.plane, {width: 60, height: 60})
        .add(cm.rect);
    },
    {width: 480, height: 480},
  );
});
