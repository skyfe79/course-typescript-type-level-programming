// 타입 없는 JavaScript 의존성에 선언 파일로 타입을 적용하는 예제입니다.
// 선언 파일이 strict 모드에서 암묵적 any를 막는 방식을 확인합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/main.ts

// codeStep 239 — 선언 파일로 JavaScript 모듈의 타입을 연결합니다.

import { formatPrice } from "./vendor/priceFormatter.js";

console.log(formatPrice(1999));

// @ts-expect-error - 선언 파일이 cents를 number로 요구하므로 string 인수는 오류입니다.
formatPrice("1999");
// 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
// episodes/s16-declaration-files/main.ts(12,13): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

// 실측 진단(vendor/priceFormatter.d.ts만 치웠을 때) — 오류가 두 개 나옵니다:
// episodes/s16-declaration-files/main.ts(8,29): error TS7016: Could not find a declaration file for module './vendor/priceFormatter.js'. '.../vendor/priceFormatter.js' implicitly has an 'any' type.
// episodes/s16-declaration-files/main.ts(12,1): error TS2578: Unused '@ts-expect-error' directive.
// 두 번째 오류가 이 화의 요점입니다. 선언 파일이 없으면 formatPrice가 통째로 any가 되어
// 위의 잘못된 문자열 인수까지 검사를 통과합니다. 선언 파일 하나가 그 검사를 되살립니다.
