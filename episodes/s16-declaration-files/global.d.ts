// 프로젝트 전체에 전역 선언을 공급하는 선언 파일입니다.
// 최상위 import/export가 없으면 이 파일 자체가 전역 선언 공간이 되는지 확인합니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: .d.ts는 런타임 코드가 아니라 타입 검사 전용 선언입니다.
// 이 repo는 tsconfig.json에 include가 없어 node_modules 밖 모든 .ts/.d.ts가 한 프로그램입니다.
// 그래서 이 파일을 섹션 폴더 안에 두어도 프로젝트 전체에 같은 전역 선언으로 적용됩니다.
// 파일 이름과 위치가 아니라 최상위 import/export가 없다는 사실이 전역 선언을 만듭니다.

// codeStep 241 — 전역 선언 파일에서 값, Window, 이미지 모듈 타입을 한 번에 선언합니다.

declare var __APP_VERSION__: string;
// 실측 진단(이 declare var 한 줄만 지웠을 때) — global-version.ts에서 오류가 세 개 납니다:
// episodes/s16-declaration-files/global-version.ts(8,12): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
// episodes/s16-declaration-files/global-version.ts(9,24): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
// episodes/s16-declaration-files/global-version.ts(10,13): error TS2304: Cannot find name '__APP_VERSION__'.
// 오류가 세 개인 것이 요점입니다. declare var 한 줄이 맨 이름과 globalThis 프로퍼티,
// 두 접근 경로에 동시에 타입을 붙이고 있었다는 사실이 그것을 지웠을 때 드러납니다.

interface Window {
  __APP_VERSION__: string;
}
// 이 interface Window는 새 타입을 만드는 선언이 아니라 기본 DOM lib의 Window를 보강합니다.
// 이 repo의 tsconfig.json은 lib을 지정하지 않으므로 TypeScript가 DOM을 포함한 기본 lib 전체를 싣습니다.
// types: ["node"]는 @types 패키지만 제한할 뿐 lib.dom.d.ts 같은 lib 파일과는 무관합니다.
// 실측: npx tsc --noEmit --listFilesOnly에 lib.dom.d.ts가 실제로 들어 있습니다.
// 실측 진단(window.__NOPE__ 처럼 없는 프로퍼티를 읽었을 때):
// error TS2339: Property '__NOPE__' does not exist on type 'Window & typeof globalThis'.
// 타입 이름이 Window & typeof globalThis인 것이 보강의 증거입니다. 여기 없는 이름만 걸리고,
// window.__APP_VERSION__은 위 보강 덕분에 통과합니다.

declare module "*.png" {
  const src: string;
  export default src;
}
// 실측 진단(이 declare module 블록만 지웠을 때):
// episodes/s16-declaration-files/asset-check.ts(8,18): error TS2307: Cannot find module './assets/logo.png' or its corresponding type declarations.

// 실측(이 파일 끝에 export {}; 한 줄만 붙였을 때) — 위 세 선언이 한꺼번에 사라집니다:
// episodes/s16-declaration-files/asset-check.ts(8,18): error TS2307: Cannot find module './assets/logo.png' or its corresponding type declarations.
// episodes/s16-declaration-files/global-version.ts(8,12): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
// episodes/s16-declaration-files/global-version.ts(9,24): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
// episodes/s16-declaration-files/global-version.ts(10,13): error TS2304: Cannot find name '__APP_VERSION__'.
// 앞 화의 규칙 그대로입니다. 최상위 export 한 줄이 이 파일을 모듈로 바꾸고, 그 순간 declare var도
// interface Window 보강도 와일드카드 모듈 선언도 전부 이 파일 안으로 갇힙니다.
