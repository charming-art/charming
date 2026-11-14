import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow} from "../../helpers.js";

export async function visLetterFrequencyColumn() {
  const alphabet = await d3.csv("data/alphabet.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(alphabet)
        .transform(cm.encode, {x: "letter", y: "frequency"})
        .transform(cm.spreadX)
        .transform(cm.fit)
        .add(cm.rect);
    },
    {width: 640, height: 400},
  );
}
