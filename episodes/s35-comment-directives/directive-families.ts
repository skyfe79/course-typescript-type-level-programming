/// <reference types="node" />
// 컴파일러가 실제로 읽는 주석 지시어 네 계열과 각 계열의 역할을 한 파일에서 비교합니다.
// 지시어가 있는 파일 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/directive-families.ts
// 지시어를 뺀 쌍둥이 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/directive-free.ts
// 실행: node episodes/s35-comment-directives/directive-families.ts
// 파일을 직접 지정할 때는 상위 tsconfig를 읽지 않겠다는 --ignoreConfig와, 그 대신 엄격한 검사를
// 켜는 --strict를 함께 씁니다. 직전 화에서 배운 플래그가 이번 비교를 독립적으로 재현해 줍니다.

// ── 계열 3: 트리플 슬래시 참조 — 프로그램에 끌어들일 타입 선언을 지정한다
// 파일의 첫 줄은 Node 타입 선언을 이 파일에 포함합니다. 그 줄이 없으면 아래 process를 알 수 없어
// TS2591이 발생하므로, 이 참조는 설명용 장식이 아니라 실제 검사 결과를 바꾸는 지시어입니다.

// ── 계열 1: 억제 — 바로 다음 줄의 오류를 지운다
// @ts-ignore는 다음 줄에 오류가 있더라도 그 진단을 숨깁니다. 여기서는 문자열을 number에 대입해
// 원래라면 발생할 TS2322를 억제하고, 런타임 값은 그대로 남는다는 점을 함께 확인합니다.
// @ts-ignore
const mismatch: number = "not a number";

// ── 계열 2: 파일 단위 검사 — .js 맨 위에서 그 파일의 검사를 켜거나 끈다 (인용만)
// @ts-check와 @ts-nocheck는 JavaScript 파일에 쓰는 지시어입니다. 이 화에서는 뒤 화의 실제 .js
// 실습과 겹치지 않도록 실행 가능한 지시어가 아니라 문자열 안의 예시로만 보관합니다.
const fileLevelCheckExample = '// @ts-check   (반대는 // @ts-nocheck)';

// ── 계열 4: JSDoc 타입 문법 — .js 안에서 타입을 적는 자리를 제공한다 (인용만)
// JavaScript에는 TypeScript 타입 표기를 직접 적을 수 없으므로 JSDoc 주석이 타입의 자리가 됩니다.
// 이것도 이번 화에서는 문자열로만 보여 주고, 실제 .js 파일에서의 검사는 뒤 화에 맡깁니다.
const jsdocExample = '/** @type {number} */\nlet total;';

// 타입 오류가 억제되어도 값은 바뀌지 않으며, 트리플 슬래시로 불러온 Node 선언 덕분에
// process.platform은 엄격한 파일 단위 검사에서도 이름을 찾을 수 있습니다.
console.log(mismatch, process.platform, fileLevelCheckExample, jsdocExample);

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
