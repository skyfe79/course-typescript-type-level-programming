// @ts-check
// TypeScript 7.0이 더는 특별 취급하지 않는 예전 JSDoc 관례 다섯 가지를 한곳에 모았습니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict --allowJs --checkJs episodes/s35-comment-directives/jsdoc-legacy-before.js
// 실행: node episodes/s35-comment-directives/jsdoc-legacy-before.js
// 검사는 일부러 실패하지만 실행하면 Hello, Ada up legacy {"x":1,"y":2} HELLO가 출력됩니다.
// 13행의 ①은 TS2749, 25행의 ②도 TS2749, 31행의 ③은 TS1110을 냅니다.
// ④는 36행의 x와 y에서 TS7006 두 번, 37·38행의 this에서 TS2683 두 번, 48행의 new에서
// TS7009 한 번을 내므로 오류는 정확히 여덟 줄입니다. 42행의 ⑤는 의미 없이 무시되어 조용합니다.

// ① 예전에는 값의 이름을 타입처럼 쓰기도 했지만, 이제 값과 타입의 공간을 구분해야 합니다.
const defaultUser = { name: "Ada" };

/** @param {defaultUser} u */
function greetBefore(u) {
  return `Hello, ${u.name}`;
}

// ② @enum 태그는 객체를 만들 뿐 Direction이라는 타입을 만들지 못합니다.
/** @enum {number} */
const Direction = {
  Up: 1,
  Down: 2,
};

/** @param {Direction} d */
function moveBefore(d) {
  return d === Direction.Up ? "up" : "down";
}

// ③ Closure 문법의 단독 ?는 더 이상 알 수 없는 타입을 뜻하지 않습니다.
/** @type {?} */
let anythingBefore = "legacy";

// ④ @class를 붙인 평범한 함수는 더 이상 생성자 함수로 특별 취급되지 않습니다.
/** @class */
function PointBefore(x, y) {
  this.x = x;
  this.y = y;
}

// ⑤ 후위 !는 7.0.2에서도 파싱되지만 그냥 무시됩니다. string!은 string과 같습니다.
/** @param {string!} name */
function shoutBefore(name) {
  return name.toUpperCase();
}

// 다섯 예시는 타입 검사 결과만 다를 뿐, 모두 평범한 JavaScript로 실행할 수 있습니다.
console.log(greetBefore(defaultUser), moveBefore(Direction.Up), anythingBefore, JSON.stringify(new PointBefore(1, 2)), shoutBefore("hello"));

// 다른 예제의 최상위 이름과 전역에서 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
