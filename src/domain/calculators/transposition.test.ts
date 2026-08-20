import { describe, expect, it } from "vitest";
import { transpose } from "./transposition";

describe("transpose", () => {
  it("converts minus-cylinder to plus-cylinder", () => {
    expect(transpose({ sphere: -2.0, cylinder: -1.0, axis: 90 })).toEqual({
      sphere: -3.0,
      cylinder: 1.0,
      axis: 180,
    });
  });

  it("converts plus-cylinder to minus-cylinder", () => {
    expect(transpose({ sphere: -3.0, cylinder: 1.0, axis: 180 })).toEqual({
      sphere: -2.0,
      cylinder: -1.0,
      axis: 90,
    });
  });

  it("is its own inverse", () => {
    const rx = { sphere: 1.25, cylinder: -0.75, axis: 45 };
    expect(transpose(transpose(rx))).toEqual(rx);
  });

  it("wraps axis above 180 back into 1-180 range", () => {
    expect(transpose({ sphere: 0, cylinder: -0.5, axis: 100 }).axis).toBe(10);
  });

  it("wraps axis at the low boundary (axis + 90 = 180) to 180, not 0", () => {
    expect(transpose({ sphere: 0, cylinder: -0.5, axis: 90 }).axis).toBe(180);
  });

  it("handles zero cylinder (spherical-only Rx)", () => {
    expect(transpose({ sphere: -2.0, cylinder: 0, axis: 90 })).toEqual({
      sphere: -2.0,
      cylinder: -0,
      axis: 180,
    });
  });
});
