import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";
import {unitByClass} from "./unit-class.js";

// G2's basic unit chart (https://g2.antv.antgroup.com/en/examples/unit/unit/basic/): the panels have
// equal widths, so the dots are smaller where there are more passengers.
export const visUnitBasic = withSVG(async () => {
  const passengers = await titanic();
  return renderFlow((root) => unitByClass(root, passengers), {width: 640, height: 400});
});
