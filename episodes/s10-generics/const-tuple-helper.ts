// const 타입 매개변수는 나머지 인수로 들어온 문자열들을 리터럴 튜플로 고정한다.
// 호출한 순서와 개수가 타입에 그대로 남는다.
function defineAllowedMethods<const T extends readonly string[]>(...methods: T): T {
  return methods;
}

// 첫 번째 호출 방식 — 인수를 직접 나열한다.
const direct = defineAllowedMethods("GET", "POST", "DELETE");

// 이 대입은 결과가 넓은 string[]가 아니라 정확한 리터럴 튜플일 때만 통과한다.
const checkDirect: readonly ["GET", "POST", "DELETE"] = direct;

// const 타입 매개변수로 추론된 결과는 readonly 튜플이다. 그래서 아래 줄은 막아 두었다.
// const mutableDirect: ["GET", "POST", "DELETE"] = direct;
// error TS4104: The type 'readonly ["GET", "POST", "DELETE"]' is 'readonly' and cannot be assigned to the mutable type '["GET", "POST", "DELETE"]'.

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

// 나머지 두 결과도 같은 방식으로 확인한다. 세 대입이 모두 통과하면 세 가지 호출 방식
// 전부에서 리터럴 튜플이 지켜진 것이다.
const checkSpread: readonly ["GET", "POST"] = viaSpread;
const checkWrapper: readonly ["PUT", "PATCH"] = viaWrapper;

// 지켜진 것은 리터럴의 집합이 아니라 순서까지 있는 튜플이다. 순서를 바꾼 튜플에는 대입할 수
// 없어 아래 줄은 막아 두었다.
// const wrongOrder: readonly ["POST", "GET", "DELETE"] = direct;
// error TS2322: Type 'readonly ["GET", "POST", "DELETE"]' is not assignable to type 'readonly ["POST", "GET", "DELETE"]'.

console.log(checkDirect, checkSpread, checkWrapper);

export {};
