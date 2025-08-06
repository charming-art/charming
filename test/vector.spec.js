import * as cc from "../src/index.js";
import { describe, expect, test } from "vitest";

describe("vector", () => {
  test("cc.vec()", () => {
    const v = cc.vec();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  test("cc.vec(x, y)", () => {
    const v = cc.vec(1, 2);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
  });
});

describe("add", () => {
  test("cc.vecAdd(a, b)", () => {
    const a = cc.vec(1, 2);
    const b = cc.vec(2, 3);
    const out = cc.vecAdd(a, b);
    expect(out.x).toBe(3);
    expect(out.y).toBe(5);
  });

  test("vec.add(a)", () => {
    const a = cc.vec(1, 2);
    const b = cc.vec(2, 3);
    expect(a.add(b)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(5);
    expect(b.x).toBe(2);
    expect(b.y).toBe(3);
  });
});

describe("angle", () => {
  test("cc.vecAngle(a)", () => {
    const a = cc.vec(1, 1);
    expect(cc.vecAngle(a)).toBeCloseTo(Math.PI / 4);
    expect(a.x).toBe(1);
    expect(a.y).toBe(1);
  });

  test("vec.angle()", () => {
    const a = cc.vec(1, 1);
    expect(a.angle()).toBeCloseTo(Math.PI / 4);
    expect(a.x).toBe(1);
    expect(a.y).toBe(1);
  });
});

describe("clamp", () => {
  test("cc.vecClamp(a, max)", () => {
    const a = cc.vec(6, 8);
    const b = cc.vecClamp(a, 5);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(3);
    expect(b.y).toBe(4);
  });

  test("cc.vecClamp(a, min, max)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecClamp(a, 10, 15);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.clamp(max)", () => {
    const a = cc.vec(6, 8);
    expect(a.clamp(5)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.clamp(min, max)", () => {
    const a = cc.vec(3, 4);
    expect(a.clamp(10, 15)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });

  test("cc.vecClampX(a, max)", () => {
    const a = cc.vec(6, 8);
    const b = cc.vecClampX(a, 5);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(5);
    expect(b.y).toBe(8);
  });

  test("cc.vecClampX(a, min, max)", () => {
    const a = cc.vec(6, 8);
    const b = cc.vecClampX(a, 10, 15);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(10);
    expect(b.y).toBe(8);
  });

  test("vec.clampX(max)", () => {
    const a = cc.vec(6, 8);
    expect(a.clampX(5)).toBe(a);
    expect(a.x).toBe(5);
    expect(a.y).toBe(8);
  });

  test("vec.clampX(min, max)", () => {
    const a = cc.vec(6, 8);
    expect(a.clampX(10, 15)).toBe(a);
    expect(a.x).toBe(10);
    expect(a.y).toBe(8);
  });

  test("cc.vecClampY(a, max)", () => {
    const a = cc.vec(6, 8);
    const b = cc.vecClampY(a, 5);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(6);
    expect(b.y).toBe(5);
  });

  test("cc.vecClampY(a, min, max)", () => {
    const a = cc.vec(6, 8);
    const b = cc.vecClampY(a, 10, 15);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
    expect(b.x).toBe(6);
    expect(b.y).toBe(10);
  });

  test("vec.clampY(max)", () => {
    const a = cc.vec(6, 8);
    expect(a.clampY(5)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(5);
  });

  test("vec.clampY(min, max)", () => {
    const a = cc.vec(6, 8);
    expect(a.clampY(10, 15)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(10);
  });
});

describe("clone", () => {
  test("vec.clone()", () => {
    const a = cc.vec(3, 4);
    const b = a.clone();
    b.set(1, 2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("cross", () => {
  test("cc.vecCross(a, b)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vec(1, 2);
    expect(cc.vecCross(a, b)).toBe(2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("vec.cross(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vec(1, 2);
    expect(a.cross(b)).toBe(2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("dist", () => {
  test("cc.vecDist(a, b)", () => {
    const a = cc.vec(4, 6);
    const b = cc.vec(1, 2);
    expect(cc.vecDist(a, b)).toBe(5);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cc.vecDist2(a)", () => {
    const a = cc.vec(4, 6);
    const b = cc.vec(1, 2);
    expect(cc.vecDist2(a, b)).toBe(25);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cc.dist(b)", () => {
    const a = cc.vec(4, 6);
    const b = cc.vec(1, 2);
    expect(a.dist(b)).toBe(5);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("cc.dist2(b)", () => {
    const a = cc.vec(4, 6);
    const b = cc.vec(1, 2);
    expect(a.dist2(b)).toBe(25);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("div", () => {
  test("cc.vecDiv(s)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecDiv(a, 0.5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.div(s)", () => {
    const a = cc.vec(3, 4);
    expect(a.div(0.5)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });
});

describe("dot", () => {
  test("cc.vecDot(a, b)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vec(1, 2);
    expect(cc.vecDot(a, b)).toBe(11);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });

  test("vec.dot(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vec(1, 2);
    expect(a.dot(b)).toBe(11);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
  });
});

describe("cc.vecFromAngle", () => {
  test("cc.vecFromAngle", () => {
    const theta = Math.PI / 3;
    const vec = cc.vecFromAngle(theta);
    expect(vec.x).toBeCloseTo(0.5);
    expect(vec.y).toBeCloseTo(0.5 * Math.sqrt(3));
  });
});

describe("in", () => {
  test("cc.vecInX(a, max)", () => {
    const a = cc.vec(3, 4);
    expect(cc.vecInX(a, 2)).toBe(false);
    expect(cc.vecInX(a, 3)).toBe(true);
    expect(cc.vecInX(a, 4)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    expect(cc.vecInX(cc.vec(-2, -2), 2)).toBe(false);
  });

  test("cc.vecInX(a, min, max)", () => {
    const a = cc.vec(3, 4);
    expect(cc.vecInX(a, 1, 2)).toBe(false);
    expect(cc.vecInX(a, 1, 3)).toBe(true);
    expect(cc.vecInX(a, 1, 4)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("cc.vecInY(a, max)", () => {
    const a = cc.vec(3, 4);
    expect(cc.vecInY(a, 3)).toBe(false);
    expect(cc.vecInY(a, 4)).toBe(true);
    expect(cc.vecInY(a, 5)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    expect(cc.vecInX(cc.vec(-2, -2), 2)).toBe(false);
  });

  test("cc.vecInY(a, min, max)", () => {
    const a = cc.vec(3, 4);
    expect(cc.vecInY(a, 1, 3)).toBe(false);
    expect(cc.vecInY(a, 1, 4)).toBe(true);
    expect(cc.vecInY(a, 1, 5)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.inX(max)", () => {
    const a = cc.vec(3, 4);
    expect(a.inX(2)).toBe(false);
    expect(a.inX(3)).toBe(true);
    expect(a.inX(4)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    expect(cc.vec(-2, -2).inX(2)).toBe(false);
  });

  test("vec.inX(min, max)", () => {
    const a = cc.vec(3, 4);
    expect(a.inX(1, 2)).toBe(false);
    expect(a.inX(1, 3)).toBe(true);
    expect(a.inX(1, 4)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.inY(max)", () => {
    const a = cc.vec(3, 4);
    expect(a.inY(3)).toBe(false);
    expect(a.inY(4)).toBe(true);
    expect(a.inY(5)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    expect(cc.vec(-2, -2).inY(2)).toBe(false);
  });

  test("vec.inY(a, min, max)", () => {
    const a = cc.vec(3, 4);
    expect(a.inY(1, 3)).toBe(false);
    expect(a.inY(1, 4)).toBe(true);
    expect(a.inY(1, 5)).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });
});

describe("mag", () => {
  test("cc.vecMag(a)", () => {
    const a = cc.vec(3, 4);
    expect(cc.vecMag(a)).toBe(5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("cc.vecMag(a, s)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecMag(a, 10);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.mag()", () => {
    const a = cc.vec(3, 4);
    expect(a.mag()).toBe(5);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.mag(s)", () => {
    const a = cc.vec(3, 4);
    expect(a.mag(10)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });

  test("vec.norm()", () => {
    const a = cc.vec(0, 0);
    a.mag(10);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
  });
});

describe("mult", () => {
  test("cc.vecMult(s)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecMult(a, 2);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(6);
    expect(b.y).toBe(8);
  });

  test("vec.mult(s)", () => {
    const a = cc.vec(3, 4);
    expect(a.mult(2)).toBe(a);
    expect(a.x).toBe(6);
    expect(a.y).toBe(8);
  });
});

describe("neg", () => {
  test("cc.vecNeg(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecNeg(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(-3);
    expect(b.y).toBe(-4);
  });

  test("cc.vecNegX(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecNegX(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(-3);
    expect(b.y).toBe(4);
  });

  test("cc.vecNegY(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecNegY(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(3);
    expect(b.y).toBe(-4);
  });

  test("vec.neg()", () => {
    const a = cc.vec(3, 4);
    expect(a.neg()).toBe(a);
    expect(a.x).toBe(-3);
    expect(a.y).toBe(-4);
  });

  test("vec.negX()", () => {
    const a = cc.vec(3, 4);
    expect(a.negX()).toBe(a);
    expect(a.x).toBe(-3);
    expect(a.y).toBe(4);
  });

  test("vec.negY()", () => {
    const a = cc.vec(3, 4);
    expect(a.negY()).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(-4);
  });
});

describe("norm", () => {
  test("cc.vecNorm(a)", () => {
    const a = cc.vec(3, 4);
    const b = cc.vecNorm(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(0.6);
    expect(b.y).toBe(0.8);
  });

  test("vec.norm()", () => {
    const a = cc.vec(3, 4);
    expect(a.norm()).toBe(a);
    expect(a.x).toBe(0.6);
    expect(a.y).toBe(0.8);
  });

  test("vec.norm()", () => {
    const a = cc.vec(0, 0);
    a.norm();
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
  });
});

describe("random", () => {
  test("cc.vecRandom()", () => {
    const a = cc.vecRandom();
    expect(a.x).greaterThanOrEqual(0);
    expect(a.x).lessThanOrEqual(1);
    expect(a.y).greaterThanOrEqual(0);
    expect(a.y).lessThanOrEqual(1);
  });

  test("vec.random()", () => {
    const a = cc.vec(2, 3);
    expect(a.random()).toBe(a);
    expect(a.x).greaterThanOrEqual(0);
    expect(a.x).lessThanOrEqual(1);
    expect(a.y).greaterThanOrEqual(0);
    expect(a.y).lessThanOrEqual(1);
  });
});

describe("set", () => {
  test("vec.set(vec)", () => {
    const a = cc.vec(1, 2);
    const b = cc.vec(3, 4);
    expect(a.set(b)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
    expect(b.x).toBe(3);
    expect(b.y).toBe(4);
  });

  test("vec.set(a, b)", () => {
    const a = cc.vec(1, 2);
    a.set(3, 4);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  test("vec.setX(x)", () => {
    const a = cc.vec(1, 2);
    expect(a.setX(3)).toBe(a);
    expect(a.x).toBe(3);
    expect(a.y).toBe(2);
  });

  test("vec.setY(y)", () => {
    const a = cc.vec(1, 2);
    expect(a.setY(3)).toBe(a);
    expect(a.x).toBe(1);
    expect(a.y).toBe(3);
  });
});

describe("sub", () => {
  test("cc.vecSub(a, b)", () => {
    const a = cc.vec(1, 2);
    const b = cc.vec(2, 4);
    const out = cc.vecSub(a, b);
    expect(out.x).toBe(-1);
    expect(out.y).toBe(-2);
  });

  test("vec.sub(a)", () => {
    const a = cc.vec(1, 2);
    const b = cc.vec(2, 4);
    expect(a.sub(b)).toBe(a);
    expect(a.x).toBe(-1);
    expect(a.y).toBe(-2);
    expect(b.x).toBe(2);
    expect(b.y).toBe(4);
  });
});
