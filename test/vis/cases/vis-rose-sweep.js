import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The rose of visRose with its wedges drawn halfway from their start angles with sweep, as a wheel
// shows them halfway as they enter.
export const visRoseSweep = withSVG(async () => {
  const data = await d3.csv("data/rose.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "name", y: "value", fill: "name"})
        .transform(cm.spreadX)
        .transform(cm.polar, {x: {axis: true}, y: {axis: true}})
        .add(cm.arc, {sweep: 0.5});
    },
    {width: 640, height: 640},
  );
});
