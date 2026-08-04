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
