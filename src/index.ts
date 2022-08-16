import { bar } from "./bar";
import { foo } from "./foo";

export function foobar(a: number, b: number) {
  return foo().repeat(a).length + bar().repeat(b).length;
}
