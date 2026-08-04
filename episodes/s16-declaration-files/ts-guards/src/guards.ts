// 값을 가져오는 임포트와 타입만 가져오는 임포트가 나란히 놓이는 파일입니다.
//
// GuardResult는 toResult와 checkGuard의 반환 타입 자리에서만 쓰입니다. 런타임에는 이 이름이
// 필요 없으므로 import type으로 표시해, 이 줄이 컴파일 뒤 사라진다는 사실을 소스에 적어 둡니다.
// formatMessage는 assertDefined 안에서 실제로 호출되는 값이라 컴파일 뒤에도 남아야 합니다.
//
// 임포트 경로가 "./types.ts"가 아니라 "./types.js"인 이유는, 이 폴더가 node로 곧장 실행하는
// 화별 단일 파일이 아니라 tsc로 컴파일해 쓰는 라이브러리이기 때문입니다. 경로는 컴파일 결과인
// .js를 기준으로 적고, 타입 검사를 할 때는 타입스크립트가 그 옆의 types.ts를 찾아 줍니다.
// 검사는 두 가지입니다. 저장소 전체 타입 게이트는 npx tsc --noEmit이고, 이 폴더의 진짜 검사는
// 선언 파일 출력까지 하는 npx tsc -p episodes/s16-declaration-files/ts-guards입니다.
// 컴파일 결과와 되돌리기 실험의 실측 기록은 이 파일 끝에 있습니다.

import type { GuardResult } from "./types.js";
import { formatMessage } from "./format.js";

// : boolean만 적어도 오류는 사라지지만, 타입 술어로 적으면 호출한 자리에서 value가 string으로 좁혀집니다.
// 다만 참 분기에서만 엄밀합니다 — 빈 문자열도 string인데 false가 나오므로 거짓 분기는 읽지 않습니다.
export function isNonEmptyString(value: unknown): value is string {
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
// 실측 기록 — 이 폴더 설정으로 컴파일해 확인한 것
//   ①~⑤ verbatimModuleSyntax  ·  ⑥~⑨ declaration과 isolatedDeclarations  ·  ⑩ 배럴과 배포
//
// 컴파일:    npx tsc -p episodes/s16-declaration-files/ts-guards
// 출력 확인: cat episodes/s16-declaration-files/ts-guards/dist/guards.js
//            cat episodes/s16-declaration-files/ts-guards/dist/guards.d.ts
//
// 커밋된 상태는 import type을 붙이고 반환 타입 술어까지 적어 둔 쪽입니다. ③~⑤와 ⑥·⑦은 그
// 표시를 잠깐 지웠다가 다시 붙이는 실험에서 나온 값이라, 직접 재현해 보는 것이 실습입니다.
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
//    오류 없이 컴파일되고, 자바스크립트 출력 dist/guards.js는 import type을 붙였을 때와
//    글자 하나 다르지 않습니다. 소거는 어차피 일어나는데 그 사실이 소스에 적혀 있지 않다는 것,
//    그것이 이 플래그가 없애려는 문제입니다.
//    다만 declaration을 켠 지금은 선언 파일까지 나오는데, 이쪽은 갈립니다. dist/guards.d.ts의
//    첫 줄은 소스를 그대로 따라가서, import type이면 import type으로, 되돌리면 import로 적힙니다.
//
// ⑥ 19번째 줄의 : value is string을 지우고 isolatedDeclarations만 잠시 끄면
//    (npx tsc -p … --isolatedDeclarations false) 오류 없이 통과하고, 어노테이션이 없어도
//    dist/guards.d.ts에는 추론된 타입이 그대로 적힙니다:
//      export declare function isNonEmptyString(value: unknown): boolean;
//    프로젝트 전체를 함께 검사하므로 본문을 평가해 반환 타입을 알아낼 수 있기 때문입니다.
//
// ⑦ 같은 어노테이션 없는 상태에서 두 옵션을 다 켜고 컴파일하면 그 자리에서 멈춥니다:
//      episodes/s16-declaration-files/ts-guards/src/guards.ts(20,10): error TS9013:
//        Expression type can't be inferred with --isolatedDeclarations.
//    오류가 가리키는 곳은 함수 이름이 아니라 반환하는 표현식입니다.
//    typeof value === "string" && value.length > 0은 파일 하나만 보고 타입을 정할 수 없습니다.
//    같은 컴파일에서 assertDefined·checkGuard·toResult는 이미 명시적 어노테이션이 있어
//    오류가 나지 않습니다. 오류는 이 한 곳뿐입니다.
//
// ⑧ 어노테이션을 붙인 뒤, 현재 커밋된 상태에서 같은 명령은 0 오류로 통과하고,
//    dist/guards.d.ts에 적힌 그대로가 소스의 어노테이션과 일치합니다:
//      export declare function isNonEmptyString(value: unknown): value is string;
//
// ⑨ ⑦의 오류가 나는 동안에도 루트 게이트 npx tsc --noEmit은 0 오류로 통과합니다.
//    루트 tsconfig.json에 isolatedDeclarations가 없기 때문입니다. 오류는 이 폴더의 설정으로
//    컴파일할 때만 드러납니다.
//
// ⑩ 배럴 src/index.ts를 넣은 뒤 npx tsc -p episodes/s16-declaration-files/ts-guards를 돌리면
//    dist에 여덟 파일이 나옵니다. index·guards·format·types 네 모듈마다 .js와 .d.ts가
//    하나씩 생깁니다. 배럴을 넣기 전에는 여섯 파일이었습니다.
//    빌드에 필요한 rootDir과 outDir은 앞에서 이미 tsconfig.json에 넣어 두었으므로, 이번에
//    설정을 더 고칠 것은 없습니다. 같은 명령을 그대로 돌려 결과만 확인하면 됩니다.
//    dist/index.d.ts는 소스 배럴과 글자 그대로 같습니다:
//      export { isNonEmptyString, assertDefined, checkGuard } from "./guards.js";
//      export type { GuardResult } from "./types.js";
//    재수출은 isolatedDeclarations가 요구하는 어노테이션 대상이 아닙니다. 내보내는 이름의
//    타입은 이미 guards.d.ts와 types.d.ts에 적혀 있기 때문입니다.
// ─────────────────────────────────────────────────────────────────────────────
