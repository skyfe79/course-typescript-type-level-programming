import vm from "node:vm";

class ParseError extends Error {}

function describeError(e: unknown): string {
  if (e instanceof ParseError) {
    return `parse error: ${e.message}`;
  } else if (e instanceof Error) {
    return `error: ${e.message}`;
  }
  return "unknown throw";
}

console.log(describeError(new ParseError("bad token")));

const crossRealmError = vm.runInNewContext('new Error("boom")');
console.log("cross-realm instanceof Error:", crossRealmError instanceof Error);
console.log("cross-realm describeError:", describeError(crossRealmError));

const brokenSubclass = new ParseError("bad token");
Object.setPrototypeOf(brokenSubclass, Error.prototype);
console.log("broken-chain instanceof ParseError:", brokenSubclass instanceof ParseError);
console.log("broken-chain describeError:", describeError(brokenSubclass));
