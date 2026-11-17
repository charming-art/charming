import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";

// G2's unit chart with shareSize (https://g2.antv.antgroup.com/en/examples/unit/unit/share-size/):
// each panel's width is proportional to its number of passengers, with flex, so the dots have
// about the same size in every panel.
export const visUnitShareSize = withSVG(async () => {
  const passengers = d3.sort(await titanic(), (d) => d.survived);
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {x: ([pclass]) => pclass, n: ([, rows]) => rows.length})
        .transform(cm.spreadX, {padding: 0.1, flex: "n"})
        .transform(cm.plane)
        .add(cm.axisX, {label: "pclass"})
        .append(cm.g)
        .data(([, rows]) => rows)
        .transform(cm.encode, {fill: (d) => (d.survived ? "Yes" : "No")})
        .transform(cm.plane, {scales: {fill: {domain: ["Yes", "No"]}}})
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 400},
  );
});
