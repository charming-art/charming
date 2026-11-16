import {groupsOf, indexOf, reduceGroups, seriesKey} from "./reduce.js";

// Adapted from the group transform of Observable Plot (ISC license): groups the rows by the
// channels in keys, such as x, and by series, then turns each group into one row with outputs
// such as {y: "count"}. The groups keep their order of first appearance; spreadX or spreadY
// places them afterwards.
function groupOn(data, outputs, keys, name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  return data.map((context) => {
    const {value} = context;
    const z = seriesKey(value, outputs);
    const by = [...keys.filter((key) => key in value), ...(z ? [z] : [])];
    const groups = groupsOf(
      indexOf(context),
      by.map((key) => value[key]),
    );
    return reduceGroups(context, groups, by, outputs);
  });
}

// Groups the rows by x, such as the bars of a bar chart of counts.
export function groupX(flow, data, outputs = {y: "count"}) {
  return groupOn(data, outputs, ["x"], "groupX");
}

// Groups the rows by y, such as the bars of a horizontal bar chart of counts.
export function groupY(flow, data, outputs = {x: "count"}) {
  return groupOn(data, outputs, ["y"], "groupY");
}

// Groups the rows by x and y, such as the cells of a heatmap.
export function group(flow, data, outputs = {fill: "count"}) {
  return groupOn(data, outputs, ["x", "y"], "group");
}
