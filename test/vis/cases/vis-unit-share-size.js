import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";
import {unitByClass} from "./unit-class.js";

// G2's unit chart with shareSize (https://g2.antv.antgroup.com/en/examples/unit/unit/share-size/):
// each panel's width is proportional to its number of passengers, with flex, so the dots have
// about the same size in every panel.
export const visUnitShareSize = withSVG(async () => {
  const passengers = await titanic();
  return renderFlow((root) => unitByClass(root, passengers, {flex: true}), {width: 640, height: 400});
});
