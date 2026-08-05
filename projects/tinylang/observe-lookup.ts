// 현재 스코프에서 부모로 올라가는 이름 조회와 LookupResult의 두 갈래를 관찰한다.

import { createScope, declare, lookup } from "./src/scope.ts";
import type { Binding, LookupResult, Scope } from "./src/scope.ts";

// 다른 관찰 스크립트와 공유하지 않고, 이 파일의 출력에 필요한 바인딩 요약을 직접 둔다.
function describeBinding(binding: Binding): string {
  return `{ type: ${binding.type}, kind: ${binding.kind} }`;
}

function distanceToBinding(scope: Scope | null, name: string): number | null {
  let current = scope;
  let distance = 0;

  while (current !== null) {
    if (current.bindings.has(name)) return distance;
    current = current.parent;
    distance += 1;
  }

  return null;
}

function describeLookup(
  scope: Scope | null,
  name: string,
  result: LookupResult,
): string {
  if (result.kind === "not-found") {
    return `{ kind: ${result.kind}, name: ${result.name} }`;
  }

  const distance = distanceToBinding(scope, name);
  return `{ kind: ${result.kind}, distance: ${distance}단계 위, binding: ${describeBinding(result.binding)} }`;
}

const globalScope = createScope(null);
const functionScope = createScope(globalScope);
const blockScope = createScope(functionScope);

declare(globalScope, "globalOnly", { type: "boolean", kind: "let" });
declare(functionScope, "parameter", { type: "string", kind: "param" });
declare(blockScope, "blockOnly", { type: "number", kind: "let" });

console.log("=== 3단 스코프 체인의 조회 거리 ===");
for (const name of ["blockOnly", "parameter", "globalOnly"]) {
  const result = lookup(blockScope, name);
  console.log(`블록에서 ${name}:`, describeLookup(blockScope, name, result));
}

// 전역과 블록에 같은 이름을 두어, 조회를 시작한 곳에서 먼저 만난 바인딩이 선택됨을 본다.
declare(globalScope, "x", { type: "number", kind: "let" });
declare(blockScope, "x", { type: "string", kind: "let" });

console.log("\n=== 먼저 만난 이름이 이기는 섀도잉 ===");
const innerX = lookup(blockScope, "x");
const globalX = lookup(globalScope, "x");
console.log("블록에서 x:", describeLookup(blockScope, "x", innerX));
console.log("전역에서 x:", describeLookup(globalScope, "x", globalX));

console.log("\n=== 이름을 찾지 못한 두 경우 ===");
const missing = lookup(blockScope, "neverDeclared");
console.log(
  "등록하지 않은 이름:",
  describeLookup(blockScope, "neverDeclared", missing),
);
const noScope = lookup(null, "withoutScope");
console.log("스코프가 null:", describeLookup(null, "withoutScope", noScope));

console.log("\n=== kind 검사 뒤의 안전한 binding 접근 ===");
const resultRequiringCheck = lookup(blockScope, "blockOnly");
// @ts-expect-error - kind로 좁히기 전에는 not-found 갈래에 없는 binding에 접근할 수 없다.
resultRequiringCheck.binding;
if (resultRequiringCheck.kind === "found") {
  console.log("found로 좁힌 뒤:", describeBinding(resultRequiringCheck.binding));
}
