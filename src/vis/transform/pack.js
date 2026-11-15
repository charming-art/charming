import {min, range} from "d3-array";

// The grid of square cells for count rows in a frame of the given size, like G2's pack: as many
// columns as fit the frame's aspect, more until the rows fit its height.
function gridOf(count, width, height) {
  const aspect = height / width;
  let cols = Math.max(1, Math.ceil(Math.sqrt(count / aspect)));
  let size = width / cols;
  while (Math.ceil(count / cols) * size > height) size = width / ++cols;
  return {cols, size};
}

// The largest size of square cells that fits count rows in a frame of the given size: the best of
// every number of columns.
function largestSize(count, width, height) {
  let best = 0;
  for (let cols = 1; cols <= Math.max(1, count); ++cols) {
    best = Math.max(best, Math.min(width / cols, height / Math.ceil(count / cols)));
  }
  return best;
}

// Packs the rows of each context into a grid of square cells filling its frame, such as the dots
// of a unit chart in each facet: row by row from the bottom left, in input order. Each row gets its
// cell as x, x1, y and y1. With share, every context's cells have the same size: the largest that
// fits every context's rows in its frame, so that the dots are equal even in frames of different
// sizes, such as the cells of flex bands. In frames of the same size, it's the size of the largest
// count, like G2's shareData.
export function pack(flow, data, {share = false} = {}) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.pack.");
  const indexOf = ({I, group}) => I ?? range(group.length);
  const sizeOf = ({frame: {left, right, top, bottom}}, n) => largestSize(n, right - left, bottom - top);
  const framed = data.filter((context) => context.frame);
  const shared = share ? min(framed, (context) => sizeOf(context, indexOf(context).length)) : undefined;
  return data.map((context) => {
    const {frame, group, value} = context;
    if (!frame) return context;
    const I = indexOf(context);
    const {left, right, top, bottom} = frame;
    const {cols, size} =
      shared === undefined
        ? gridOf(I.length, right - left, bottom - top)
        : {cols: Math.max(1, Math.floor((right - left) / shared + 1e-9)), size: shared};
    const n = group.length;
    const [X, X1, Y, Y1] = [0, 1, 2, 3].map(() => new Array(n).fill(NaN));
    I.forEach((i, m) => {
      X[i] = left + (m % cols) * size;
      X1[i] = X[i] + size;
      Y1[i] = bottom - Math.floor(m / cols) * size;
      Y[i] = Y1[i] - size;
    });
    return {...context, value: {...value, x: X, x1: X1, y: Y, y1: Y1}};
  });
}
