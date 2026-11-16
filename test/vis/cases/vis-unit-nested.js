import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";

// G2's nested unit chart (https://g2.antv.antgroup.com/en/examples/unit/unit/nested/): the
// passengers by class, then by survival, then by sex, each level a chart nested in the bands of the
// one before, whose bands are proportional to their passengers with flex, so the dots have about
// the same size everywhere.
export const visUnitNested = withSVG(async () => {
  const passengers = d3.sort(
    await titanic(),
    (d) => d.survived,
    (d) => d.sex,
  );
  const survival = (d) => (d.survived ? "Yes" : "No");
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {y: {value: ([pclass]) => pclass, domain: [1, 2, 3]}, n: ([, rows]) => rows.length})
        .transform(cm.spreadY, {padding: 0.05, flex: "n"})
        .transform(cm.plane, {marginLeft: 85, marginBottom: 40})
        .add(cm.axisY, {label: "pclass", tickSize: 0, tickPadding: 50})
        .append(cm.g)
        .data(([, rows]) => d3.groups(rows, survival))
        .transform(cm.encode, {x: {value: ([s]) => s, domain: ["Yes", "No"]}, n: ([, rows]) => rows.length})
        .transform(cm.spreadX, {padding: 0.05, flex: "n"})
        .transform(cm.plane)
        .add(cm.axisX, {label: null})
        .append(cm.g)
        .data(([, rows]) => d3.groups(rows, (d) => d.sex))
        .transform(cm.encode, {y: ([sex]) => sex, n: ([, rows]) => rows.length})
        .transform(cm.spreadY, {padding: 0.05, flex: "n"})
        .transform(cm.plane)
        .add(cm.axisY, {label: null})
        .append(cm.g)
        .data(([, rows]) => rows)
        .transform(cm.encode, {fill: {value: survival, domain: ["Yes", "No"]}})
        .transform(cm.plane)
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 640},
  );
});
