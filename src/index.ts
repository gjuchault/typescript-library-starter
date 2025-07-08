import { bar } from "./bar.js";
import { foo } from "./foo.js";
import { baz } from "./nested/baz.js";

export function foobar(a: number, b: number) {
	return foo().repeat(a).length + bar().repeat(b).length + baz().length;
}
