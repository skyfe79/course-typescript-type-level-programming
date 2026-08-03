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

const mixed: unknown[] = ["a", 1, "b", null];

const a = mixed.filter(isStringExplicit);
const b = mixed.filter(isStringInferred);
const c = mixed.filter(isStringBroken);

console.log(a.map((s) => s.toUpperCase()));
console.log(b.map((s) => s.toUpperCase()));

// c는 unknown[]로 남아 아래 줄은 컴파일되지 않는다.
// console.log(c.map((s) => s.toUpperCase()));
// error TS18046: 's' is of type 'unknown'.

// length는 원소 타입과 무관하므로 unknown[]에서도 사용할 수 있다.
console.log(c.length);

export {};
