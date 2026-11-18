import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {replay} from "./replay.js";

// G2's point keyframe (https://g2.antv.antgroup.com/en/examples/storytelling/storytelling/point-keyframe/):
// a bar per gender at its mean weight, then a point per person, back and forth. The bars are keyed
// by gender and the points grouped by it, so each bar splits into equal pieces, one per person,
// that morph into its points, and the points morph back into the pieces of their bar to merge.
export async function visTransitionPointKeyframe() {
  const people = await d3.json("data/people.json");
  const renderer = cm.svg({width: 640, height: 480});
  const root = cm.flow({transition: {duration: 1000, direction: "alternate", iterations: 4}}).renderer(renderer);
  const draw = () => {
    root
      .append(cm.keyframe)
      .data(people)
      .transform(cm.encode, {x: "gender", y: "weight", fill: "gender", key: "gender"})
      .transform(cm.groupX, {y: "mean"})
      .transform(cm.spreadX)
      .transform(cm.plane)
      .add(cm.rect);
    root
      .append(cm.keyframe)
      .data(people)
      .transform(cm.encode, {x: "height", y: "weight", fill: "gender", groupKey: "gender"})
      .transform(cm.plane)
      .add(cm.circle, {r: 3, fillOpacity: 0.7});
  };
  return replay(renderer.node(), root, draw);
}
