// 이 파일은 배럴(barrel)입니다. 여러 소스 파일에 흩어진 모듈을 한 진입점으로 모아 다시 내보냅니다.
// package.json의 exports 맵이 가리키는 공개 API가 결국 이 파일에서 정해집니다.
//
// toResult와 formatMessage는 일부러 내보내지 않습니다. 둘 다 내부 구현이므로, 패키지를 설치한 쪽이
// 기대해도 되는 표면에서 빠집니다. 무엇을 공개하지 않을지 정하는 것도 배럴의 일입니다.
//
// GuardResult는 타입이라 export type으로 내보내야 합니다. 그냥 export로 적으면
// verbatimModuleSyntax가 "타입은 타입 전용 구문으로 내보내라"고 걸러 냅니다.
// 경로는 컴파일 결과를 기준으로 적기 때문에 ./guards.ts가 아니라 ./guards.js입니다.
//
// 실측해 보면 isolatedDeclarations가 켜져 있어도 이런 재수출은 오류가 나지 않습니다.
// dist/index.d.ts에는 아래 두 줄이 글자 그대로 나옵니다. npm publish 때 담길 파일은
// package.json의 files: ["dist"]가 정하므로, 저장소에 src가 있는 것과 배포물에 src가 담기는 것은 별개입니다.
export { isNonEmptyString, assertDefined, checkGuard } from "./guards.js";
export type { GuardResult } from "./types.js";
