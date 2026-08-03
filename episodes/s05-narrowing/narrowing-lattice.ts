function describe(value: string | number): string {
  if (typeof value === "string") {
    // value 호버: string
    return value.toUpperCase();
  } else {
    // value 호버: number
    return value.toFixed(2);
  }
}

console.log(describe("hello"));
console.log(describe(3.14159));
