import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";

// GoFish's Titanic survival unit grid (https://gofish.graphics/js/examples/titanic-survival-unit-grid):
// the passengers by class and sex, each cell a chart nested in the bands of the grid, its
// passengers packed survivors first.
export const visTitanicSurvivalGrid = withSVG(async () => {
  const passengers = d3.sort(await titanic(), (d) => -d.survived);
  const cells = d3
    .groups(
      passengers,
      (d) => d.pclass,
      (d) => d.sex,
    )
    .flatMap(([c, sexes]) => sexes.map(([s, rows]) => [c, s, rows]));
  return renderFlow(
    (root) => {
      root
        .data(cells)
        .transform(cm.encode, {
          x: ([c]) => c,
          y: ([, s]) => s,
        })
        .transform(cm.spreadX, {padding: 0.15, domain: [1, 2, 3]})
        .transform(cm.spreadY, {padding: 0.15, domain: ["female", "male"]})
        .transform(cm.plane, {marginLeft: 60})
        .add(cm.axis, {x: {label: "pclass"}, y: {label: "sex"}})
        .append(cm.g)
        .data(([, , rows]) => rows)
        .transform(cm.encode, {fill: "survived"})
        .transform(cm.plane, {scales: {fill: {type: "ordinal", domain: [1, 0], range: ["#2b8cbe", "#ff8408"]}}})
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 480},
  );
});
