function isString(value: unknown) {
  return typeof value === "string";
}

const mixed: unknown[] = ["a", 1, "b", null, "c"];
const strings = mixed.filter(isString);

console.log(strings.map((s) => s.toUpperCase()));

const asPredicate: (value: unknown) => value is string = isString;
console.log(asPredicate("sample"));

// 술어가 아닌 반환 타입을 표기하면 타입 술어 추론이 꺼진다.
// function isStringAnnotated(value: unknown): boolean {
//   return typeof value === "string";
// }
// const asPredicate2: (value: unknown) => value is string = isStringAnnotated;
// error TS2322: Type '(value: unknown) => boolean' is not assignable to type '(value: unknown) => value is string'.
//   Signature '(value: unknown): boolean' must be a type predicate.

// 조건 하나라도 깨지면(`: boolean` 같은 비술어 반환 타입 표기 / 두 번의 return /
// 암시적 반환 / 매개변수 재할당) strings가 unknown[]에 머물러 위 map 줄이 막힌다.
// error TS18046: 's' is of type 'unknown'.
// 반면 value is string을 직접 손으로 적는 것은 추론을 끄지만 좁히기는 그대로다(다음 화에서 비교한다).

export {};
