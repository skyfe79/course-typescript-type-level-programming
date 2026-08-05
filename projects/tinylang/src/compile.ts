// 렉서·파서·검사기의 서로 다른 실패 모양을 하나로 모으는 순수한 컴파일 경계다.
// 파일 경로가 아니라 소스 문자열만 받으므로 디스크나 프로세스 없이도 그대로 재사용할 수 있다.

import type { Program } from "./ast.ts";
import { checkProgram } from "./checker.ts";
import type { Diagnostic } from "./diagnostics.ts";
import { tokenize } from "./lexer.ts";
import { createParser } from "./parser.ts";

export type CompileResult =
  | { readonly ok: true; readonly program: Program }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };

export function compile(source: string): CompileResult {
  const lexed = tokenize(source);
  // 렉싱 오류가 난 뒤의 토큰 열은 온전하다고 볼 수 없으므로 파서로 넘기지 않는다.
  if (lexed.diagnostics.length > 0) {
    return { ok: false, diagnostics: lexed.diagnostics };
  }

  const parsed = createParser(lexed.tokens).parseProgram();
  // 파서는 첫 실패 하나에서 멈추지만, 바깥에는 다른 단계와 같은 진단 배열로 감싸 공개한다.
  if (!parsed.ok) {
    return { ok: false, diagnostics: [parsed.diagnostic] };
  }

  const diagnostics = checkProgram(parsed.value);
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  return { ok: true, program: parsed.value };
}

export function formatDiagnostic(diagnostic: Diagnostic): string {
  // 검사기 AST 노드에는 아직 위치가 없어 줄이 0이다. AST 노드에 위치가 생기면
  // 모든 진단이 실제 줄을 갖게 되므로 이 분기는 사라진다.
  if (diagnostic.line > 0) {
    return `줄 ${diagnostic.line}: ${diagnostic.severity}: ${diagnostic.message}`;
  }

  return `${diagnostic.severity}: ${diagnostic.message}`;
}
