import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {dot, groups} from "./titanic.js";

// G2's unit charts of the Titanic passengers by class
// (https://g2.antv.antgroup.com/en/examples/unit/unit/basic/): one panel per class, each a chart
// nested in its band, whose passengers are packed into a grid, colored by survival.
export function unitByClass(root, passengers, {flex, share} = {}) {
  root
    .data(
      groups(
        d3.sort(passengers, (d) => d.survived),
        (d) => d.pclass,
        [1, 2, 3],
      ),
    )
    .transform(cm.encode, {x: ([pclass]) => pclass, n: ([, rows]) => rows.length})
    .transform(cm.spreadX, {padding: 0.1, ...(flex && {flex: "n"})})
    .transform(cm.plane)
    .add(cm.axisX, {label: "pclass"})
    .append(cm.group)
    .data(([, rows]) => rows)
    .transform(cm.encode, {fill: {value: (d) => (d.survived ? "Yes" : "No"), domain: ["Yes", "No"]}})
    .transform(cm.plane)
    .transform(cm.pack, {share})
    .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
    .add(cm.circle, dot);
}
