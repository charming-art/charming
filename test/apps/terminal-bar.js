import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";

function barX(
  flow,
  {
    x: X,
    y: Y,
    width,
    height,
    step,
    ticks,
    title,
    colors = ["#CC4A6A", "#6EBD41", "#D6B152", "#56ADD3", "#AC5ADA", "#7DDEBB"],
  },
) {
  const [data] = flow.data();
  const scaleX = cc.scaleLinear([0, 2.0], [0, width]);

  // Title.
  flow.datum(0).append(cc.text, {
    text: title,
    x: width / 2,
    y: -1,
    textAlign: "center",
    textBaseline: "bottom",
  });

  // Axis.
  const axis = flow
    .datum(0)
    .append(cc.group, {
      x: 0,
      y: height,
    })
    .data(ticks);

  axis.append(cc.link, {
    x: (d) => scaleX(d),
    x1: (d) => scaleX(d),
    y: 0,
    y1: -height - 1,
    stroke: cc.cfb(":"),
  });

  axis.datum(0).append(cc.link, {
    x: 0,
    x1: width,
    y: 0,
    y1: 0,
    stroke: cc.cfb("-"),
  });

  axis.append(cc.text, {
    text: (d) => (d ? d.toFixed(1) + "" : d),
    textAlign: "center",
    y: 1,
    x: (d) => scaleX(d),
  });

  // Bars.
  flow.data(data).append(cc.rect, {
    x: scaleX(0),
    y: Y.map((y) => y * step),
    width: X.map(scaleX),
    height: step - 1,
    fill: (_, i) => cc.cfb("#", colors[i % colors.length]),
  });
}

export async function terminalBar() {
  const data = [1.9, 1.9, 1.6, 1.0, 0.4, 0.1];

  // Dimensions.
  const step = 3;
  const marginX = 3;
  const marginY = 3;
  const plotWidth = 60;
  const plotHeight = step * data.length;
  const height = plotHeight + marginY * 2;
  const width = plotWidth + marginX * 2;

  const app = cc.app({
    renderer: await cc.terminal(),
    cols: width,
    rows: height,
  });

  // Bar Chart.
  app
    .append(cc.group, { x: marginX, y: marginY })
    .data(data)
    .append(barX, {
      x: (d) => d,
      y: (_, i) => i,
      step: cc.constant(step),
      width: cc.constant(plotWidth),
      height: cc.constant(plotHeight),
      title: cc.constant("Bar Chart, Terminal"),
      ticks: cc.constant([0, 0.5, 1.0, 1.5, 2.0]),
    });

  // Annotation.
  app.append(cc.text, {
    x: marginX + plotWidth,
    y: marginY + plotHeight,
    text: cc.figlet("2023"),
    textBaseline: "bottom",
    textAlign: "end",
  });

  return app.call(dispose).render().node();
}
