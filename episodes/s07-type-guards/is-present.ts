function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const rawValues: (string | null | undefined)[] = ["a", null, "b", undefined, "c"];
const present = rawValues.filter(isPresent);
// 여기서 present를 호버하면 string[]이다.

const confirmed: string[] = present; // 단언 없이 string[]로 좁혀진다.
console.log(confirmed);

// const wrongElement: number[] = present;
// error TS2322: Type 'string[]' is not assignable to type 'number[]'.
//   Type 'string' is not assignable to type 'number'.

export {};
