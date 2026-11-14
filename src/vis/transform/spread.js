import {InternSet, sort} from "d3-array";
import {scaleBand} from "d3-scale";

function isNumeric(values) {
  return typeof values?.find((d) => d != null) === "number";
}

// Places each distinct value in a band of [0, 1] with a d3 band scale.
function band(V, {domain = sort(new InternSet(V)), paddingInner, paddingOuter, align}) {
  const scale = scaleBand(domain, [0, 1]).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  return [V.map(scale), scale.bandwidth(), scale.domain()];
}

// Gives each category of a position, such as x, a band from x to x1, ordered by the domain of
// its hint. The other position, such as y, gets a baseline of 0 if it's numeric and its y1 isn't
// bound, so that bars span from 0 to their values.
function spread(
  data,
  {padding = 0.1, paddingInner = padding, paddingOuter = padding, align = 0.5} = {},
  [key, key1, other, other1],
  name,
) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  return data.map((context) => {
    const {[key]: V, [other]: O, [other1]: O1} = context.value;
    const {label, domain} = context.hints?.[key] ?? {};
    const [V0, bandwidth, categories] = band(V, {domain, paddingInner, paddingOuter, align});
    const value = {...context.value, [key]: V0, [key1]: V0.map((v) => v + bandwidth)};
    if (O1 === undefined && isNumeric(O)) value[other1] = O.map(() => 0);
    // The bands are in [0, 1], so the outer padding is kept when fitted. The band is kept for
    // axes, which label the categories.
    const hint = {domain: [0, 1], band: {domain: categories, paddingInner, paddingOuter, align}};
    const hints = {...context.hints, [key]: label === undefined ? hint : {label, ...hint}};
    return {...context, value, hints};
  });
}

// Bands for the categories of x, such as the columns of a bar chart.
export function spreadX(flow, data, options) {
  return spread(data, options, ["x", "x1", "y", "y1"], "spreadX");
}

// Bands for the categories of y, such as the bars of a horizontal bar chart.
export function spreadY(flow, data, options) {
  return spread(data, options, ["y", "y1", "x", "x1"], "spreadY");
}
