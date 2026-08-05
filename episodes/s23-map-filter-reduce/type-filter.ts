// 타입 레벨 술어로 튜플의 원소를 고르는 FilterT를 만들고, 유니온 필터링과의 차이를 보인다.
// 실행: node episodes/s23-map-filter-reduce/type-filter.ts
// 검사: npx tsc --noEmit

// 타입스크립트에는 타입 함수를 직접 인자로 넘기는 문법이 없다.
// 제네릭 화살표 타입으로 흉내 내면 적용할 원소 타입이 결과까지 이어지지 않고 unknown으로 뭉개진다.
// 그래서 아직 적용하지 않은 타입 함수를 TypeFn으로 나타내고, this["arg"]가 인자를 받을 자리를 만든다.
interface TypeFn {
  readonly arg: unknown;
  readonly out: unknown;
}

// F의 빈 arg 자리에 X를 끼워 넣은 다음 out을 읽는 한 걸음이 타입 함수의 적용이다.
type CallF<F extends TypeFn, X> = (F & { readonly arg: X })["out"];

// MapT의 F와 같은 모양이지만, 술어 P의 결과는 true 또는 false 리터럴이다.
// FilterT는 머리 원소에 P를 적용하고, true일 때만 그 원소를 누산기에 추가한다.
// false이면 Acc를 그대로 넘기므로 결과 튜플의 길이는 입력 원소의 내용에 따라 달라진다.
type FilterT<
  L extends readonly unknown[],
  P extends TypeFn,
  Acc extends readonly unknown[] = []
> = L extends readonly [infer Head, ...infer Tail]
  ? FilterT<
      Tail extends readonly unknown[] ? Tail : never,
      P,
      CallF<P, Head> extends true ? [...Acc, Head] : Acc
    >
  : Acc;

// this["arg"]가 지금 판정할 원소 타입이다. 문자열이면 true, 아니면 false를 돌려준다.
interface IsStringF extends TypeFn {
  readonly out: this["arg"] extends string ? true : false;
}

// as const로 각 원소의 리터럴 타입과 순서를 보존한다.
const mixed = [1, "a", 2, "b"] as const;

type OnlyStrings = FilterT<typeof mixed, IsStringF>;

// 긍정 대입과 반대 방향 대입을 모두 통과시켜 정확히 ["a", "b"]임을 고정한다.
const onlyStringsProof: OnlyStrings = ["a", "b"];
const onlyStringsExact: ["a", "b"] = onlyStringsProof;
const onlyStringsRoundTrip: OnlyStrings = onlyStringsExact;

// @ts-expect-error - 문자열 두 개가 남으므로 빈 튜플은 OnlyStrings가 아니다
const onlyStringsNotEmpty: OnlyStrings = [];
// @ts-expect-error - 각 원소 타입이 보존되므로 unknown[]으로 뭉개진 결과도 아니다
const onlyStringsNotUnknown: OnlyStrings = [] as unknown[];

// 유니온은 벌거벗은 타입 매개변수 U 위의 조건부 타입이 각 갈래에 저절로 분산된다.
type OnlyStringsOfUnion<U> = U extends string ? U : never;
type UnionStrings = OnlyStringsOfUnion<1 | "a" | 2 | "b">;
const unionA: UnionStrings = "a";
const unionB: UnionStrings = "b";
// @ts-expect-error - 숫자 갈래는 never가 되어 유니온에서 사라진다
const unionNotNumber: UnionStrings = 1;

// 튜플 전체는 string의 부분 타입이 아니고, 원소별 분산도 일어나지 않아 결과가 never다.
type DirectTupleFilter = OnlyStringsOfUnion<typeof mixed>;
// @ts-expect-error - 튜플은 FilterT처럼 재귀하며 한 칸씩 판정해야 한다
const tupleDoesNotDistribute: DirectTupleFilter = ["a", "b"];

function filterStrings<T extends readonly unknown[]>(list: T): FilterT<T, IsStringF> {
  // typeof 검사는 런타임 배열을 string[]로 좁히지만, 컴파일러는 그 배열을 재귀 타입 FilterT<T, IsStringF>와
  // 자동으로 연결하지 못한다. 실제 검사와 타입 레벨 술어가 같은 조건임을 이 경계의 캐스팅으로 알려 준다.
  return list.filter((value) => typeof value === "string") as FilterT<T, IsStringF>;
}

// FilterT가 만드는 [...Acc, Head]는 매번 새 튜플을 만들므로 입력의 readonly는 결과에 따라오지 않는다.
// 따라서 실행 결과의 타입도 readonly ["a", "b"]가 아니라 가변 튜플 ["a", "b"]다.
const filtered = filterStrings(mixed);
const filteredExact: ["a", "b"] = filtered;

console.log("Only strings:", filteredExact);

export {};
