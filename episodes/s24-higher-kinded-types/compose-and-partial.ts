// 타입 함수의 합성과 부분 적용으로 작은 타입 함수를 더 큰 계산으로 묶는 방법을 보인다.
// 실행: node episodes/s24-higher-kinded-types/compose-and-partial.ts
// 검사: npx tsc --noEmit

// codeStep 346 — 두 타입 함수 합성해 보기

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

// ToArray는 입력 하나를 길이 1인 튜플로 감싼다.
interface ToArray extends TypeFn {
  readonly apply: [this["input"]];
}

// Eq는 두 타입이 정확히 같은지를 판별한다. 단순한 대입은 결과가 넓어져도 통과할 수 있어 여기서는 이 판별을 쓴다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Compose는 F를 먼저 적용하고, 그 결과를 G에 다시 넘긴다.
interface Compose<F extends TypeFn, G extends TypeFn> extends TypeFn {
  readonly apply: Apply<G, Apply<F, this["input"]>>;
}

type DoubleThenToArray = Compose<Double, ToArray>;
type Result = Apply<DoubleThenToArray, 5>;

// 합성한 결과는 손으로 두 단계를 이어 쓴 결과와 같다.
type Hand = Apply<ToArray, Apply<Double, 5>>;
const composeMatchesHand: Eq<Result, Hand> = true;

// 양방향 대입으로 정확한 리터럴 튜플 결과를 고정한다.
const result: Result = [[5, 5]];
const resultExact: [[5, 5]] = result;

// 합성 순서를 바꾸면 같은 입력이어도 다른 타입이 나온다.
type ToArrayThenDouble = Compose<ToArray, Double>;
type Reversed = Apply<ToArrayThenDouble, 5>;
// @ts-expect-error - 합성 순서가 달라 결과 타입이 같지 않다
const orderMatters: Eq<Result, Reversed> = true;

// 계산은 정확하지만 겹칠수록 순서를 한눈에 읽기 어려워진다.
type DoubleThenToArrayTwice = Compose<Compose<Double, ToArray>, ToArray>;
type Nested = Apply<DoubleThenToArrayTwice, 5>;
const nested: Nested = [[[5, 5]]];

console.log("합성 결과:", [[5, 5]]);

export {};
