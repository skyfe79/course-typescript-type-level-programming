// 같은 보장을 런타임 체크와 타입 레벨 증명으로 각각 구현해 실패 시점을 비교한다.
// 실행: node episodes/s20-why-type-level/guarantee-demo.ts
// 검사: npx tsc --noEmit

// 런타임 버전은 어떤 배열이든 컴파일을 통과시킨 뒤, 실행 중 길이를 검사한다.
// 빈 배열이면 이 함수 안에서야 실패를 알 수 있다.
function firstRuntime<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("배열이 비어 있습니다");
  }
  return items[0];
}

console.log(firstRuntime([1, 2, 3]));
try {
  firstRuntime([]);
} catch (e) {
  console.log((e as Error).message);
}

// 타입 레벨 버전은 첫 원소가 반드시 있는 튜플 타입만 받는다.
// 빈 배열 리터럴을 넘기는 순간 실행 전에 컴파일 단계에서 막힌다.
type NonEmptyArray<T> = [T, ...T[]];

function firstTyped<T>(items: NonEmptyArray<T>): T {
  return items[0];
}

console.log(firstTyped([4, 5, 6]));
// @ts-expect-error - 빈 배열은 NonEmptyArray<T>에 할당할 수 없다
firstTyped([]);
// 이 호출은 실행 중에는 아무것도 출력하지 않는다 — 컴파일 단계에서만 의미가 있는 실패 사례다.
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s20-why-type-level/guarantee-demo.ts(31,12): error TS2345: Argument of type '[]' is not assignable to parameter of type 'NonEmptyArray<unknown>'.
//   Source has 0 element(s) but target requires 1.

export {};
