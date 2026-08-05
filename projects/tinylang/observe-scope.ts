// 현재 스코프의 재선언과 부모 스코프 이름의 섀도잉이 서로 다르게 처리됨을 관찰한다.

import { createScope, declare } from "./src/scope.ts";
import type { Binding, Scope } from "./src/scope.ts";

// 수강생이 이 파일 하나만 읽어도 Map 안의 이름, 타입, 선언 종류를 한 줄씩 확인할
// 수 있도록 관찰용 요약을 이 파일 안에 둔다.
function describeBinding(binding: Binding): string {
  return `{ type: ${binding.type}, kind: ${binding.kind} }`;
}

function describeBindings(scope: Scope): string {
  if (scope.bindings.size === 0) return "(없음)";

  return [...scope.bindings]
    .map(([name, binding]) => `${name} -> ${describeBinding(binding)}`)
    .join(", ");
}

const globalScope = createScope(null);
const firstGlobalX: Binding = { type: "number", kind: "let" };

console.log("=== 현재 스코프의 선언과 재선언 ===");
console.log("전역 x 첫 등록:", declare(globalScope, "x", firstGlobalX));

// 다른 정보를 가진 바인딩으로 같은 이름을 다시 등록해, false뿐 아니라 기존 값이
// 덮어써지지 않는다는 사실도 아래 출력에서 함께 확인한다.
console.log(
  "전역 x 재등록:",
  declare(globalScope, "x", { type: "string", kind: "param" }),
);
const remainingGlobalX = globalScope.bindings.get("x");
console.log(
  "재등록 뒤 전역 x:",
  remainingGlobalX === undefined ? "(없음)" : describeBinding(remainingGlobalX),
);
console.log("먼저 등록된 바인딩 그대로인가:", remainingGlobalX === firstGlobalX);

const inner = createScope(globalScope);

console.log("\n=== 부모 스코프의 같은 이름 섀도잉 ===");
console.log(
  "안쪽 x 등록:",
  declare(inner, "x", { type: "string", kind: "let" }),
);

// x는 일반 변수이고 argument는 매개변수다. 같은 Map 안에 두 kind가 함께 들어가므로
// 이후 단계가 선언 종류에 따라 다르게 처리할 정보를 바인딩이 보존함을 볼 수 있다.
console.log(
  "안쪽 argument 등록:",
  declare(inner, "argument", { type: "boolean", kind: "param" }),
);

console.log("\n=== 스코프의 바인딩과 부모 연결 ===");
console.log("전역 bindings:", describeBindings(globalScope));
console.log("안쪽 bindings:", describeBindings(inner));
console.log("전역 parent === null:", globalScope.parent === null);
console.log("안쪽 parent === 전역:", inner.parent === globalScope);
