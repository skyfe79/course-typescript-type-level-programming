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

import type { GuardResult } from "./types.js";
import { formatMessage } from "./format.js";

// 타입 술어라 참이 나오면 value가 string으로 좁혀집니다.
// 비어 있지 않다는 조건은 그 위에 얹은 런타임 검사입니다.
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
