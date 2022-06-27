import { describe, expect, it } from "vitest";
import { foo, bar } from "../index";

describe("foo()", () => {
  describe("given two positive integers", () => {
    const first = 1;
    const second = 2;

    describe("when called", () => {
      it("returns the sum of them", () => {
        expect(foo(first, second)).toEqual(3);
      });
    });
  });
});

describe("bar()", () => {
  describe("given two positive integers", () => {
    const first = 2;
    const second = 1;

    describe("when called", () => {
      it("returns the subtraction of them", () => {
        expect(bar(first, second)).toEqual(1);
      });
    });
  });
});
