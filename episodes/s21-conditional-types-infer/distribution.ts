// 분산 조건부 타입에서 never 판정이 어떻게 달라지는지 확인한다.
// 실행: node episodes/s21-conditional-types-infer/distribution.ts
// 검사: npx tsc --noEmit

// IsNeverNaive<T>는 T가 never에 할당 가능한지 조건부 타입으로 묻는다.
// T가 extends 왼쪽에 벗겨진 채로 있으므로 유니온 타입이 들어오면 멤버별로 분산된다.
type IsNeverNaive<T> = T extends never ? true : false;

// IsNeverFixed<T>는 T와 never를 각각 원소 하나짜리 튜플로 감싸서 비교한다.
// [T]처럼 감싸면 T가 더 이상 벗겨진 자리가 아니므로 조건부 타입의 분산 규칙이 적용되지 않는다.
type IsNeverFixed<T> = [T] extends [never] ? true : false;

// printResult는 타입 검사 결과를 확인한 값을 런타임 출력으로 보여 주는 함수다.
// 조건부 타입 자체는 컴파일 시간에 사라지고, 여기서는 이미 확정된 boolean 값만 출력한다.
function printResult(label: string, value: boolean): void {
  console.log(`${label}: ${value}`);
}

// never 전체를 튜플로 감싼 뒤 한 번만 검사하므로 CheckFixedNever는 true로 확정된다.
// 이 경우에는 never를 멤버별로 분산하지 않고 [never]가 [never]에 할당 가능한지만 본다.
type CheckFixedNever = IsNeverFixed<never>;   // true

// string 전체를 튜플로 감싼 뒤 한 번만 검사하므로 CheckFixedString은 false로 확정된다.
// [string]은 [never]에 할당 가능하지 않다.
type CheckFixedString = IsNeverFixed<string>; // false

// IsNeverNaive<never>는 true가 아니라 never가 된다.
// never는 멤버가 0개인 유니온이므로 분산 조건부 타입이 평가할 멤버가 없고 결과도 곧바로 never가 된다.
type CheckNaiveNever = IsNeverNaive<never>;   // never — 버그

// CheckFixedNever가 true로 확정됐으므로 true 대입이 통과한다.
// 이 값은 런타임에서 "IsNeverFixed<never>: true"를 출력한다.
const fixedNever: CheckFixedNever = true;
printResult("IsNeverFixed<never>", fixedNever);

// CheckFixedString이 false로 확정됐으므로 false 대입이 통과한다.
// 이 값은 런타임에서 "IsNeverFixed<string>: false"를 출력한다.
const fixedString: CheckFixedString = false;
printResult("IsNeverFixed<string>", fixedString);

// CheckNaiveNever는 never라서 어떤 실제 값도 대입할 수 없다.
// 아래 줄의 주석을 풀면 Type 'true' is not assignable to type 'never' 오류가 난다.
// const naiveNever: CheckNaiveNever = true; // 컴파일 오류 — CheckNaiveNever가 never라서 true를 대입할 수 없다

export {};
