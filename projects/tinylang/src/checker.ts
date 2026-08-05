// 식 AST를 따라가며 각 식의 타입을 계산하고, 타입 규칙을 어긴 자리에 진단을 만든다.

import type { BinaryOperator, Expr, Param, TypeName, UnaryOperator } from "./ast.ts";
import { makeDiagnostic, toLine, toOffset } from "./diagnostics.ts";
import type { Diagnostic } from "./diagnostics.ts";
import { lookup } from "./scope.ts";
import type { Scope } from "./scope.ts";

// TypeName | null만 돌려주면 null이 된 이유와 여러 진단을 따로 운반해야 한다.
// 판별 유니온은 ok를 확인한 갈래에서만 type 또는 diagnostics를 읽게 하므로,
// 호출자가 실패를 잊고 타입 계산을 계속하는 일도 컴파일 단계에서 막는다.
export type CheckResult =
  | { readonly ok: true; readonly type: TypeName }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };

export type FunctionSignature = {
  readonly params: readonly Param[];
  readonly returnType: TypeName;
};

export type FunctionTable = ReadonlyMap<string, FunctionSignature>;

// Scope의 Binding은 변수 하나의 타입과 선언 종류만 담는다. 매개변수 목록과 반환
// 타입이 필요한 함수는 Program에서도 일반 문과 분리되어 있으므로 별도 표에 둔다.
// 블록을 드나들며 Scope가 바뀌어도 이 표는 검사 전체에서 같은 주변 정보로 유지된다.
export type CheckContext = {
  readonly functions: FunctionTable;
};

function typeError(message: string): Diagnostic {
  // AST 노드가 위치를 싣고 있지 않아 offset·line을 0으로 둔다. 진단을 만드는 자리를
  // 이 함수 하나로 모아 두면, 나중에 노드에 위치가 생겼을 때 여기만 고치면 된다.
  return makeDiagnostic("error", message, toOffset(0), toLine(0));
}

// 리터럴의 자바스크립트 타입을 tinylang의 타입 이름으로 옮긴다. Expr의 literal이
// number | string | boolean만 담으므로 세 갈래로 끝나고, 값 유니온이 늘어나면
// 이 함수의 반환 자리가 먼저 컴파일 오류로 알려 준다.
function literalType(value: number | string | boolean): TypeName {
  switch (typeof value) {
    case "number":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
  }
}

type ArithmeticOperator = "+" | "-" | "*" | "/" | "%";
type ComparisonOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";
type LogicalOperator = "&&" | "||";
type ClassifiedBinaryOperator = ArithmeticOperator | ComparisonOperator | LogicalOperator;

// 두 방향을 모두 검사해 부분집합에 빠진 연산자도, BinaryOperator에 없는 연산자를
// 잘못 보탠 경우도 타입 오류가 되게 한다. 연산자 목록이 바뀌면 이 확인도 함께 깨진다.
type HasExactBinaryOperators =
  [ClassifiedBinaryOperator] extends [BinaryOperator]
    ? [BinaryOperator] extends [ClassifiedBinaryOperator]
      ? true
      : false
    : false;
const binaryOperatorClassificationIsComplete: HasExactBinaryOperators = true;

function checkUnary(operator: UnaryOperator, operand: CheckResult): CheckResult {
  // 자식의 실제 오류가 있으면 연산자 규칙을 적용할 타입 자체가 없다. 이때는 새
  // 진단을 만들지 않고 원래 실패를 올려보내 원인 하나가 두 오류처럼 보이지 않게 한다.
  if (!operand.ok) return operand;

  switch (operator) {
    case "-":
      if (operand.type === "number") return { ok: true, type: "number" };
      return {
        ok: false,
        diagnostics: [typeError(
          `단항 연산자 '-'의 피연산자는 number여야 합니다 (현재 ${operand.type})`,
        )],
      };
    case "!":
      if (operand.type === "boolean") return { ok: true, type: "boolean" };
      return {
        ok: false,
        diagnostics: [typeError(
          `단항 연산자 '!'의 피연산자는 boolean이어야 합니다 (현재 ${operand.type})`,
        )],
      };
  }
}

function checkBinary(
  operator: BinaryOperator,
  left: CheckResult,
  right: CheckResult,
): CheckResult {
  // 자식 검사가 실패했다면 그 실패 때문에 생긴 타입 부재를 다시 타입 불일치로
  // 보고하지 않는다. 한쪽 실패는 그 결과를 그대로 올리고, 양쪽 실패만 두 목록을
  // 합쳐서 실제 원인 수만큼 남기므로 정의되지 않은 이름 하나가 연쇄 오류를 만들지 않는다.
  if (!left.ok && !right.ok) {
    return { ok: false, diagnostics: [...left.diagnostics, ...right.diagnostics] };
  }
  if (!left.ok) return left;
  if (!right.ok) return right;

  switch (operator) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "%":
      if (left.type === "number" && right.type === "number") {
        return { ok: true, type: "number" };
      }
      return {
        ok: false,
        diagnostics: [typeError(
          `산술 연산자 '${operator}'의 피연산자는 모두 number여야 합니다 (현재 ${left.type}, ${right.type})`,
        )],
      };

    case "==":
    case "!=":
    case "<":
    case "<=":
    case ">":
    case ">=":
      if (left.type === right.type) {
        return { ok: true, type: "boolean" };
      }
      return {
        ok: false,
        diagnostics: [typeError(
          `비교 연산자 '${operator}'의 두 피연산자 타입이 같아야 합니다 (현재 ${left.type}, ${right.type})`,
        )],
      };

    case "&&":
    case "||":
      if (left.type === "boolean" && right.type === "boolean") {
        return { ok: true, type: "boolean" };
      }
      return {
        ok: false,
        diagnostics: [typeError(
          `논리 연산자 '${operator}'의 피연산자는 모두 boolean이어야 합니다 (현재 ${left.type}, ${right.type})`,
        )],
      };
  }
}

export function checkExpr(expr: Expr, scope: Scope, ctx: CheckContext): CheckResult {
  switch (expr.kind) {
    case "literal":
      return { ok: true, type: literalType(expr.value) };

    case "identifier": {
      const found = lookup(scope, expr.name);
      if (found.kind === "found") {
        return { ok: true, type: found.binding.type };
      }

      return {
        ok: false,
        diagnostics: [typeError(`정의되지 않은 이름 '${found.name}'입니다`)],
      };
    }

    case "binary": {
      // 한쪽 실패만 보고 멈추지 않고 양쪽을 각각 검사해야 서로 독립적인 두 원인을
      // 함께 보여 줄 수 있다. 합치는 과정의 연쇄 오류 억제는 checkBinary가 맡는다.
      const left = checkExpr(expr.left, scope, ctx);
      const right = checkExpr(expr.right, scope, ctx);
      return checkBinary(expr.operator, left, right);
    }

    case "unary": {
      const operand = checkExpr(expr.operand, scope, ctx);
      return checkUnary(expr.operator, operand);
    }

    case "call": {
      const signature = ctx.functions.get(expr.callee);
      if (signature === undefined) {
        return {
          ok: false,
          diagnostics: [typeError(`정의되지 않은 함수 '${expr.callee}'입니다`)],
        };
      }

      // 개수가 다르면 어느 인자와 어느 매개변수를 짝지어야 하는지부터 성립하지
      // 않으므로, 개별 인자의 타입을 보기 전에 호출 형태의 오류 하나로 끝낸다.
      if (expr.args.length !== signature.params.length) {
        return {
          ok: false,
          diagnostics: [typeError(
            `함수 '${expr.callee}'는 인자 ${signature.params.length}개가 필요하지만 ${expr.args.length}개를 받았습니다`,
          )],
        };
      }

      const diagnostics: Diagnostic[] = [];
      for (let index = 0; index < expr.args.length; index += 1) {
        const argument = checkExpr(expr.args[index], scope, ctx);
        if (!argument.ok) {
          // 인자 안의 실패는 그 진단만 보존한다. 타입을 얻지 못했다는 사실을 다시
          // 매개변수 불일치로 보고하면 같은 원인이 중복되기 때문이다.
          diagnostics.push(...argument.diagnostics);
          continue;
        }

        const expected = signature.params[index].typeAnnotation;
        if (argument.type !== expected) {
          diagnostics.push(typeError(
            `함수 '${expr.callee}'의 ${index + 1}번째 인자는 ${expected} 타입이어야 하지만 ${argument.type} 타입입니다`,
          ));
        }
      }

      if (diagnostics.length > 0) return { ok: false, diagnostics };
      return { ok: true, type: signature.returnType };
    }
  }
}
