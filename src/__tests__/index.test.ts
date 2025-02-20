import { equal } from "node:assert/strict";
import { describe, it } from "node:test";

import { foobar } from "../index.ts";

await describe("foobar()", async () => {
	await describe("given two positive integers", async () => {
		const first = 1;
		const second = 2;

		await describe("when called", async () => {
			await it("returns the sum of them multiplied by 3 + extra", () => {
				equal(foobar(first, second), 12);
			});
		});
	});
});
