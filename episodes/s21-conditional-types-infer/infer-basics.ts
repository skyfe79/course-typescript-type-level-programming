// infer로 배열의 형태에서 원소 타입을 꺼내는 가장 작은 예제를 만든다.
// 실행: node episodes/s21-conditional-types-infer/infer-basics.ts
// 검사: npx tsc --noEmit

// ElementOf<T>는 T가 배열 형태일 때 원소 자리에 infer E라는 이름을 붙인다.
// 조건이 맞으면 E를 돌려주고, 배열이 아니면 꺼낼 원소 타입이 없으므로 never가 된다.
type ElementOf<T> = T extends (infer E)[] ? E : never;

// numbers는 number[]로 추론되므로 ElementOf<typeof numbers>는 number를 꺼낸다.
// 같은 규칙으로 ElementOf<string[]>를 쓰면 결과는 string이 된다.
const numbers = [1, 2, 3];
type NumberElement = ElementOf<typeof numbers>;   // number

// printFirst는 배열 T를 받아 그 배열에서 꺼낸 원소 타입을 반환 타입으로 적는다.
// items[0]의 런타임 값은 그대로 두고, 타입 자리에서는 ElementOf<T>로 원소 타입을 설명한다.
function printFirst<T extends unknown[]>(items: T): ElementOf<T> {
  return items[0] as ElementOf<T>;
}

// 숫자 배열에서는 첫 숫자가 나오고, 문자열 배열에서는 첫 문자열이 나온다.
// 타입 계산은 컴파일 시간에 끝나고 런타임에는 실제 첫 원소만 출력된다.
console.log(printFirst(numbers));
console.log(printFirst(["a", "b", "c"]));

export {};
