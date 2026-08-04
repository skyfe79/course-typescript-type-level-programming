// 전역 버전 문자열을 런타임에서 쓰는 예제입니다.
// declare var 하나가 globalThis와 맨 이름 양쪽에 타입을 주는지 확인합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/global-version.ts

// codeStep 241 — declare var가 두 가지 전역 접근 경로를 동시에 타입 지정합니다.

globalThis.__APP_VERSION__ = "release-7d3f2a";
console.log(globalThis.__APP_VERSION__);
console.log(__APP_VERSION__);
