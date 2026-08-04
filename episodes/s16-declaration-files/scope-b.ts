// scope-a.ts가 모듈이 된 뒤 sharedFlag가 전역 스크립트에서 사라지는지 검사로 확인하는 파일입니다.
// 실행 대상이 아닙니다. 런타임에서도 ReferenceError이며, 타입 층의 전역 스코프와 Node ESM 런타임 스코프가 다르기 때문입니다.
// 검사: npx tsc --noEmit

// codeStep 240 — 모듈 스코프의 이름은 전역 스크립트에서 찾을 수 없습니다.

// @ts-expect-error - scope-a.ts의 export {};가 sharedFlag를 그 모듈 내부로 제한합니다.
console.log("sharedFlag:", sharedFlag);
// 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
// episodes/s16-declaration-files/scope-b.ts(7,28): error TS2304: Cannot find name 'sharedFlag'.
// 런타임 실측:
// node episodes/s16-declaration-files/scope-b.ts
// ReferenceError: sharedFlag is not defined
// scope-a.ts에 export {};가 없던 시점에도 런타임 결과는 같았습니다.
// 전역 스코프는 타입 층의 규칙이며 Node ESM의 실행 스코프와 별개입니다.
