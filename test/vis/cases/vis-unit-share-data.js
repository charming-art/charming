import {renderFlow, withSVG} from "../../helpers.js";
import {titanic} from "./titanic.js";
import {unitByClass} from "./unit-class.js";

// G2's unit chart with shareData (https://g2.antv.antgroup.com/en/examples/unit/unit/share-data/):
// every panel's grid is laid out for the largest class, with pack's share, so the dots have the
// same size and the smaller classes fill only part of their panels.
export const visUnitShareData = withSVG(async () => {
  const passengers = await titanic();
  return renderFlow((root) => unitByClass(root, passengers, {share: true}), {width: 640, height: 400});
});
