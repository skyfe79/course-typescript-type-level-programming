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

console.log(checkDirect);

export {};
