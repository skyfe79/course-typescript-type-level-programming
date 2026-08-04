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

// PickValue<T>는 값을 읽는 공변 위치 두 곳에서 같은 이름 U를 추론한다.
// 공변 위치에서 나온 후보들은 하나로 합쳐질 때 유니온이 된다.
type PickValue<T> = T extends { a: infer U; b: infer U } ? U : never;

// PickParam<T>는 함수 매개변수라는 반공변 위치 두 곳에서 같은 이름 U를 추론한다.
// 반공변 위치에서 나온 후보들은 하나로 합쳐질 때 인터섹션이 된다.
type PickParam<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void } ? U : never;

// a와 b가 각각 string, number 값을 내놓는 자리라서 두 후보가 유니온으로 모인다.
// 그래서 ValueResult에는 문자열과 숫자를 모두 넣을 수 있다.
type ValueResult = PickValue<{ a: string; b: number }>;   // string | number

// describeUnion은 유니온 결과를 런타임 문자열로 확인하는 작은 함수다.
// 호출부에서 string과 number가 모두 통과하는 것이 유니온 결과의 증거가 된다.
function describeUnion(value: ValueResult): void {
  console.log(`유니온 결과: ${value}`);
}

describeUnion("hello");
describeUnion(42);

// 인터섹션을 눈으로 확인하려면 서로 합쳐질 수 있는 객체 타입을 쓰는 편이 좋다.
// Named와 Aged는 서로 다른 속성을 가지므로 Named & Aged가 두 속성을 모두 가진 타입으로 남는다.
type Named = { name: string };
type Aged = { age: number };

// 함수 매개변수 두 자리에서 나온 Named와 Aged 후보는 Named & Aged 하나로 합쳐진다.
// describeIntersection이 name과 age를 둘 다 읽을 수 있으면 인터섹션의 의미가 그대로 드러난다.
type ParamResult = PickParam<{ a: (x: Named) => void; b: (x: Aged) => void }>;   // Named & Aged

// describeIntersection은 인터섹션 결과가 양쪽 속성을 모두 가진다고 가정한다.
// 이 함수가 value.name과 value.age를 함께 읽는 것이 객체 인터섹션 예시의 핵심이다.
function describeIntersection(value: ParamResult): void {
  console.log(`인터섹션 결과: ${value.name}, ${value.age}`);
}

describeIntersection({ name: "지수", age: 30 });

// 같은 자리에 string과 number를 넣으면 결과는 string & number가 아니라 never가 된다.
// 서로 겹칠 수 없는 원시 타입끼리는 인터섹션이 그대로 never로 줄어들기 때문이다.
type ParamPrimitive = PickParam<{ a: (x: string) => void; b: (x: number) => void }>;   // never

export {};
