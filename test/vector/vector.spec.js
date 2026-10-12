import * as cm from "../../src/index.js";
import {describe, expect, test} from "vitest";

describe("vector", () => {
  test("cm.vec()", () => {
    const v = cm.vec();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  test("cm.vec(x, y)", () => {
    const v = cm.vec(1, 2);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
  });
});

describe("add", () => {
  test("cm.vecAdd(a, b)", () => {
    const a = cm.vec(1, 2);
    const b = cm.vec(2, 3);
    const out = cm.vecAdd(a, b);
    expect(out.x).toBe(3);
    expect(out.y).toBe(5);
  });

  test("vec.add(a)", () => {
    const a = cm.vec(1, 2);
    const b = cm.vec(2, 3);
    expect(a.add(b)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(5);
    expect(b.x).toBe(2);
    expect(b.y).toBe(3);
  });
});

describe("angle", () => {
  test("cm.vecAngle(a)", () => {
    const a = cm.vec(1, 1);
    expect(cm.vecAngle(a)).toBeCloseTo(Math.PI / 4);
    expect(a.x).toBe(1);
    expect(a.y).toBe(1);
  });

  test("vec.angle()", () => {
    const a = cm.vec(1, 1);
    expect(a.angle()).toBeCloseTo(Math.PI / 4);
    expect(a.x).toBe(1);
    expect(a.y).toBe(1);
  });
});

describe("clamp", () => {
  test("cm.vecClamp(a, max)", () => {
    const a = cm.vec(6, 8);
    const b = cm.vecClamp(a, 5);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(3);
    expect(b.y).toBe(4);
  });

  test("cm.vecClamp(a, min, max)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vecClamp(a, 10, 15);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.clamp(max)", () => {
    const a = cm.vec(6, 8);
    expect(a.clamp(5)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.clamp(min, max)", () => {
    const a = cm.vec(3, 4);
    expect(a.clamp(10, 15)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });
});

describe("clone", () => {
  test("vec.clone()", () => {
    const a = cm.vec(3, 4);
    const b = a.clone();
    b.set(1, 2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("cross", () => {
  test("cm.vecCross(a, b)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vec(1, 2);
    expect(cm.vecCross(a, b)).toBe(2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("vec.cross(a)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vec(1, 2);
    expect(a.cross(b)).toBe(2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("dist", () => {
  test("cm.vecDist(a, b)", () => {
    const a = cm.vec(4, 6);
    const b = cm.vec(1, 2);
    expect(cm.vecDist(a, b)).toBe(5);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cm.vecDist2(a)", () => {
    const a = cm.vec(4, 6);
    const b = cm.vec(1, 2);
    expect(cm.vecDist2(a, b)).toBe(25);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cm.dist(b)", () => {
    const a = cm.vec(4, 6);
    const b = cm.vec(1, 2);
    expect(a.dist(b)).toBe(5);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cm.dist2(b)", () => {
    const a = cm.vec(4, 6);
    const b = cm.vec(1, 2);
    expect(a.dist2(b)).toBe(25);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("div", () => {
  test("cm.vecDiv(s)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vecDiv(a, 0.5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.div(s)", () => {
    const a = cm.vec(3, 4);
    expect(a.div(0.5)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });
});

describe("dot", () => {
  test("cm.vecDot(a, b)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vec(1, 2);
    expect(cm.vecDot(a, b)).toBe(11);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("vec.dot(a)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vec(1, 2);
    expect(a.dot(b)).toBe(11);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("cm.vecFromAngle", () => {
  test("cm.vecFromAngle", () => {
    const theta = Math.PI / 3;
    const vec = cm.vecFromAngle(theta);
    expect(vec.x).toBeCloseTo(0.5);
    expect(vec.y).toBeCloseTo(0.5 * Math.sqrt(3));
  });
});

describe("mag", () => {
  test("cm.vecMag(a)", () => {
    const a = cm.vec(3, 4);
    expect(cm.vecMag(a)).toBe(5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("cm.vecMag(a, s)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vecMag(a, 10);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.mag()", () => {
    const a = cm.vec(3, 4);
    expect(a.mag()).toBe(5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.mag(s)", () => {
    const a = cm.vec(3, 4);
    expect(a.mag(10)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });

  test("vec.norm()", () => {
    const a = cm.vec(0, 0);
    a.mag(10);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
  });
});

describe("mult", () => {
  test("cm.vecMult(s)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vecMult(a, 2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.mult(s)", () => {
    const a = cm.vec(3, 4);
    expect(a.mult(2)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });
});

describe("norm", () => {
  test("cm.vecNorm(a)", () => {
    const a = cm.vec(3, 4);
    const b = cm.vecNorm(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(0.6);
    expect(b.y).toBe(0.8);
  });

  test("vec.norm()", () => {
    const a = cm.vec(3, 4);
    expect(a.norm()).toBe(a);
    expect(a.x).toBe(0.6);
    expect(a.y).toBe(0.8);
  });

  test("vec.norm()", () => {
    const a = cm.vec(0, 0);
    a.norm();
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
  });
});

describe("random", () => {
  test("cm.vecRandom()", () => {
    const a = cm.vecRandom();
    expect(a.mag()).toBeCloseTo(1);
  });

  test("vec.random()", () => {
    const a = cm.vec(2, 3);
    expect(a.random()).toBe(a);
    expect(a.mag()).toBeCloseTo(1);
  });
});

describe("set", () => {
  test("vec.set(vec)", () => {
    const a = cm.vec(1, 2);
    const b = cm.vec(3, 4);
    expect(a.set(b)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(3);
    expect(b.y).toBe(4);
  });

  test("vec.set(a, b)", () => {
    const a = cm.vec(1, 2);
    a.set(3, 4);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.setX(x)", () => {
    const a = cm.vec(1, 2);
    expect(a.setX(3)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(2);
  });

  test("vec.setY(y)", () => {
    const a = cm.vec(1, 2);
    expect(a.setY(3)).toBe(a);
    expect(a.x).toBe(1);
    expect(a.y).toBe(3);
  });
});

describe("sub", () => {
  test("cm.vecSub(a, b)", () => {
    const a = cm.vec(1, 2);
    const b = cm.vec(2, 4);
    const out = cm.vecSub(a, b);
    expect(out.x).toBe(-1);
    expect(out.y).toBe(-2);
  });

  test("vec.sub(a)", () => {
    const a = cm.vec(1, 2);
    const b = cm.vec(2, 4);
    expect(a.sub(b)).toBe(a);
    expect(a.x).toBe(-1);
    expect(a.y).toBe(-2);
    expect(b.x).toBe(2);
    expect(b.y).toBe(4);
  });
});
