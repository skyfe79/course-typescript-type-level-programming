import { readFileSync } from "node:fs";

const raw = readFileSync(0, "utf-8");
const parsed = JSON.parse(raw);
console.log(typeof parsed);
