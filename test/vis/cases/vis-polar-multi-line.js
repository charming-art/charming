import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {stocks} from "./stocks.js";

// The labeled multi-line chart in polar coordinates, without labels: time is the angle and the
// closing price the radius, on a linear scale so that the lines keep their shape.
export const visPolarMultiLine = withSVG(async () => {
  const data = await stocks();
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "Date", y: "Close", stroke: "Symbol"})
        .transform(cm.polar, {innerRadius: 0.2, x: {axis: "outer"}, y: {type: "linear"}})
        .add(cm.lineRadial);
    },
    {width: 640, height: 640},
  );
});
