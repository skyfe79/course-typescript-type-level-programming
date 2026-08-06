// @ts-check
// 앞 파일의 다섯 예제를 TypeScript 7.0이 이해하는 표기로 고친 결과입니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict --allowJs --checkJs episodes/s35-comment-directives/jsdoc-legacy-after.js
// 실행: node episodes/s35-comment-directives/jsdoc-legacy-after.js
// 검사는 오류 없이 통과하고, 실행하면 Hello, Ada up legacy {"x":1,"y":2} HELLO가 출력됩니다.
// JSDoc과 생성자 표기만 현대화했으므로 앞 파일과 런타임 동작은 같습니다.

const defaultUser = { name: "Ada" };

// ① 값이 가진 타입이 필요하다는 뜻을 타입 공간의 typeof로 분명하게 적습니다.
/** @param {typeof defaultUser} u */
function greetAfter(u) {
  return `Hello, ${u.name}`;
}

const Direction = {
  Up: 1,
  Down: 2,
};

// ② @enum 태그는 이제 아무 타입도 만들지 못하므로 그대로 지웠습니다. 대신 값 객체에서
// 프로퍼티 타입을 직접 계산해, 예전에 @enum이 해 주던 일을 표준 타입 문법으로 적습니다.
/** @typedef {(typeof Direction)[keyof typeof Direction]} DirectionValue */

/** @param {DirectionValue} d */
function moveAfter(d) {
  return d === Direction.Up ? "up" : "down";
}

// ③ 알 수 없는 값에는 TypeScript 표준 타입인 unknown을 사용합니다.
/** @type {unknown} */
let anythingAfter = "legacy";

// ④ @class와 @constructor 어느 쪽도 평범한 함수를 생성자로 만들어 주지 않습니다.
// 생성자 함수라는 옛 관례를 실제 class로 옮기고, 매개변수 타입은 constructor에 적습니다.
class PointAfter {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// ⑤ 의미가 없어진 후위 !를 지우면 의도했던 string 타입이 그대로 드러납니다.
/** @param {string} name */
function shoutAfter(name) {
  return name.toUpperCase();
}

// 고치기 전 파일과 같은 다섯 값을 같은 순서로 출력해 런타임 동작이 같음을 확인합니다.
console.log(greetAfter(defaultUser), moveAfter(Direction.Up), anythingAfter, JSON.stringify(new PointAfter(1, 2)), shoutAfter("hello"));

// 다른 예제의 최상위 이름과 전역에서 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
