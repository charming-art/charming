import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";

// G2's basic unit chart (https://g2.antv.antgroup.com/en/examples/unit/unit/basic/): one panel per
// class, each a chart nested in its band, whose passengers are packed into a grid, colored by
// survival. The panels have equal widths, so the dots are smaller where there are more passengers.
export const visUnitBasic = withSVG(async () => {
  const passengers = d3.sort(await titanic(), (d) => d.survived);
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {x: ([pclass]) => pclass, n: ([, rows]) => rows.length})
        .transform(cm.spreadX, {padding: 0.1})
        .transform(cm.plane, {x: {label: "pclass"}})
        .append(cm.g)
        .data(([, rows]) => rows)
        .transform(cm.encode, {fill: (d) => (d.survived ? "Yes" : "No")})
        .transform(cm.plane, {fill: {domain: ["Yes", "No"]}})
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 400},
  );
});
