import {max, range} from "d3-array";

// The grid of square cells for count rows in a frame of the given size, like G2's pack: as many
// columns as fit the frame's aspect, more until the rows fit its height.
function gridOf(count, width, height) {
  const aspect = height / width;
  let cols = Math.max(1, Math.ceil(Math.sqrt(count / aspect)));
  let size = width / cols;
  while (Math.ceil(count / cols) * size > height) size = width / ++cols;
  return {cols, size};
}

// Packs the rows of each context into a grid of square cells filling its frame, such as the dots
// of a unit chart in each facet: row by row from the bottom left, in input order. Each row gets its
// cell as x, x1, y and y1. With share, every grid is laid out for the largest count, like G2's
// shareData, so that frames of the same size get the same cells.
export function pack(flow, data, {share = false} = {}) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.pack.");
  const indexOf = ({I, group}) => I ?? range(group.length);
  const shared = share ? max(data, (context) => indexOf(context).length) : undefined;
  return data.map((context) => {
    const {frame, group, value} = context;
    if (!frame) return context;
    const I = indexOf(context);
    const {left, right, top, bottom} = frame;
    const {cols, size} = gridOf(shared ?? I.length, right - left, bottom - top);
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
