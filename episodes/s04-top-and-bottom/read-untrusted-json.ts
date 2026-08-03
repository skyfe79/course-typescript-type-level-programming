import { readFileSync } from "node:fs";

const raw = readFileSync(0, "utf-8");
const parsed: unknown = JSON.parse(raw);
// 아래 줄의 주석을 해제하면, parsed가 unknown 타입이어서 TS18046 컴파일 에러가 난다.
// console.log(parsed.name);

if (
  typeof parsed === "object" &&
  parsed !== null &&
  "name" in parsed &&
  typeof parsed.name === "string"
) {
  console.log(`Hello, ${parsed.name}`);
} else {
  console.error("Invalid input: expected an object with a string 'name' field");
}
