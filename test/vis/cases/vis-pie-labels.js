import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// G2's pie chart with spider labels (https://g2.antv.antgroup.com/en/examples/general/pie/spider-label/),
// after nivo's: the values in bold inside the wedges, black or white by the color of each wedge,
// and the ids just outside them, with their shares on a second line. G2's spider lines are left
// out, so the ids sit beside their wedges. Above the center, outside labels sit above their point,
// so the id goes up a line and the share takes its place, keeping both lines off the pie.
export const visPieLabels = withSVG(async () => {
  const data = [
    {id: "c", value: 526},
    {id: "sass", value: 220},
    {id: "php", value: 325},
    {id: "elixir", value: 561},
    {id: "rust", value: 54},
  ];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const outside = {position: "outside", padding: 10, fontWeight: "bold"};
  // Whether the middle of a wedge is above the center: its angle, clockwise from 12 o'clock.
  const above = (d) => Math.cos((d.x + d.x1) / 2) > 0.3;
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "value", fill: "id"})
        .transform(cm.stackX)
        .transform(cm.polar, {
          innerRadius: 0.25,
          scales: {
            fill: {
              domain: data.map((d) => d.id),
              range: ["#e8c1a0", "#f47560", "#f1e15b", "#e8a838", "#61cdbb"],
            },
          },
        })
        .add(cm.arc, {cornerRadius: 4, stroke: "#fff", strokeWidth: 2})
        .add(cm.label, {
          text: (d) => d.datum.value,
          position: "inside",
          padding: 14,
          fontWeight: "bold",
          contrast: true,
        })
        .add(cm.label, {...outside, text: (d) => d.datum.id, dy: (d) => (above(d) ? -12 : 0)})
        .add(cm.label, {
          ...outside,
          text: (d) => d.datum.value / total,
          format: ".0%",
          dy: (d) => (above(d) ? 0 : 12),
          fontWeight: null,
        });
    },
    {width: 500, height: 400},
  );
});
