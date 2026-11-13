import {pointsOnPath} from "points-on-path";
import {hachureLines} from "hachure-fill";
import {layoutNextLine} from "@chenglou/pretext";
import {prepareMemo} from "./prepareMemo.js";

function dist(line) {
  const [p1, p2] = line;
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function layoutTextInPath({
  text,
  fontSize = 16,
  fontFamily = "Inter",
  fontStyle = "normal",
  fontVariant = "normal",
  fontWeight = "normal",
  path,
  angle = 0,
  prepared = prepareMemo(text, {fontSize, fontFamily, fontStyle, fontVariant, fontWeight}),
  lineHeight = parseFloat(fontSize) * 1.5,
  repeat = true,
}) {
  const points = pointsOnPath(path);
  const lines = hachureLines(points, Math.round(lineHeight), angle);
  const space = prepared.discretionaryHyphenWidth;

  let cursor = {segmentIndex: 0, graphemeIndex: 0};

  const texts = [];

  place: for (const link of lines) {
    const width = dist(link);
    if (!width) continue;
    let currentWidth = 0;
    while (currentWidth < width) {
      const diffW = width - currentWidth;
      // One space for the text, one space for the space between text.
      if (diffW < space * 2) break;
      let text = layoutNextLine(prepared, cursor, diffW);
      if (text === null) {
        if (!repeat) break place;
        cursor = {segmentIndex: 0, graphemeIndex: 0};
        text = layoutNextLine(prepared, cursor, diffW);
      }
      cursor = text.end;
      const rotate = -angle;
      const r = currentWidth + text.width / 2;
      text.x = link[0][0] + r * Math.cos(degToRad(rotate));
      text.y = link[0][1] + r * Math.sin(degToRad(rotate));
      text.angle = rotate;
      text.lineHeight = lineHeight;
      texts.push(text);
      currentWidth += text.width + space;
    }
  }

  return {texts, lines, fontSize, fontFamily, fontStyle, fontVariant, fontWeight, path};
}
