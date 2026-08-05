// 타입 레벨 폴드 ReduceT를 만들고, MapT와 FilterT가 같은 재귀의 특수한 경우임을 보인다.
// 실행: node episodes/s23-map-filter-reduce/type-reduce.ts
// 검사: npx tsc --noEmit

// codeStep 333 — ReduceT<L, F, Init>를 만든다.

// 제네릭 화살표 타입으로 F를 넘기면 조건부 타입이 인자를 다시 추론하는 과정에서 실제 원소 타입이
// unknown으로 뭉개질 수 있다. 그래서 아직 적용하지 않은 타입 함수에 acc와 item 두 자리를 비워 두고,
// out에서 this로 두 인자를 읽는 인코딩을 사용한다. acc를 item보다 먼저 두는 순서는 값 레벨 reduce의
// 콜백과 같다.
interface TypeFn2 {
  readonly acc: unknown;
  readonly item: unknown;
  readonly out: unknown;
}

// 두 빈자리를 한꺼번에 실제 타입으로 채운 뒤 out을 읽는 한 걸음이 2-인자 타입 함수의 적용이다.
type CallF2<F extends TypeFn2, A, B> = (
  F & { readonly acc: A; readonly item: B }
)["out"];

// ReduceT는 머리 원소를 결합 함수에 넘겨 새 누산기를 만들고, 꼬리에 같은 일을 반복한다.
// 빈 튜플에 도착하면 지금까지 쌓인 Acc가 폴드의 최종 결과이다.
// 세 번째 자리는 호출하는 쪽에서 보면 초깃값이고, 재귀 안에서 보면 걸음마다 갱신되는 누산기다.
// 시그니처에는 갱신된다는 뜻이 드러나도록 Acc라고 적고, 처음 한 번 넘기는 값만 초깃값이라 부른다.
// 그 자리에는 기본값을 주지 않는다. 폴드는 무엇을 만들지에 따라 올바른 초깃값이 달라지므로 호출자가
// 매번 그 값을 명시하는 것이 이 연산의 중요한 계약이다.
type ReduceT<
  L extends readonly unknown[],
  F extends TypeFn2,
  Acc
> = L extends readonly [infer Head, ...infer Tail]
  ? ReduceT<
      Tail extends readonly unknown[] ? Tail : never,
      F,
      CallF2<F, Acc, Head>
    >
  : Acc;

// this["acc"]는 TypeFn2 선언만 보면 unknown이어서 바로 스프레드할 수 없다.
// 조건부 타입으로 읽기 전용 튜플 또는 배열임을 먼저 좁힌 뒤에야 끝에 현재 원소를 붙일 수 있다.
interface AppendF extends TypeFn2 {
  readonly out: this["acc"] extends readonly unknown[]
    ? [...this["acc"], this["item"]]
    : never;
}

type Rebuilt = ReduceT<[1, "two", true], AppendF, []>;

// 긍정 대입과 역방향 대입을 모두 통과시켜 결과가 정확히 [1, "two", true]임을 고정한다.
const rebuiltProof: Rebuilt = [1, "two", true];
const rebuiltExact: [1, "two", true] = rebuiltProof;
const rebuiltRoundTrip: Rebuilt = rebuiltExact;

// @ts-expect-error - 세 원소가 그대로 쌓이므로 빈 튜플은 Rebuilt가 아니다
const rebuiltNotEmpty: Rebuilt = [];
// @ts-expect-error - 각 원소 타입이 보존되므로 unknown[]으로 뭉개진 결과도 아니다
const rebuiltNotUnknown: Rebuilt = [] as unknown[];

// [...Acc, X]는 단계마다 새 튜플을 만들기 때문에 입력 튜플의 readonly는 결과에 따라오지 않는다.
// 따라서 Rebuilt는 읽기 전용 튜플이 아니라 값을 다시 대입할 수 있는 가변 튜플이다.
rebuiltProof[0] = 1;

// codeStep 334 — MapT와 FilterT를 ReduceT 위에서 다시 만든다.

// 이 파일 하나만 실행해도 모든 타입 정의가 완결되도록 앞 화의 1-인자 타입 함수 인코딩도 다시 쓴다.
interface TypeFn {
  readonly arg: unknown;
  readonly out: unknown;
}

// F의 빈 arg 자리에 현재 원소 X를 끼워 넣은 뒤 out을 읽는다.
type CallF<F extends TypeFn, X> = (F & { readonly arg: X })["out"];

// Map의 한 걸음은 현재 원소에 F를 적용한 결과를 누산기 끝에 붙이는 일이다.
// TypeFn2의 acc는 선언상 unknown이므로 AppendF와 마찬가지로 조건부 타입에서 먼저 좁힌다.
interface MapCombine<F extends TypeFn> extends TypeFn2 {
  readonly out: this["acc"] extends readonly unknown[]
    ? [...this["acc"], CallF<F, this["item"]>]
    : never;
}

type MapViaReduceT<
  L extends readonly unknown[],
  F extends TypeFn
> = ReduceT<L, MapCombine<F>, []>;

// Filter의 한 걸음은 술어 P가 true일 때만 현재 원소를 붙이고, 아니면 누산기를 그대로 넘기는 일이다.
interface FilterCombine<P extends TypeFn> extends TypeFn2 {
  readonly out: this["acc"] extends readonly unknown[]
    ? CallF<P, this["item"]> extends true
      ? [...this["acc"], this["item"]]
      : this["acc"]
    : never;
}

type FilterViaReduceT<
  L extends readonly unknown[],
  P extends TypeFn
> = ReduceT<L, FilterCombine<P>, []>;

// 앞 화와 같은 변환 규칙을 사용해야 재귀만 ReduceT로 바뀌었을 뿐 결과는 같다는 점을 대조할 수 있다.
type Widen<T> = T extends string ? string
  : T extends number ? number
  : T extends boolean ? boolean
  : T;

interface WidenF extends TypeFn {
  readonly out: Widen<this["arg"]>;
}

// 문자열만 고르는 술어도 앞 화와 같은 this["arg"] 인코딩으로 다시 선언한다.
interface IsStringF extends TypeFn {
  readonly out: this["arg"] extends string ? true : false;
}

type Check1 = MapViaReduceT<[1, "two", true], WidenF>;
type Check2 = FilterViaReduceT<[1, "a", 2, "b"], IsStringF>;

// MapViaReduceT의 결과가 넓어진 세 원시 타입의 튜플과 정확히 일치함을 양방향으로 확인한다.
const check1Proof: Check1 = [42, "another string", false];
const check1Exact: [number, string, boolean] = check1Proof;
const check1RoundTrip: Check1 = check1Exact;
// @ts-expect-error - 세 번째 원소는 boolean이어야 한다
const check1NotWrong: Check1 = [42, "another string", "not boolean"];

// FilterViaReduceT의 결과도 앞 화의 OnlyStrings와 같은 ["a", "b"]로 정확히 고정한다.
const check2Proof: Check2 = ["a", "b"];
const check2Exact: ["a", "b"] = check2Proof;
const check2RoundTrip: Check2 = check2Exact;
// @ts-expect-error - 문자열 두 개가 남으므로 빈 튜플은 Check2가 아니다
const check2NotEmpty: Check2 = [];

// 타입 레벨 ReduceT와 값 레벨 reduce는 같은 왼쪽 폴드 구조를 사용한다.
// 첫 번째 데모는 모든 원소를 다시 붙이고, 두 번째 데모는 문자열일 때만 붙인다.
const rebuiltAtRuntime = [1, "two", true].reduce<unknown[]>(
  (acc, item) => [...acc, item],
  []
);
const stringsAtRuntime = [1, "a", 2, "b"].reduce<string[]>(
  (acc, item) => typeof item === "string" ? [...acc, item] : acc,
  []
);

console.log("Rebuilt with reduce:", rebuiltAtRuntime);
console.log("Only strings with reduce:", stringsAtRuntime);

export {};
