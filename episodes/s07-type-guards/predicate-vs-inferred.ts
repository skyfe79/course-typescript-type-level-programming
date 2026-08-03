function isStringExplicit(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  return true;
}

function isStringInferred(value: unknown) {
  return typeof value === "string";
}

function isStringBroken(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }
  return true;
}

const explicitAsPredicate: (value: unknown) => value is string = isStringExplicit;
const inferredAsPredicate: (value: unknown) => value is string = isStringInferred;

// const brokenAsPredicate: (value: unknown) => value is string = isStringBroken;
// error TS2322: Type '(value: unknown) => boolean' is not assignable to type '(value: unknown) => value is string'.
//   Signature '(value: unknown): boolean' must be a type predicate.

console.log(explicitAsPredicate("sample"), inferredAsPredicate("sample"));

export {};
