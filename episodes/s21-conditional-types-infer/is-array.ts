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

// describeIsArray는 런타임의 Array.isArray 결과를 조건부 타입의 결과로 옮기는 함수다.
// 호출할 때 넘긴 값의 타입 T가 정해지면 IsArray<T>도 true 또는 false로 풀린다.
function describeIsArray<T>(sample: T): IsArray<T> {
  // 함수 본문을 검사하는 동안 IsArray<T>는 아직 갈라지지 않은 지연된 조건부 타입이다.
  // Array.isArray가 만든 boolean 값을 컴파일러가 IsArray<T>와 곧바로 맞추지는 못하므로 단언한다.
  return (Array.isArray(sample) ? true : false) as IsArray<T>;
}

// 여기서는 T가 number[]로 채워지므로 반환 타입은 true가 된다.
console.log(describeIsArray([1, 2, 3]));
// 여기서는 T가 string으로 채워지므로 반환 타입은 false가 된다.
console.log(describeIsArray("문자열"));

// 튜플은 배열의 한 형태이므로 [true, false]는 unknown[]에 할당 가능하다.
// as const로 만든 readonly 튜플은 unknown[]에 할당 불가능해서 같은 조건이 false로 갈린다.
const pair: [true, false] = [true, false];

console.log(describeIsArray(pair));           // 튜플도 배열이므로 true
console.log(describeIsArray({ length: 0 }));  // 배열이 아니므로 false
console.log(describeIsArray(123));            // 배열이 아니므로 false

export {};
