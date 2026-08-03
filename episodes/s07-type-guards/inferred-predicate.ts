function isString(value: unknown) {
  return typeof value === "string";
}

const mixed: unknown[] = ["a", 1, "b", null, "c"];
const strings = mixed.filter(isString);

export {};
