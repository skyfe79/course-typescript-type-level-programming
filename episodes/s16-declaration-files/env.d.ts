// process.env에 이 강좌가 쓰는 환경 변수 타입을 붙이는 전역 선언 파일입니다.
// import·export가 없으면 파일 자체가 이미 전역이라 declare global 없이 바로 선언합니다.
// 검사: npx tsc --noEmit
// 선언만 담은 파일이라 실행 대상이 아닙니다(그래서 실행 줄이 없습니다).

// codeStep 242 — 전역 .d.ts에서 NodeJS.ProcessEnv 인터페이스를 보강합니다.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

// 실측 진단(declare를 빼고 맨 namespace NodeJS { 로 적었을 때):
// episodes/s16-declaration-files/env.d.ts(8,1): error TS1046: Top-level declarations in .d.ts files must start with either a 'declare' or 'export' modifier.
