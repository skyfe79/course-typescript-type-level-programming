// 조건부 타입의 extends가 할당 가능성 조건으로 갈라지는지 확인한다.
// 실행: node episodes/s21-conditional-types-infer/conditional-basics.ts
// 검사: npx tsc --noEmit

// 조건부 타입의 extends는 제네릭 제약의 extends와 이름만 같다.
// 여기서는 "T가 string에 할당 가능한가"를 묻는 분기 조건이다.
type IsString<T> = T extends string ? true : false;

// "hello"는 string에 할당 가능하므로 CheckA는 리터럴 타입 true로 확정된다.
// number는 string에 할당 불가능하므로 CheckB는 리터럴 타입 false로 확정된다.
type CheckA = IsString<"hello">; // true
type CheckB = IsString<number>;  // false

// 아래 대입이 통과한다는 사실 자체가 조건부 타입이 이미 true/false로 갈라졌다는 증거다.
// checkA에 false를 넣거나 checkB에 true를 넣으면 컴파일이 막힌다.
const checkA: CheckA = true;
const checkB: CheckB = false;

// 함수 제네릭 제약의 extends는 T의 상한을 string으로 정할 뿐이다.
// 이 extends는 어떤 타입을 true/false로 갈라서 결과 타입을 만들지 않는다.
function constrainedExample<T extends string>(value: T): T {
  return value;
}

console.log(checkA, checkB);
console.log(constrainedExample("고정된 값"));

export {};
