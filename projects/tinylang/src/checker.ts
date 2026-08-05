// 식 AST를 따라가며 각 식의 타입을 계산하고, 타입 규칙을 어긴 자리에 진단을 만든다.

import type {
  BinaryOperator,
  Expr,
  FuncDecl,
  Param,
  Program,
  Statement,
  TypeName,
  UnaryOperator,
} from "./ast.ts";
import { makeDiagnostic, toLine, toOffset } from "./diagnostics.ts";
import type { Diagnostic } from "./diagnostics.ts";
import { createScope, declare, lookup } from "./scope.ts";
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
  // null은 별도 상태 플래그가 아니라 지금 함수 본문을 검사하고 있지 않다는 뜻이다.
  // 따라서 최상위 문에서 만난 return도 이 필드 하나만으로 판정할 수 있다.
  readonly returnType: TypeName | null;
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

function checkCondition(expr: Expr, scope: Scope, ctx: CheckContext): readonly Diagnostic[] {
  const condition = checkExpr(expr, scope, ctx);

  // 조건식 안에서 이미 실패했다면 비교할 타입이 없다. 원래 진단만 올려보내야
  // "조건은 boolean"이라는 결과 오류가 실제 원인 뒤에 연쇄해서 붙지 않는다.
  if (!condition.ok) return condition.diagnostics;
  if (condition.type === "boolean") return [];

  return [typeError(
    `조건은 boolean 타입이어야 하지만 ${condition.type} 타입입니다`,
  )];
}

export function checkStatement(
  stmt: Statement,
  scope: Scope,
  ctx: CheckContext,
): readonly Diagnostic[] {
  switch (stmt.kind) {
    case "block": {
      // 블록마다 자식 스코프를 열어야 안쪽 선언이 바깥 이름을 가릴 수 있으면서도,
      // 블록이 끝난 뒤 그 선언이 바깥 문에 새어 나가지 않는다. 문은 같은 자식
      // 스코프에서 차례로 검사하므로 앞선 선언은 뒤따르는 문에서 보인다.
      const blockScope = createScope(scope);
      const diagnostics: Diagnostic[] = [];
      for (const statement of stmt.statements) {
        diagnostics.push(...checkStatement(statement, blockScope, ctx));
      }
      return diagnostics;
    }

    case "if": {
      const diagnostics: Diagnostic[] = [
        ...checkCondition(stmt.condition, scope, ctx),
        ...checkStatement(stmt.thenBranch, scope, ctx),
      ];

      if (stmt.elseBranch !== null) {
        // Block과 IfStatement가 모두 Statement이므로 같은 함수를 다시 부르면
        // else if 사슬도 별도 반복문 없이 AST 모양 그대로 재귀해 검사된다.
        diagnostics.push(...checkStatement(stmt.elseBranch, scope, ctx));
      }
      return diagnostics;
    }

    case "varDecl": {
      const diagnostics: Diagnostic[] = [];
      const initializer = checkExpr(stmt.initializer, scope, ctx);

      if (!initializer.ok) {
        diagnostics.push(...initializer.diagnostics);
      } else if (initializer.type !== stmt.declaredType) {
        diagnostics.push(typeError(
          `변수 '${stmt.name}'의 선언 타입은 ${stmt.declaredType}이지만 초기값은 ${initializer.type} 타입입니다`,
        ));
      }

      // 초기화식이 틀려도 이름은 사용자가 선언한 타입으로 등록한다. 그래야 이후
      // 문들이 같은 이름을 "정의되지 않음"으로 거듭 보고하는 가짜 연쇄 오류가 없다.
      const declared = declare(scope, stmt.name, {
        type: stmt.declaredType,
        kind: "let",
      });
      if (!declared) {
        diagnostics.push(typeError(
          `같은 스코프에 변수 '${stmt.name}'이 이미 선언되어 있습니다`,
        ));
      }

      return diagnostics;
    }

    case "assignment": {
      const target = lookup(scope, stmt.name);
      if (target.kind === "not-found") {
        return [typeError(`정의되지 않은 이름 '${target.name}'에 대입할 수 없습니다`)];
      }

      const value = checkExpr(stmt.value, scope, ctx);
      if (!value.ok) return value.diagnostics;
      if (value.type === target.binding.type) return [];

      return [typeError(
        `이름 '${stmt.name}'에는 ${target.binding.type} 타입을 대입해야 하지만 ${value.type} 타입입니다`,
      )];
    }

    case "while": {
      return [
        ...checkCondition(stmt.condition, scope, ctx),
        ...checkStatement(stmt.body, scope, ctx),
      ];
    }

    case "return": {
      const value = checkExpr(stmt.value, scope, ctx);

      // returnType: null은 곧 현재 위치가 어떤 함수에도 속하지 않는다는 뜻이다.
      // 값 식의 독립적인 오류도 먼저 보존하고, 함수 밖 return이라는 문맥 오류도 남긴다.
      if (ctx.returnType === null) {
        return [
          ...(!value.ok ? value.diagnostics : []),
          typeError("함수 밖에서는 return을 쓸 수 없습니다"),
        ];
      }

      if (!value.ok) return value.diagnostics;
      if (value.type === ctx.returnType) return [];

      return [typeError(
        `반환값은 ${ctx.returnType} 타입이어야 하지만 ${value.type} 타입입니다`,
      )];
    }

    case "exprStatement": {
      const expression = checkExpr(stmt.expression, scope, ctx);
      if (!expression.ok) return expression.diagnostics;

      // 문 자리에서는 값이 필요 없으므로 성공 여부만 확인하고 계산된 타입은 버린다.
      return [];
    }
  }
}

export function checkFuncDecl(
  func: FuncDecl,
  outerScope: Scope,
  functions: FunctionTable,
): readonly Diagnostic[] {
  const paramScope = createScope(outerScope);
  const diagnostics: Diagnostic[] = [];

  for (const param of func.params) {
    const declared = declare(paramScope, param.name, {
      type: param.typeAnnotation,
      kind: "param",
    });
    if (!declared) {
      diagnostics.push(typeError(
        `함수 '${func.name}'에 매개변수 이름 '${param.name}'이 중복되었습니다`,
      ));
    }
  }

  diagnostics.push(...checkStatement(func.body, paramScope, {
    functions,
    returnType: func.returnType,
  }));

  // 모든 실행 경로가 return에 도달하는지는 단순 타입 비교가 아니라 흐름 분석이
  // 필요하다. 이번 단계에서는 실제로 적힌 return의 값만 검사하고 그 분석은 하지 않는다.
  return diagnostics;
}

export function checkProgram(program: Program): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const mutableFunctions = new Map<string, FunctionSignature>();

  // 본문보다 먼저 모든 시그니처를 모으면 앞의 함수가 뒤에 적힌 함수를 호출할 수 있고,
  // 서로를 부르는 상호 재귀도 선언 순서와 무관해진다.
  for (const func of program.functions) {
    if (mutableFunctions.has(func.name)) {
      // 스코프 재선언과 같은 규칙으로 먼저 등록된 시그니처를 유지한다.
      diagnostics.push(typeError(`함수 '${func.name}'이 이미 선언되어 있습니다`));
      continue;
    }

    mutableFunctions.set(func.name, {
      params: func.params,
      returnType: func.returnType,
    });
  }

  const functions: FunctionTable = mutableFunctions;
  const globalScope = createScope(null);
  const topLevelContext: CheckContext = { functions, returnType: null };

  // 최상위 문 자체를 전역 스코프에서 차례로 검사해 선언을 모두 남긴 뒤 함수 본문을
  // 검사한다. 그래서 함수는 소스상 위치와 상관없이 전역 변수를 볼 수 있다. 명시적인
  // 최상위 블록은 checkStatement가 자식 스코프를 열므로 블록 경계는 그대로 지켜진다.
  for (const statement of program.statements) {
    diagnostics.push(...checkStatement(statement, globalScope, topLevelContext));
  }

  for (const func of program.functions) {
    diagnostics.push(...checkFuncDecl(func, globalScope, functions));
  }

  return diagnostics;
}
