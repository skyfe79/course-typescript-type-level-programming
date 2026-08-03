type PrimitiveValue = string | number | boolean | symbol | bigint;

function formatString(v: string): string { return `"${v}"`; }
function formatNumber(v: number): string { return v.toString(); }
function formatBoolean(v: boolean): string { return v ? "true" : "false"; }
function formatSymbol(v: symbol): string { return `symbol: ${v.description ?? "anonymous"}`; }
function formatBigint(v: bigint): string { return `${v}n`; }

function printValue(v: PrimitiveValue): string {
  switch (typeof v) {
    case "string":
      return formatString(v);
    case "number":
      return formatNumber(v);
    case "boolean":
      return formatBoolean(v);
    case "symbol":
      return formatSymbol(v);
    case "bigint":
      return formatBigint(v);
  }
}

const primitiveSamples: PrimitiveValue[] = [
  "hello",
  42,
  true,
  Symbol("id"),
  9007199254740993n,
];
for (const sample of primitiveSamples) {
  console.log(printValue(sample));
}
