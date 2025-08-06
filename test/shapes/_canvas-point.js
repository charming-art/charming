import * as cc from "../../src/index.js";
import { cell } from "../utils/cell.js";

function testDefaults(app) {
  app.append(cc.point, {});
}

function testDefaultPositions(app) {
  app.append(cc.point, { x: 100, y: 100 });
}

function testStrokeWidth(app) {
  app.append(cc.point, { x: 100, y: 100, strokeWidth: 50 });
}

function testStroke(app) {
  app.append(cc.point, { x: 100, y: 100, strokeWidth: 50, stroke: "orange" });
}

export function _canvasPoint() {
  return cell({
    cellWidth: 200,
    tests: [testDefaults, testDefaultPositions, testStrokeWidth, testStroke],
  });
}
