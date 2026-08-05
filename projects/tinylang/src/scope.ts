// 이름이 가리키는 타입과 선언 종류를 스코프별로 저장하는 심볼 테이블이다.

import type { TypeName } from "./ast.ts";

// 바인딩에는 AST의 타입 이름과 선언의 종류를 함께 남긴다. kind를 일반 string이
// 아니라 "param" | "let"으로 좁혀 두면, 이후 단계가 매개변수와 지역 변수를
// 구분해 검사해야 할 때 가능한 두 경우를 빠짐없이 나눌 수 있다.
export type Binding = {
  readonly type: TypeName;
  readonly kind: "param" | "let";
};

// 각 스코프는 현재 블록에서 선언한 이름과 바깥 스코프 하나만 기억한다. parent가
// Scope | null이므로 부모를 따라 올라가다 만나는 null이 전역 스코프 체인의 끝이다.
export type Scope = {
  // 필드가 readonly여도 Map 자체는 가변이므로 bindings.set은 가능하다. ast.ts의
  // readonly Statement[]가 배열 요소까지 바꾸지 못하게 한 것과 달리, 여기서는
  // 스코프의 연결 구조는 만든 뒤 고정하고 그 안의 바인딩만 선언에 따라 자라게 한다.
  readonly bindings: Map<string, Binding>;
  readonly parent: Scope | null;
};

// 전역 스코프는 null을, 블록이나 함수의 안쪽 스코프는 바깥 Scope를 넘겨 만든다.
// 생성 뒤에는 readonly parent를 다른 스코프로 갈아 끼울 수 없어 체인이 유지된다.
export function createScope(parent: Scope | null): Scope {
  return { bindings: new Map(), parent };
}

// 재선언 검사는 현재 스코프의 Map에만 한다. 부모에 같은 이름이 있어도 막지 않으므로
// 안쪽 선언이 바깥 선언을 가리는 섀도잉은 허용되고, 같은 스코프의 중복만 거절된다.
export function declare(scope: Scope, name: string, binding: Binding): boolean {
  if (scope.bindings.has(name)) return false;

  // 중복일 때는 set을 호출하지 않으므로 먼저 등록된 바인딩을 덮어쓰지 않는다.
  scope.bindings.set(name, binding);
  return true;
}
