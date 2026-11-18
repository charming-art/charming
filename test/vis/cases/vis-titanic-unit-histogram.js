import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's Titanic unit histogram (https://gofish.graphics/js/examples/titanic-unit-histogram): one
// panel per class, each a histogram of age by decade whose bars are rows of 3 passengers, colored
// by survival. Each panel is a chart nested in a band of the classes, with its own bins; rows of
// passengers are stacked in data units, so they have the same height in every panel.
export const visTitanicUnitHistogram = withSVG(async () => {
  const titanic = await d3.csv("data/titanic3.csv", d3.autoType);
  const decade = (d) => Math.floor(d.age / 10) * 10;
  const passengers = titanic.filter((d) => d.age != null);
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(passengers, (d) => d.pclass))
        .transform(cm.encode, {x: ([pclass]) => pclass})
        .transform(cm.spreadX, {padding: 0.1})
        .transform(cm.plane, {marginTop: 20, x: {label: "pclass", tickSize: 0, tickPadding: 24}})
        .append(cm.g)
        .data(([, rows]) => d3.sort(rows, decade, (d) => -d.survived))
        .transform(cm.encode, {
          x: decade,
          y: 1,
          fill: "survived",
        })
        .transform(cm.spreadX)
        .transform(cm.stackY, {chunk: 3, order: [1, 0]})
        .transform(cm.plane, {fill: {type: "ordinal", range: ["#2b8cbe", "#ff8408"]}})
        .add(cm.circle, {r: 2.5}) // centered in its cell
        .add(cm.axisX);
    },
    {width: 800, height: 600},
  );
});
