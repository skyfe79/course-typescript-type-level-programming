// 식 AST를 따라가며 각 노드를 사람이 읽을 수 있는 자바스크립트 텍스트로 바꾼다.

import type { Expr } from "./ast.ts";

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
