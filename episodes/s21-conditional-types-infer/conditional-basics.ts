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

// ResultOf<T>도 T가 string에 할당 가능한지 묻는 조건부 타입이다.
// 다만 아래 describe 함수 안에서는 T가 아직 구체적인 타입으로 정해지지 않았다.
type ResultOf<T> = T extends string ? "문자열 결과" : "그 외 결과";

// 반환 타입 ResultOf<T>는 함수 본문을 검사하는 동안 아직 갈라지지 않은 상태로 남는다.
// 컴파일러가 T에 대한 판단을 실제 호출 지점까지 미루기 때문에 이것을 지연된 조건부 타입이라고 부른다.
function describe<T>(value: T): ResultOf<T> {
  // typeof 검사는 런타임 값의 분기이고, ResultOf<T>는 아직 지연된 타입이다.
  // 그래서 컴파일러는 구체적인 문자열 리터럴을 ResultOf<T>와 스스로 연결하지 못한다.
  // 이 구현이 반환 타입과 맞다는 사실을 알려 주기 위해 as ResultOf<T> 단언이 필요하다.
  return (typeof value === "string" ? "문자열 결과" : "그 외 결과") as ResultOf<T>;
}

// 실제 호출로 T가 "hi"로 채워지는 순간 조건이 풀려 반환 타입은 "문자열 결과"가 된다.
console.log(describe("hi"));
// T가 42로 채워지는 호출에서는 string에 할당 불가능하므로 반환 타입이 "그 외 결과"로 풀린다.
console.log(describe(42));

export {};
