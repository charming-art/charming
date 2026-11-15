import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {dot, titanic} from "./titanic.js";

// GoFish's Titanic survival unit grid (https://gofish.graphics/js/examples/titanic-survival-unit-grid):
// the passengers by class and sex, each cell a chart nested in the bands of the grid, its
// passengers packed survivors first; the grids share the largest cell's layout, so the dots have
// the same size everywhere, like GoFish's fixed dots.
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
          x: {value: ([c]) => c, domain: [1, 2, 3]},
          y: {value: ([, s]) => s, domain: ["female", "male"]},
        })
        .transform(cm.spreadX, {padding: 0.15})
        .transform(cm.spreadY, {padding: 0.15})
        .transform(cm.plane, {marginLeft: 60})
        .add(cm.axis, {x: {label: "pclass"}, y: {label: "sex"}})
        .append(cm.group)
        .data(([, , rows]) => rows)
        .transform(cm.encode, {
          fill: {value: "survived", type: "ordinal", domain: [1, 0], range: ["#2b8cbe", "#ff8408"]},
        })
        .transform(cm.plane)
        .transform(cm.pack, {share: true})
        .add(cm.circle, dot);
    },
    {width: 640, height: 480},
  );
});
