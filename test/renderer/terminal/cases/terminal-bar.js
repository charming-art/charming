import * as cm from "../../../../src/index.js";
import {renderTerminal} from "../../../helpers.js";

// A composite shape with settings for the whole chart: barX(settings) returns the shape,
// which receives the channels evaluated for each datum.
const barX =
  ({width, height, step, ticks, title, colors = ["#CC4A6A", "#6EBD41", "#D6B152", "#56ADD3", "#AC5ADA", "#7DDEBB"]}) =>
  (flow, {x: X, y: Y}) => {
    const [data] = flow.data();
    const scaleX = (d) => (d / 2) * width;

    // Title.
    flow.datum(0).append(cm.text, {
      text: title,
      x: width / 2,
      y: -1,
      textAlign: "center",
      textBaseline: "bottom",
    });

    // Axis.
    const axis = flow
      .datum(0)
      .append(cm.group, {
        x: 0,
        y: height,
      })
      .data(ticks);

    axis.append(cm.link, {
      x: (d) => scaleX(d),
      x1: (d) => scaleX(d),
      y: 0,
      y1: -height - 1,
      stroke: {ch: ":"},
    });

    axis.datum(0).append(cm.link, {
      x: 0,
      x1: width,
      y: 0,
      y1: 0,
      stroke: {ch: "-"},
    });

    axis.append(cm.text, {
      text: (d) => (d ? d.toFixed(1) + "" : d),
      textAlign: "center",
      y: 1,
      x: (d) => scaleX(d),
    });

    // Bars.
    flow.data(data).append(cm.rect, {
      x: scaleX(0),
      y: Y.map((y) => y * step),
      width: X.map(scaleX),
      height: step - 1,
      fill: (_, i) => ({ch: "#", fg: colors[i % colors.length]}),
    });
  };

export function terminalBar() {
  const data = [1.9, 1.9, 1.6, 1.0, 0.4, 0.1];

  // Dimensions.
  const step = 3;
  const marginX = 3;
  const marginY = 3;
  const plotWidth = 60;
  const plotHeight = step * data.length;
  const height = plotHeight + marginY * 2;
  const width = plotWidth + marginX * 2;

  return renderTerminal(
    (root) => {
      // Bar Chart.
      root
        .append(cm.group, {x: marginX, y: marginY})
        .data(data)
        .append(
          barX({
            step,
            width: plotWidth,
            height: plotHeight,
            title: "Bar Chart, Terminal",
            ticks: [0, 0.5, 1.0, 1.5, 2.0],
          }),
          {x: (d) => d, y: (_, i) => i},
        );

      // Annotation.
      root.append(cm.figlet, {
        x: marginX + plotWidth,
        y: marginY + plotHeight,
        text: "2023",
        textBaseline: "bottom",
        textAlign: "end",
      });
    },
    {cols: width, rows: height},
  );
}
