// const 타입 매개변수는 호출부에 적힌 값을 가장 좁게 읽으라는 지시다.
// 나머지 매개변수와 readonly string[] 제약이 리터럴과 순서와 개수를 잡아 주고,
// 이 자리에서 const가 더하는 것은 readonly다.
function defineAllowedMethods<const T extends readonly string[]>(...methods: T): T {
  return methods;
}

// 첫 번째 호출 방식 — 인수를 직접 나열한다.
const direct = defineAllowedMethods("GET", "POST", "DELETE");

// 이 대입은 리터럴과 순서와 개수가 하나라도 어긋나면 거절된다.
const checkDirect: readonly ["GET", "POST", "DELETE"] = direct;

// const 타입 매개변수로 추론된 결과는 readonly 튜플이다. 그래서 아래 줄은 막아 두었다.
// const mutableDirect: ["GET", "POST", "DELETE"] = direct;
// error TS4104: The type 'readonly ["GET", "POST", "DELETE"]' is 'readonly' and cannot be assigned to the mutable type '["GET", "POST", "DELETE"]'.

// readonly가 붙으려면 const와 readonly 제약이 둘 다 있어야 한다. const를 빼도 리터럴과 순서와
// 개수는 그대로 남고, 제약에서 readonly를 빼면 추론된 읽기 전용 배열이 제약을 통과하지 못해
// 가변 튜플로 떨어진다. 그래서 아래 블록은 막아 두었다.
// function noConstVersion<T extends readonly string[]>(...methods: T): T {
//   return methods;
// }
// function mutableBoundVersion<const T extends string[]>(...methods: T): T {
//   return methods;
// }
// const fromNoConst = noConstVersion("GET", "POST", "DELETE");
// const fromMutableBound = mutableBoundVersion("GET", "POST", "DELETE");
// const keepsLiterals: ["GET", "POST", "DELETE"] = fromNoConst;
// direct[0] = "GET";
// error TS2540: Cannot assign to '0' because it is a read-only property.
// fromNoConst[0] = "GET";
// fromMutableBound[0] = "GET";

// 두 번째 호출 방식 — as const로 고정한 배열을 스프레드로 넘긴다.
const methodList = ["GET", "POST"] as const;
const viaSpread = defineAllowedMethods(...methodList);

// as const를 빼면 배열이 선언 시점에 이미 string[]로 넓어지고, 받는 쪽의 const 타입 매개변수는
// 그것을 리터럴로 되돌리지 못한다. 스프레드 호출에 as const가 필요한 이유이고,
// 그래서 아래 두 줄은 막아 두었다.
// const looseList = ["GET", "POST"];
// const brokenSpread: readonly ["GET", "POST"] = defineAllowedMethods(...looseList);
// error TS2322: Type 'string[]' is not assignable to type 'readonly ["GET", "POST"]'.

// 세 번째 호출 방식 — 다른 함수를 거쳐 간접적으로 부른다.
function registerRoute<const T extends readonly string[]>(...methods: T) {
  return defineAllowedMethods(...methods);
}

const viaWrapper = registerRoute("PUT", "PATCH");

// 나머지 두 결과도 같은 방식으로 확인한다.
const checkSpread: readonly ["GET", "POST"] = viaSpread;
const checkWrapper: readonly ["PUT", "PATCH"] = viaWrapper;

// 래퍼를 거친 결과는 readonly를 잃는다 — registerRoute가 반환 타입을 적지 않아 안쪽 호출이
// 제네릭 T를 펼치면서 readonly가 떨어지기 때문이다. 반환 타입을 : T로 적으면 유지된다.
// 그래서 아래 두 줄은 막아 두었다.
// viaSpread[0] = "GET";
// error TS2540: Cannot assign to '0' because it is a read-only property.
// viaWrapper[0] = "PUT";

// 지켜진 것은 리터럴의 집합이 아니라 순서까지 있는 튜플이다. 순서를 바꾼 튜플에는 대입할 수
// 없어 아래 줄은 막아 두었다.
// const wrongOrder: readonly ["POST", "GET", "DELETE"] = direct;
// error TS2322: Type 'readonly ["GET", "POST", "DELETE"]' is not assignable to type 'readonly ["POST", "GET", "DELETE"]'.

console.log(checkDirect, checkSpread, checkWrapper);

export {};
