import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";

// G2's unit chart with shareData (https://g2.antv.antgroup.com/en/examples/unit/unit/share-data/):
// every panel's grid is laid out for the largest class, with pack's share, so the dots have the
// same size and the smaller classes fill only part of their panels.
export const visUnitShareData = withSVG(async () => {
  const passengers = d3.sort(await titanic(), (d) => d.survived);
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {x: ([pclass]) => pclass, n: ([, rows]) => rows.length})
        .transform(cm.spreadX, {padding: 0.1})
        .transform(cm.plane)
        .add(cm.axisX, {label: "pclass"})
        .append(cm.g)
        .data(([, rows]) => rows)
        .transform(cm.encode, {fill: {value: (d) => (d.survived ? "Yes" : "No"), domain: ["Yes", "No"]}})
        .transform(cm.plane)
        .transform(cm.pack, {share: true})
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 400},
  );
});
