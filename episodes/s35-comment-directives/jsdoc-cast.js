// @ts-check
// 이 파일은 JSDoc @type 단언이 표현식에 적용되려면 괄호가 필요함을 보여 줍니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict --allowJs --checkJs episodes/s35-comment-directives/jsdoc-cast.js
// 실행: node episodes/s35-comment-directives/jsdoc-cast.js
// 검사하면 wrong.name에서만 TS18046이 나와야 하고, 실행하면 두 줄 모두 Ada가 출력됩니다.
// 괄호는 런타임 값에 영향을 주지 않고, 오직 검사기가 JSDoc 단언을 해석하는 방식만 바꿉니다.

/** @typedef {{ id: number; name: string }} User */

/** @type {unknown} */
const raw = JSON.parse('{"id":1,"name":"Ada"}');

// 괄호 없이 붙인 주석 — 표현식에 붙지 않아 단언이 무시된다
const wrong = /** @type {User} */ raw;
console.log(wrong.name);

// 표현식 전체를 괄호로 감싼 주석 — 단언이 실제로 적용된다
const right = /** @type {User} */ (raw);
console.log(right.name);

// 다른 예제의 최상위 이름과 전역에서 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
