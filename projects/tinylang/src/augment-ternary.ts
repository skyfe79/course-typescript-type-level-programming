import type { Expr } from "./ast.ts";

// 이 모듈이 프로그램에 포함되면 선언 병합으로 ExprRegistry에 새 갈래가 등록되고,
// 그 값들에서 유도되는 Expr도 즉시 넓어진다. 이제 식을 확장할 때 핵심 ast.ts를
// 다시 열 필요가 없으며, 완전성 검사를 둔 소비자들이 빠진 처리를 알려 준다.
declare module "./ast.ts" {
  interface ExprRegistry {
    ternary: {
      readonly kind: "ternary";
      readonly condition: Expr;
      readonly whenTrue: Expr;
      readonly whenFalse: Expr;
    };
  }
}

// 오늘은 AST 확장 전파만 관찰한다. 렉서와 파서에는 아직 `? :` 문법을 더하지 않으므로,
// 관찰 파일이 이 노드를 직접 조립해 검사기와 코드 생성기에 전달한다.
export {};
