function describeValue(value: unknown): string {
  if (typeof value === "string") {
    // value 호버: string
    return `string: ${value}`;
  }

  if (typeof value === "number") {
    // value 호버: number
    return `number: ${value}`;
  }

  if (typeof value === "boolean") {
    // value 호버: boolean
    return `boolean: ${value}`;
  }

  if (typeof value === "undefined") {
    // value 호버: undefined
    return "undefined";
  }

  if (typeof value === "function") {
    // value 호버: Function
    return `function: ${value.name || "anonymous"}`;
  }

  return "something else";
}

console.log(describeValue("hi"));
console.log(describeValue(42));
console.log(describeValue(true));

const samples = [
  "hi",
  42,
  true,
  undefined,
  null,
  { id: 1 },
  () => undefined,
  Symbol("sample"),
  1n,
];
const typeName = samples.map((value) => typeof value);

console.log(typeName.join(" "));
console.log(new Set(typeName).size);
