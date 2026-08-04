// 타입 함수 F를 튜플의 모든 원소에 적용하는 MapT를 만들고, 그 F를 어디에 두어야 하는지 보인다.
// 실행: node episodes/s23-map-filter-reduce/type-map.ts
// 검사: npx tsc --noEmit

// 값 레벨의 array.map(f)는 함수 f를 인자로 그냥 넘기면 그만이다.
// 타입 레벨에서 같은 일을 하려고 하면 넘길 함수부터 없다. 타입스크립트에 일급 타입 함수가 없어서다.
// MapT<L, F> 안에서 F<Head>라고 적을 수도 없다. 타입 매개변수 F는 이미 완성된 하나의 타입이지
// 다시 타입 인자를 받는 생성자가 아니라서, 그렇게 적으면 아예 문법으로 거절당한다.

// 원소를 감싸는 규칙 자체는 평범한 제네릭 타입 별칭으로 적을 수 있다.
type Boxed<T> = { readonly value: T };

// 그래서 먼저 떠오르는 우회로는 F를 제네릭 화살표 타입으로 두고, 조건부 타입이 원소마다 그
// 타입 매개변수를 다시 추론하게 만드는 것이다. 모양만 보면 적용이 일어날 것처럼 보인다.
type ArrowBoxF = <T>(x: T) => Boxed<T>;
type CallArrow<F, X> = F extends (x: X) => infer R ? R : never;
type ArrowApplied = CallArrow<ArrowBoxF, 1>;

// 그런데 이 인코딩은 조용히 무너진다. 결과의 T가 리터럴 1이 아니라 unknown으로 뭉개진다.
// 아래 대입이 통과한다는 사실이 결과가 Boxed<unknown>이라는 증거다.
const arrowLost: Boxed<unknown> = {} as ArrowApplied;

// 반대 방향은 막힌다. 화살표로 넘긴 F에서는 원소 타입이 결과까지 살아남지 못한다.
// @ts-expect-error - ArrowApplied는 Boxed<1>이 아니라 Boxed<unknown>이다
const arrowNotLiteral: Boxed<1> = {} as ArrowApplied;

// 이유는 F를 화살표로 적는 순간 그것이 이미 적용까지 끝난 하나의 타입이 되기 때문이다.
// 되는 길은 반대다. F를 아직 적용하지 않은 채로 두고, 인자가 들어올 자리를 비워 둔다.
// 인터페이스의 this가 그 비어 있는 자리를 부르는 이름이고, arg에 실제 원소를 끼워 넣으면
// 그때 비로소 out이 계산된다. 이것이 타입스크립트에서 타입 함수를 흉내 내는 방법이다.
interface TypeFn {
  readonly arg: unknown;
  readonly out: unknown;
}

// F의 arg를 원소 X로 덮어쓴 뒤 out을 읽는 한 걸음이 곧 적용이다.
// 이 자리를 헬퍼로 떼어 두면 MapT의 재귀 본문은 F의 세부 모양을 몰라도 된다.
type CallF<F extends TypeFn, X> = (F & { readonly arg: X })["out"];

// 재귀 뼈대는 앞에서 계속 써 온 머리·꼬리 분해와 누산기 관용구 그대로다.
// 다른 것은 머리 원소를 그대로 쌓지 않고 CallF<F, Head>를 통과시킨 값을 쌓는다는 점 하나뿐이다.
type MapT<
  L extends readonly unknown[],
  F extends TypeFn,
  Acc extends readonly unknown[] = []
> = L extends readonly [infer Head, ...infer Tail]
  ? MapT<Tail extends readonly unknown[] ? Tail : never, F, [...Acc, CallF<F, Head>]>
  : Acc;

// 첫 번째 변환 규칙은 받은 타입을 읽기 전용 value 속성 안에 넣는다.
// out에서 this["arg"]를 읽는 것이 아직 들어오지 않은 인자를 가리키는 방법이다.
interface BoxF extends TypeFn {
  readonly out: Boxed<this["arg"]>;
}

// as const가 서로 다른 세 리터럴을 길이와 순서가 고정된 읽기 전용 튜플로 만든다.
// 숫자·문자열·불리언을 섞어야 원소마다 F가 다시 적용되는지가 눈에 보인다.
const row = [1, "two", true] as const;

type BoxedRow = MapT<typeof row, BoxF>;

// 누산기를 [...Acc, ...]로 매번 새로 만들기 때문에 입력에 붙어 있던 readonly는 결과까지
// 따라오지 않는다. 튜플 바깥은 쓰기 가능해지고, Boxed가 선언한 value의 readonly만 남는다.
const boxedProof: BoxedRow = [{ value: 1 }, { value: "two" }, { value: true }];

// 이 대입이 통과한다는 사실이 원소마다 F가 다시 적용되었다는 증거다.
// 화살표 인코딩처럼 unknown으로 뭉개졌다면 리터럴 1, "two", true가 여기 남아 있을 수 없다.
const boxedExact: [Boxed<1>, Boxed<"two">, Boxed<true>] = boxedProof;

console.log("BoxedRow:", boxedExact);

// 두 번째 변환 규칙은 각 원소 타입에 null을 더한다.
// MapT의 재귀 정의는 한 글자도 고치지 않고 F 자리에 다른 타입 함수를 끼우기만 한다.
type Nullable<T> = T | null;
interface NullableF extends TypeFn {
  readonly out: Nullable<this["arg"]>;
}

type NullableRow = MapT<typeof row, NullableF>;

// 세 원소가 각각 자기 리터럴과 null의 합집합이 되었다.
// 두 번째 자리에 1을 넣으면 막히므로, 이 대입은 자리마다 다른 타입이 계산되었다는 증거이기도 하다.
const nullableProof: NullableRow = [1, null, true];
const nullableExact: [1 | null, "two" | null, true | null] = nullableProof;

// BoxedRow는 위에서 그대로 유효하게 남아 있다. 하나의 재귀가 두 F를 모두 받아 냈다.
console.log("NullableRow:", nullableExact);

export {};
