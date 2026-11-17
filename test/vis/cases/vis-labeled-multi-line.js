import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";
import {stocks} from "./stocks.js";

// Plot's labeled multi-line chart (https://observablehq.com/@observablehq/plot-labeled-multi-line-chart),
// without its labels: the closing prices of four stocks, one colored line per symbol.
export const visLabeledMultiLine = withSVG(async () => {
  const data = await stocks();
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "Date", y: "Close", stroke: "Symbol"})
        .transform(cm.plane, {y: {grid: true}})
        .add(cm.lineY);
    },
    {width: 640, height: 400},
  );
});
