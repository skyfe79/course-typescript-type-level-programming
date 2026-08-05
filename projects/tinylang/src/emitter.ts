// AST를 따라가며 식·문·함수 선언을 사람이 읽을 수 있는 자바스크립트 텍스트로 바꾼다.

import type { Block, Expr, FuncDecl, IfStatement, Program, Statement } from "./ast.ts";

// 런타임 프렐류드는 생성된 코드의 바깥에서 이 네 이름으로 제공된다. as const를
// 붙여 각 원소를 넓은 string이 아니라 정확한 문자열 리터럴 타입으로 보존한다.
// 목록과 타입을 한곳에서 만들면 이름을 더할 때 값과 타입을 따로 고칠 필요가 없다.
export const BUILTIN_NAMES = ["print", "input", "toNumber", "random"] as const;
export type BuiltinName = (typeof BUILTIN_NAMES)[number];

// 포함 여부는 매 호출마다 배열을 순회하지 않고 집합에서 찾는다. ReadonlySet으로
// 노출 범위를 좁혀 두어, 코드 생성 도중 프렐류드 이름 목록이 바뀌지 않게 한다.
const builtinNames: ReadonlySet<string> = new Set(BUILTIN_NAMES);

export function isBuiltin(name: string): boolean {
  return builtinNames.has(name);
}

export function mangle(name: string): string {
  // 사용자 이름에는 항상 $를 붙인다. 프렐류드는 $ 없는 원래 이름을 사용하므로
  // print처럼 똑같은 철자의 사용자 정의 이름도 생성된 자바스크립트에서는 겹치지 않는다.
  // 해시 대신 원래 철자를 남겨, 생성 결과만 보아도 어느 선언에서 온 이름인지 알 수 있다.
  return `$${name}`;
}

export function emitExpr(expr: Expr): string {
  switch (expr.kind) {
    case "literal":
      // AST의 리터럴은 number | string | boolean뿐이다. JSON 표기는 이 세 종류에서
      // 자바스크립트 리터럴과 같고, 문자열의 따옴표와 특수 문자 이스케이프도 맡아 준다.
      return JSON.stringify(expr.value);

    case "identifier":
      // 식별자 식은 모두 사용자가 선언한 값을 가리키므로 프렐류드와 분리한다.
      return mangle(expr.name);

    case "binary": {
      // 자식마다 다시 emitExpr를 적용하고 현재 식도 괄호로 감싼다. 이렇게 하면 AST가
      // 나타내는 결합 순서가 대상 언어의 우선순위에 기대지 않고 텍스트에 그대로 남는다.
      const left = emitExpr(expr.left);
      const right = emitExpr(expr.right);
      return `(${left} ${expr.operator} ${right})`;
    }

    case "unary": {
      // 단항식도 괄호로 경계를 드러내어 더 큰 식의 자식이 되어도 묶임이 바뀌지 않는다.
      const operand = emitExpr(expr.operand);
      return `(${expr.operator}${operand})`;
    }

    case "call": {
      // 프렐류드 함수는 런타임이 제공하는 이름 그대로 부르고, 사용자 정의 함수만
      // 변수와 같은 규칙으로 맹글링한다. 인자 안의 모든 식도 빠짐없이 재귀 변환한다.
      const callee = isBuiltin(expr.callee) ? expr.callee : mangle(expr.callee);
      const args = expr.args.map(emitExpr).join(", ");
      return `${callee}(${args})`;
    }

    default: {
      // 위에서 모든 kind를 처리했다면 여기 도달한 값의 타입은 never다. 나중에 노드 종류가
      // 하나 늘고 그 case를 빠뜨리면 늘어난 갈래가 never에 대입되지 않아 컴파일 오류가 난다.
      // 외부 JSON처럼 타입 단언을 거친 값이 흘러오면 실행 중에도 이 throw가 그 자리에서
      // 멈춰 세우므로, 타입 검사 뒤에 남은 죽은 코드가 아니라 런타임 경계의 방어이기도 하다.
      const exhaustive: never = expr;
      throw new Error(`처리하지 않은 식 종류입니다: ${JSON.stringify(exhaustive)}`);
    }
  }
}

// 문과 함수 선언이 반환하는 텍스트는 첫 줄을 포함한 모든 줄을 level만큼
// 들여쓴다. 한 단계는 공백 두 칸이다. 블록 자체는 `{` 앞의 들여쓰기를 붙이지
// 않고, 자식 문은 level + 1, 닫는 `}`는 level로 들여쓴다. 여는 중괄호가 놓일
// 자리의 들여쓰기는 블록을 출력하는 헤더나 독립 블록 문이 맡는다.
const INDENT = "  ";

function indent(level: number): string {
  return INDENT.repeat(level);
}

function emitIfWithoutIndent(stmt: IfStatement, level: number): string {
  // 바깥 들여쓰기는 이 if를 문으로 출력하는 쪽에서 한 번만 붙인다. 재귀 호출도
  // 들여쓰기 없는 `if`로 시작하므로 else if 사슬을 그대로 이어 붙일 수 있다.
  let emitted = `if (${emitExpr(stmt.condition)}) ${emitBlock(stmt.thenBranch, level)}`;

  if (stmt.elseBranch === null) return emitted;

  if (stmt.elseBranch.kind === "block") {
    return `${emitted} else ${emitBlock(stmt.elseBranch, level)}`;
  }

  emitted += ` else ${emitIfWithoutIndent(stmt.elseBranch, level)}`;
  return emitted;
}

export function emitStatement(stmt: Statement, level: number = 0): string {
  const currentIndent = indent(level);

  switch (stmt.kind) {
    case "block":
      // 독립 블록 문은 헤더가 없으므로 문 emitter가 여는 중괄호 앞의 들여쓰기를
      // 붙인다. 블록 안의 자식과 닫는 중괄호는 emitBlock의 규약을 따른다.
      return `${currentIndent}${emitBlock(stmt, level)}`;

    case "if":
      // 헬퍼는 if 한 덩어리를 들여쓰기 없이 만들고, 문 emitter가 규약에 맞춰
      // 첫 줄의 들여쓰기를 붙인다. else if도 헬퍼 안에서 같은 형태로 재귀한다.
      return `${currentIndent}${emitIfWithoutIndent(stmt, level)}`;

    case "varDecl":
      // declaredType은 타입 검사에만 필요하다. 자바스크립트에는 타입 어노테이션을
      // 남길 자리가 없으므로 이름과 초기화식만 let 선언으로 내보낸다.
      return `${currentIndent}let ${mangle(stmt.name)} = ${emitExpr(stmt.initializer)};`;

    case "assignment":
      return `${currentIndent}${mangle(stmt.name)} = ${emitExpr(stmt.value)};`;

    case "while":
      return `${currentIndent}while (${emitExpr(stmt.condition)}) ${emitBlock(stmt.body, level)}`;

    case "return":
      return `${currentIndent}return ${emitExpr(stmt.value)};`;

    case "exprStatement":
      // 호출도 식이므로 문 자리에서는 다른 식과 마찬가지로 세미콜론만 붙인다.
      return `${currentIndent}${emitExpr(stmt.expression)};`;

    default: {
      // Statement에 새 갈래가 추가되었는데 위 case를 빠뜨리면 never 대입이
      // 컴파일 오류를 만든다. 타입 밖의 값이 들어오는 실행 경계도 throw로 막는다.
      const exhaustive: never = stmt;
      throw new Error(`처리하지 않은 문 종류입니다: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function emitBlock(block: Block, level: number = 0): string {
  const currentIndent = indent(level);
  const statements = block.statements.map((statement) => emitStatement(statement, level + 1));

  // 빈 블록도 여는 줄과 닫는 줄을 따로 두어, 문이 생겼을 때 출력 모양이
  // 갑자기 달라지지 않게 한다. `{`의 들여쓰기는 호출자가 붙이고, 자식은 이미
  // 자기 첫 줄까지 들여쓴 문자열이며 닫는 중괄호만 현재 level로 맞춘다.
  return [
    "{",
    ...statements,
    `${currentIndent}}`,
  ].join("\n");
}

export function emitFunction(func: FuncDecl, level: number = 0): string {
  const currentIndent = indent(level);
  const params = func.params.map((param) => mangle(param.name)).join(", ");

  // 매개변수의 typeAnnotation과 함수의 returnType은 검사 단계에서 역할을 마쳤다.
  // 자바스크립트 함수에는 두 타입 어노테이션을 남기지 않고, 사용자 이름만 같은
  // mangle 규칙으로 바꾼다. 본문은 Block이므로 문에서 쓰던 emitter를 그대로 쓴다.
  return `${currentIndent}function ${mangle(func.name)}(${params}) ${emitBlock(func.body, level)}`;
}

export function emitProgram(program: Program): string {
  // 코드 생성 시점에는 어떤 내장 함수가 실제로 쓰였는지 따로 추적하지 않는다. 언제나
  // 네 이름을 한꺼번에 가져오면 식 emitter와 프렐류드 사이의 계약이 단순하고 일정하다.
  // 생성 파일은 ESM으로 실행되므로 require가 아니라 import를 쓰며, Node의 ESM 해석은
  // 상대 경로의 확장자를 자동으로 보충하지 않으므로 지정자에 .js까지 반드시 적는다.
  // 이 import가 가리키는 prelude.js는 아직 없고, 다음 화에서 런타임 구현으로 추가한다.
  const prelude = 'import { print, input, toNumber, random } from "./prelude.js";';

  // 함수 선언끼리는 빈 줄 하나를 두되, 함수가 하나도 없으면 빈 문자열을 만든다.
  // 최상위 문은 소스의 순서를 유지하며 모두 level 0에서 변환한다.
  const functions = program.functions.map((func) => emitFunction(func, 0)).join("\n\n");
  const statements = program.statements.map((statement) => emitStatement(statement, 0)).join("\n");

  // 비어 있는 구역을 먼저 제거해야 함수나 문이 없는 프로그램에 불필요한 빈 줄이
  // 생기지 않는다. 남은 구역 사이는 빈 줄 하나로 나누고, 파일 마지막에는 정확히
  // 한 번의 줄바꿈을 붙여 디스크에 저장했을 때 마지막 줄이 잘리지 않게 한다.
  const sections = [prelude, functions, statements].filter((section) => section.length > 0);
  return `${sections.join("\n\n")}\n`;
}
