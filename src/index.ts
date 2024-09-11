import { bar } from "./bar.ts";
import { foo } from "./foo.ts";

export function foobar(a: number, b: number) {
	return foo().repeat(a).length + bar().repeat(b).length;
}
