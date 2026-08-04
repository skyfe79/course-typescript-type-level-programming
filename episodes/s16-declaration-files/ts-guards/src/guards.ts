// 값을 가져오는 임포트와 타입만 가져오는 임포트가 나란히 놓이는 파일입니다.
//
// GuardResult는 toResult와 checkGuard의 반환 타입 자리에서만 쓰입니다. 런타임에는 이 이름이
// 필요 없으므로 import type으로 표시해, 이 줄이 컴파일 뒤 사라진다는 사실을 소스에 적어 둡니다.
// formatMessage는 assertDefined 안에서 실제로 호출되는 값이라 컴파일 뒤에도 남아야 합니다.
//
// 임포트 경로가 "./types.ts"가 아니라 "./types.js"인 이유는, 이 폴더가 node로 곧장 실행하는
// 화별 단일 파일이 아니라 tsc로 컴파일해 쓰는 라이브러리이기 때문입니다. 경로는 컴파일 결과인
// .js를 기준으로 적고, 타입 검사를 할 때는 타입스크립트가 그 옆의 types.ts를 찾아 줍니다.
//
// 검사: npx tsc --noEmit
// 컴파일 결과와 되돌리기 실험의 실측 기록은 이 파일 끝에 있습니다.

import type { GuardResult } from "./types.js";
import { formatMessage } from "./format.js";

// 반환 타입을 따로 적지 않았습니다. 추론된 boolean이 반환 타입이 되고,
// checkGuard는 참·거짓만 쓰므로 이 화에서는 그것으로 충분합니다.
export function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.length > 0;
}

export function assertDefined<T>(
  value: T,
  message = "값이 없습니다",
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(formatMessage("assertDefined", message));
  }
}

function toResult(ok: boolean, value: string): GuardResult {
  return ok ? { ok: true, value } : { ok: false, reason: "빈 문자열입니다" };
}

export function checkGuard(value: unknown): GuardResult {
  return toResult(isNonEmptyString(value), String(value));
}

// ─────────────────────────────────────────────────────────────────────────────
// 실측 기록 — verbatimModuleSyntax를 켜고 확인한 것
//
// 컴파일:    npx tsc -p episodes/s16-declaration-files/ts-guards
// 출력 확인: cat episodes/s16-declaration-files/ts-guards/dist/guards.js
//
// 저장소에 커밋된 상태는 import type을 붙인 쪽입니다. 아래 ③~⑤는 그 표시를 잠깐 지웠다가
// 다시 붙이는 실습에서 나온 값이라, 수강생이 직접 재현하는 것이 이 화의 실습입니다.
//
// ① dist/guards.js에 남은 임포트문은 아래 한 줄뿐입니다. GuardResult를 가져오는 문장은
//    출력 어디에도 없습니다.
//      import { formatMessage } from "./format.js";
//    (주석은 그대로 옮겨지므로 출력의 첫 줄은 이 주석 블록입니다. 사라진 것은 임포트문입니다.)
//
// ② dist/types.js — 타입만 있던 모듈도 파일 자체는 나오는데, 주석을 빼면 남는 것은 한 줄뿐입니다:
//      export {};
//
// ③ 14번째 줄의 import type을 일반 임포트(import { GuardResult } from "./types.js";)로
//    되돌리면, 이 폴더 설정으로 컴파일할 때 그 자리에서 멈춥니다:
//      episodes/s16-declaration-files/ts-guards/src/guards.ts(14,10): error TS1484:
//        'GuardResult' is a type and must be imported using a type-only import when
//        'verbatimModuleSyntax' is enabled.
//    (경로는 명령을 실행한 위치를 기준으로 찍힙니다. 위 값은 저장소 루트에서 돌렸을 때입니다.)
//
// ④ 그런데 같은 되돌린 상태에서 루트 게이트 npx tsc --noEmit은 0 오류로 통과합니다.
//    루트 tsconfig.json에는 verbatimModuleSyntax가 없어서 타입스크립트가 그 임포트를 조용히
//    지워 주기 때문입니다. 이 오류는 이 폴더의 설정으로 컴파일할 때만 드러납니다.
//
// ⑤ 플래그를 끈 채로 되돌린 코드를 내보내면(npx tsc -p … --verbatimModuleSyntax false)
//    오류 없이 컴파일되고, 출력은 import type을 붙였을 때와 글자 하나 다르지 않습니다.
//    소거는 어차피 일어나는데 그 사실이 소스에 적혀 있지 않다는 것, 그것이 이 플래그가
//    없애려는 문제입니다.
// ─────────────────────────────────────────────────────────────────────────────

