import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {dot, titanic} from "./titanic.js";

// GoFish's Titanic unit mosaic (https://gofish.graphics/js/examples/titanic-unit-mosaic), the
// headline chart of Atom: class rows, sex rows within them, and survival columns within those,
// each level a chart nested in the bands of the one before, proportional to its passengers with
// flex; every cell packs its passengers, so the cells' areas read as the counts and the dots have
// about the same size.
export const visTitanicMosaic = withSVG(async () => {
  const passengers = await titanic();
  const n = ([, rows]) => rows.length;
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {y: {value: ([pclass]) => pclass, domain: [3, 2, 1]}, n})
        .transform(cm.spreadY, {padding: 0.05, flex: "n"})
        .transform(cm.plane, {margin: 10})
        .append(cm.group)
        .data(([, rows]) => d3.groups(rows, (d) => d.sex))
        .transform(cm.encode, {y: {value: ([sex]) => sex, domain: ["male", "female"]}, n})
        .transform(cm.spreadY, {padding: 0.06, flex: "n"})
        .transform(cm.plane)
        .append(cm.group)
        .data(([, rows]) => d3.groups(rows, (d) => d.survived))
        .transform(cm.encode, {x: {value: ([s]) => s, domain: [1, 0]}, n})
        .transform(cm.spreadX, {padding: 0.03, flex: "n"})
        .transform(cm.plane)
        .append(cm.group)
        .data(([, rows]) => rows)
        .transform(cm.encode, {
          fill: {value: "survived", type: "ordinal", domain: [1, 0], range: ["#2b8cbe", "#ff8408"]},
        })
        .transform(cm.plane)
        .transform(cm.pack)
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, dot);
    },
    {width: 640, height: 480},
  );
});
