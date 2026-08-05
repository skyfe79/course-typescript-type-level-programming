// 포장된 타입 함수와 맨 제네릭 타입을 비교해, 제네릭을 타입 인자로 직접 넘길 수 없는 이유를 확인한다.
// 실행: node episodes/s24-higher-kinded-types/generic-as-argument.ts
// 검사: npx tsc --noEmit

// 화별 파일은 서로 import하지 않으므로, 앞에서 만든 타입 함수 인코딩과 MapT를 이 파일에 다시 선언한다.
interface TypeFn {
  readonly arg: unknown;
  readonly out: unknown;
}

type CallF<F extends TypeFn, X> = (F & { readonly arg: X })["out"];

type MapT<
  L extends readonly unknown[],
  F extends TypeFn,
  Acc extends readonly unknown[] = []
> = L extends readonly [infer Head, ...infer Tail]
  ? MapT<Tail extends readonly unknown[] ? Tail : never, F, [...Acc, CallF<F, Head>]>
  : Acc;

// codeStep 339 — MapT의 F 자리가 받는 타입의 모양을 확인한다.

// TypeFn을 상속한 인터페이스는 arg와 out을 갖춘 완성된 타입이다.
// CallF가 arg 자리에 실제 원소를 끼우면 out이 계산되므로 MapT의 F 자리에 그대로 들어갈 수 있다.
interface BoxF extends TypeFn {
  readonly out: [this["arg"]];
}

type BoxedNumbers = MapT<[1, 2, 3], BoxF>;

// 이 대입이 통과한다는 사실이 포장된 타입 함수는 세 원소에 각각 적용되었음을 보여 준다.
const boxedNumbers: BoxedNumbers = [[1], [2], [3]];
const boxedNumbersExact: [[1], [2], [3]] = boxedNumbers;

// Double은 타입 인자 T를 받는 규칙일 뿐, 아직 arg와 out을 갖춘 완성된 타입은 아니다.
// 제네릭 타입은 모든 타입 인자를 채워야 하나의 완성된 타입이 되므로 완성된 타입을 요구하는 F에 넘길 수 없다.
type Double<T extends number> = [T, T];

// @ts-expect-error - Generic type 'Double' requires 1 type argument(s).
type Test = MapT<[1, 2, 3], Double>;

console.log("MapT의 F 자리는 여전히 포장된 함수 타입만 받습니다.");

// codeStep 340 — 타입 매개변수를 제네릭 타입처럼 다시 적용할 수 없는 이유를 확인한다.

// F는 어떤 완성된 타입 하나를 받는 타입 매개변수다. F가 나중에 X를 받을 제네릭이라는 정보를 표현하지 못한다.
// 따라서 MapT를 빼고 가장 단순하게 적어도 F<X>라는 적용 자체가 같은 뿌리에서 거절된다.
// @ts-expect-error - Type 'F' is not generic.
type Apply2<F, X> = F<X>;

console.log("타입 매개변수 F는 그 자체로는 절대 다시 제네릭이 될 수 없습니다.");

export {};
