// process.env.API_KEY에 붙인 타입을 실제 코드에서 쓰는 예제입니다.
// 같은 파일 안의 declare global로 전역 __DEV__ 플래그도 선언합니다.
// 검사: npx tsc --noEmit
// 실행: node --env-file=episodes/s16-declaration-files/.env.dev episodes/s16-declaration-files/env-flags.ts

// codeStep 242 — ProcessEnv 보강 덕분에 .toUpperCase()가 타입 오류 없이 통과합니다.

console.log("API 키:", process.env.API_KEY.toUpperCase());

// 실측 진단(env.d.ts를 치웠을 때) — 보강이 없으면 API_KEY는 string | undefined입니다:
// episodes/s16-declaration-files/env-flags.ts(8,23): error TS18048: 'process.env.API_KEY' is possibly 'undefined'.

// 실측(환경 변수를 넘기지 않고 실행했을 때) — 보강은 타입 층의 약속이지 실행 시점 검사가 아닙니다:
// TypeError: Cannot read properties of undefined (reading 'toUpperCase')

// codeStep 243 — export {} 한 줄로 이 파일을 모듈로 바꾼 뒤 declare global 블록에서 전역을 선언합니다.

export {}; // ← 이 한 줄이 파일을 모듈로 만들어 declare global을 쓸 수 있게 합니다.

declare global {
  var __DEV__: boolean;
}

globalThis.__DEV__ = process.env.NODE_ENV !== "production";

if (__DEV__) {
  console.log("개발 모드 — 상세 로그 출력");
} else {
  console.log("운영 모드 — 최소 로그 출력");
}

// 실측 진단(위 export {}; 한 줄만 지웠을 때) — 그 줄이 사라져 이후 행 번호가 하나씩 당겨집니다.
// 한 줄이 빠졌을 뿐인데 오류는 세 개입니다. declare global이 막히면 __DEV__ 선언 자체가 없어져,
// globalThis 경로와 맨 이름 경로가 함께 무너지기 때문입니다:
// episodes/s16-declaration-files/env-flags.ts(19,9): error TS2669: Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.
// episodes/s16-declaration-files/env-flags.ts(23,12): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
// episodes/s16-declaration-files/env-flags.ts(25,5): error TS2304: Cannot find name '__DEV__'.
