import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// G2's 2d unit chart (https://g2.antv.antgroup.com/en/examples/unit/unit/2d/): the passengers and
// crew of the Titanic by class and sex, each cell a chart nested in the bands of the grid, its
// people packed and colored by survival.
export const visUnit2d = withSVG(async () => {
  const people = d3.sort(await d3.json("data/titanic2.json"), (d) => (d.Survived === "Yes" ? 0 : 1));
  const cells = d3
    .groups(
      people,
      (d) => d.Class,
      (d) => d.Sex,
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
        .transform(cm.spreadX, {domain: ["First", "Second", "Third", "Crew"]})
        .transform(cm.spreadY, {domain: ["Female", "Male"]})
        .transform(cm.plane, {x: {label: null}, y: {label: null}})
        .append(cm.g)
        .data(([, , rows]) => rows)
        .transform(cm.encode, {fill: "Survived"})
        .transform(cm.plane, {fill: {domain: ["Yes", "No"]}})
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, cm.inset("7.5%"));
    },
    {width: 640, height: 400},
  );
});
