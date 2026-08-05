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

// codeStep 344 — apply 슬롯을 받도록 MapT 고치기

// TypeFn은 아직 채우지 않은 input과 그 입력으로 계산할 apply를 함께 가진 타입 함수의 공통 모양이다.
interface TypeFn {
  readonly input: unknown;
  readonly apply: unknown;
}

// F의 input 슬롯을 X로 채운 뒤 apply 멤버를 읽으면 타입 함수를 실제 입력에 적용한 결과가 된다.
type Apply<F extends TypeFn, X> = (F & { readonly input: X })["apply"];

// Double은 받은 입력을 두 번 보존하는 타입 함수다.
interface Double extends TypeFn {
  readonly apply: [this["input"], this["input"]];
}

// F의 제약은 화살표 타입에서 TypeFn으로, 머리에 적용하는 식은 조건부 추론에서 Apply로 바뀐다.
// 머리와 꼬리를 분해하고 결과를 앞에서부터 쌓는 재귀 구조는 MapOld와 한 글자도 다르지 않다.
type MapT<L extends readonly unknown[], F extends TypeFn> =
  L extends readonly [infer Head, ...infer Tail extends readonly unknown[]]
    ? [Apply<F, Head>, ...MapT<Tail, F>]
    : [];

type Check = MapT<[1, 2, 3], Double>;

// 양방향 대입이 모두 통과하므로 각 입력 리터럴이 Double의 결과에도 그대로 살아 있다.
const check: Check = [[1, 1], [2, 2], [3, 3]];
const checkExact: [[1, 1], [2, 2], [3, 3]] = check;

// codeStep 345 — 여러 타입 함수로 MapT 실행해 보기

// ToArray는 입력 하나를 길이 1인 튜플로 감싼다.
interface ToArray extends TypeFn {
  readonly apply: [this["input"]];
}

// Widen은 숫자 리터럴만 number로 넓히고, 숫자가 아닌 입력은 원래 타입을 보존한다.
interface Widen extends TypeFn {
  readonly apply: this["input"] extends number ? number : this["input"];
}

// 세 타입 함수는 MapT의 본문을 전혀 바꾸지 않고 같은 Apply 경로를 통과한다.
type R1 = MapT<[1, 2, 3], Double>;   // [[1, 1], [2, 2], [3, 3]]
type R2 = MapT<[1, 2, 3], ToArray>;  // [[1], [2], [3]]
type R3 = MapT<[1, 2, 3], Widen>;    // [number, number, number]

// R1은 Check와 같은 계산이며, 양방향 대입으로 다시 한 번 정확한 결과를 고정한다.
const r1: R1 = [[1, 1], [2, 2], [3, 3]];
const r1Exact: [[1, 1], [2, 2], [3, 3]] = r1;

// ToArray도 각 입력 리터럴을 잃지 않고 길이 1인 튜플로 감싼다.
const r2: R2 = [[1], [2], [3]];
const r2Exact: [[1], [2], [3]] = r2;

// 입력과 다른 숫자도 들어가므로 R3의 세 자리가 숫자 리터럴이 아니라 number로 넓어졌음을 알 수 있다.
const r3: R3 = [10, 20, 30];
const r3Exact: [number, number, number] = r3;

console.log("세 타입 함수 모두 MapT 본문을 고치지 않고 통과했습니다.");

export {};
