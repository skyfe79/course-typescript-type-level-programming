// 하드코딩된 MapT를 TypeFn의 apply 슬롯을 받도록 고쳐 어떤 타입 함수든 같은 재귀 구조로 적용됨을 확인한다.
// 실행: node episodes/s24-higher-kinded-types/map-any-type-fn.ts
// 검사: npx tsc --noEmit

// codeStep 343 — 기존 MapT의 하드코딩된 부분 확인하기

// 옛 정의는 F가 화살표 타입이어야만 한다.
// 고쳐야 할 자리는 이 두 곳이다. F의 제약과 재귀 안의 적용 방식을 바꾸되 재귀 구조 자체는 그대로 둔다.
type MapOld<L extends readonly unknown[], F extends (x: any) => any> =
  L extends readonly [infer Head, ...infer Tail extends readonly unknown[]]
    ? [F extends (x: Head) => infer R ? R : never, ...MapOld<Tail, F>]
    : [];

// 제네릭 호출 시그니처를 화살표 타입 모양으로 포장해야 MapOld의 F 자리에 들어갈 수 있다.
interface DoubleArrow {
  <T>(x: T): [T, T];
}

type OldCheck = MapOld<[1, 2, 3], DoubleArrow>;

// MapOld는 컴파일되지만 제네릭 호출 시그니처에서 원소별 리터럴을 꺼내지 못해 각 결과가 unknown으로 남는다.
const oldCheck: OldCheck = [[1, 1], [2, 2], [3, 3]];
// @ts-expect-error - OldCheck의 각 원소는 [unknown, unknown]이므로 정확한 리터럴 튜플에 대입할 수 없다.
const oldCheckExact: [[1, 1], [2, 2], [3, 3]] = oldCheck;

export {};
