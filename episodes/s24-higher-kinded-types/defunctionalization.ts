// 아직 입력되지 않은 타입 함수를 인터페이스에 저장하고 Apply로 실행하는 디펑셔널라이제이션을 확인한다.
// 실행: node episodes/s24-higher-kinded-types/defunctionalization.ts
// 검사: npx tsc --noEmit

// codeStep 341 — 인터페이스로 타입 함수 정의하기

// TypeFn은 모든 타입 함수가 공통으로 갖춰야 할 모양을 나타낸다.
// input은 아직 채워지지 않은 입력 슬롯이고, apply는 그 입력으로 계산한 결과를 담는 출력 멤버다.
interface TypeFn {
  readonly input: unknown;
  readonly apply: unknown;
}

// Double은 input 슬롯의 타입을 두 번 읽어 튜플을 만드는 타입 함수다.
// 이 단계에서는 구체적인 입력을 받지 않았지만 TypeFn을 확장한 완성된 타입으로 존재한다.
interface Double extends TypeFn {
  readonly apply: [this["input"], this["input"]];
}

// 타입 인자가 없는 Double을 별칭 하나에 저장할 수 있다는 사실이 완성된 타입으로 자유롭게 옮길 수 있음을 증명한다.
// 제네릭 Double<T>였다면 T를 채우지 않고는 이 대입 자체를 작성할 수 없다.
type StoredFn = Double;

// codeStep 342 — apply로 타입 함수 호출하기

// F와 실제 input을 교차하면 비어 있던 입력 슬롯이 X로 채워진다.
// 그 결과의 apply 멤버를 꺼내면 F가 X에 적용된 최종 결과 타입을 얻는다.
type Apply<F extends TypeFn, X> = (F & { readonly input: X })["apply"];

type Result = Apply<Double, 5>;
const check: Result = [5, 5];

// 반대 방향 대입이 통과하므로 Result가 [number, number]로 넓어지지 않고 리터럴 5를 보존했음을 증명한다.
const checkExact: [5, 5] = check;

console.log("Apply<Double, 5> =", check);

export {};
