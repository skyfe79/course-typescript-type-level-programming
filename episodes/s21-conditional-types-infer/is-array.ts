// 조건부 타입으로 배열 타입을 true/false 리터럴 타입으로 판정하는지 확인한다.
// 실행: node episodes/s21-conditional-types-infer/is-array.ts
// 검사: npx tsc --noEmit

// IsArray<T>는 T가 unknown[]에 할당 가능한 타입인지 묻는다.
// 조건을 만족하면 리터럴 타입 true, 만족하지 않으면 리터럴 타입 false가 된다.
type IsArray<T> = T extends unknown[] ? true : false;

// number[]는 unknown[]에 할당 가능하므로 CheckArray는 true로 확정된다.
// string은 배열 타입이 아니므로 CheckString은 false로 확정된다.
type CheckArray = IsArray<number[]>; // true
type CheckString = IsArray<string>;  // false

// 아래 대입이 통과한다는 사실 자체가 조건부 타입이 이미 true/false 리터럴 타입으로
// 확정됐다는 증거다. 이 단계에서는 아직 결과를 타입으로만 확인하고 있다.
const checkArray: CheckArray = true;
const checkString: CheckString = false;

console.log(checkArray, checkString);

export {};
