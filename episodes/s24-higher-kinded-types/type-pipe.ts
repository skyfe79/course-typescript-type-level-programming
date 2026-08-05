// 타입 함수 튜플을 순서대로 적용하는 재사용 가능한 Pipe 타입을 구현한다.
// 실행: node episodes/s24-higher-kinded-types/type-pipe.ts
// 검사: npx tsc --noEmit

// codeStep 348 — 튜플을 순회하며 타입 함수 적용하기

// TypeFn은 아직 채우지 않은 input과 그 입력으로 계산할 apply를 함께 가진 타입 함수의 공통 모양이다.
interface TypeFn {
  readonly input: unknown;
  readonly apply: unknown;
}

// F의 input 슬롯을 X로 채운 뒤 apply 멤버를 읽으면 타입 함수를 실제 입력에 적용한 결과가 된다.
type Apply<F extends TypeFn, X> = (F & { readonly input: X })["apply"];

// Eq는 두 타입이 정확히 같은지를 판별한다. 단순한 대입은 결과가 넓어져도 통과할 수 있어 여기서는 이 판별을 쓴다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// apply 안에 객체 타입 리터럴을 직접 쓰면 TS2526이 발생하므로 객체 모양에 이름을 붙여 input을 넘긴다.
type Boxed<T> = { value: T };

interface BoxT extends TypeFn {
  readonly apply: Boxed<this["input"]>;
}

interface NullableT extends TypeFn {
  readonly apply: this["input"] | null;
}

interface ArrayOfT extends TypeFn {
  readonly apply: this["input"][];
}

// 재귀를 만들기 전에 같은 입력을 한 단계씩 넘겨 최종 결과가 만들어지는 순서를 확인한다.
type Step1 = Apply<BoxT, string>;
type Step2 = Apply<NullableT, Step1>;
type Step3 = Apply<ArrayOfT, Step2>;

// 각 중간 결과를 고정해 다음 단계가 바로 앞 단계의 결과를 입력으로 받았음을 확인한다.
const step1Shape: Eq<Step1, { value: string }> = true;
const step2Shape: Eq<Step2, { value: string } | null> = true;
const step3Shape: Eq<Step3, ({ value: string } | null)[]> = true;

// codeStep 349 — Pipe 타입 완성하기

// 튜플을 머리와 꼬리로 나누고, 머리를 현재 Input에 적용한 결과를 새 Input으로 삼아 꼬리를 순회한다.
// 더 나눌 머리가 없는 빈 튜플에 도달하면 지금까지 누적된 Input을 그대로 돌려준다.
type Pipe<Input, Fns extends TypeFn[]> =
  Fns extends [infer Head extends TypeFn, ...infer Tail extends TypeFn[]]
    ? Pipe<Apply<Head, Input>, Tail>
    : Input;

type PipeResult = Pipe<string, [BoxT, NullableT, ArrayOfT]>;

// 재귀 순회는 앞에서 손으로 한 단계씩 넘긴 계산과 정확히 같은 결과를 만든다.
const pipeMatchesHand: Eq<PipeResult, Step3> = true;
const pipeResultShape: Eq<PipeResult, ({ value: string } | null)[]> = true;

// 빈 튜플은 적용할 타입 함수가 없다는 뜻이므로 처음 입력이 곧 결과다.
const emptyPipeIsInput: Eq<Pipe<boolean, []>, boolean> = true;

// codeStep 350 — 여러 타입 함수 체인으로 Pipe 테스트하기

// apply 안에 객체 타입 리터럴을 직접 쓰면 TS2526이 발생하므로 객체 모양에 이름을 붙여 input을 넘긴다.
type Keyed<T> = { id: string; value: T };

interface KeyedT extends TypeFn {
  readonly apply: Keyed<this["input"]>;
}

type FullChain = Pipe<number, [BoxT, ArrayOfT, KeyedT]>;
type ManualChain = Apply<KeyedT, Apply<ArrayOfT, Apply<BoxT, number>>>;

// Pipe는 같은 순서를 안쪽부터 직접 중첩한 Apply 호출을 읽기 쉬운 튜플 하나로 옮긴다.
const pipeMatchesNested: Eq<FullChain, ManualChain> = true;
const fullChainShape: Eq<FullChain, { id: string; value: { value: number }[] }> = true;

// 타입 함수의 나열 순서를 바꾸면 각 단계가 받는 입력이 달라져 최종 객체 모양도 달라진다.
type SwappedOrder = Pipe<number, [ArrayOfT, BoxT, KeyedT]>;
const swappedShape: Eq<SwappedOrder, { id: string; value: { value: number[] } }> = true;
// @ts-expect-error - 나열 순서가 달라 결과 타입이 같지 않다
const orderMatters: Eq<FullChain, SwappedOrder> = true;

// 런타임 함수도 타입 수준의 FullChain과 같은 왼쪽부터의 순서로 값을 변환한다.
const box = <T>(x: T) => ({ value: x });
const arrayOf = <T>(x: T) => [x];
const keyed = <T>(x: T) => ({ id: "auto", value: x });

function pipeRuntime<T>(input: T, fns: Array<(x: any) => any>): unknown {
  return fns.reduce((acc, fn) => fn(acc), input as unknown);
}

const n = Number(process.argv[2] ?? "3");
console.log(pipeRuntime(n, [box, arrayOf, keyed]));

export {};
