import type { Expr, Program, Statement } from "./src/ast.ts";
import type { Value } from "./src/values.ts";

// `let a: number = 1 + 2 * 3;`의 트리를 손으로 만든다. 곱셈 노드를 덧셈의
// 오른쪽 자식으로 넣은 모양에서 연산자 우선순위가 AST 구조로 표현됨을 볼 수 있다.
const one: Expr = { kind: "literal", value: 1 };
const twoTimesThree: Expr = {
  kind: "binary",
  operator: "*",
  left: { kind: "literal", value: 2 },
  right: { kind: "literal", value: 3 },
};

// 구체적인 binary 변형을 유지해야 아래에서 readonly left 보호도 직접 관찰할 수 있다.
const initializer: Extract<Expr, { readonly kind: "binary" }> = {
  kind: "binary",
  operator: "+",
  left: one,
  right: twoTimesThree,
};

const declaration: Statement = {
  kind: "varDecl",
  name: "a",
  declaredType: "number",
  initializer,
};

const program: Program = {
  kind: "program",
  functions: [],
  statements: [declaration],
};

console.log("=== 손으로 조립한 AST: let a: number = 1 + 2 * 3; ===");
console.log(JSON.stringify(program, null, 2));

const values: readonly Value[] = [
  { kind: "number", value: 42 },
  { kind: "string", value: "tinylang" },
  { kind: "boolean", value: true },
];

console.log("\n=== 실행 시점 Value의 세 가지 모양 ===");
console.log(JSON.stringify(values, null, 2));

// 다음 두 줄은 JavaScript로 실행되면 실제 대입을 수행하지만, 그 전에 TypeScript가
// 잘못을 찾아낸다. 관찰 출력 뒤에 두어 실행 화면에는 조립 당시의 트리가 보이게 했다.
// 아래 억제 주석을 지우면 적어 둔 오류를 그대로 확인할 수 있다.
// @ts-expect-error - Cannot assign to 'left' because it is a read-only property
initializer.left = { kind: "literal", value: 0 };

// readonly 배열은 요소를 push해 트리 구조를 바꾸는 일도 컴파일 단계에서 막는다.
// @ts-expect-error - Property 'push' does not exist on type 'readonly Statement[]'
program.statements.push(declaration);
