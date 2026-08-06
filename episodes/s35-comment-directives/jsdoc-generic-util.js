// @ts-check
// 이 파일은 JSDoc만으로 JavaScript 함수의 타입 매개변수와 반환 타입을 연결하는 방법을 보여 줍니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict --allowJs --checkJs episodes/s35-comment-directives/jsdoc-generic-util.js
// 실행: node episodes/s35-comment-directives/jsdoc-generic-util.js
// 검사하면 오류 없이 통과해야 하고, 실행하면 [ 'Ada', 'Grace' ] [ 1, 2 ]가 출력됩니다.

/**
 * 배열의 각 객체에서 지정한 키의 값만 뽑아 새 배열로 돌려준다.
 *
 * @template T
 * @template {keyof T} K
 * @param {readonly T[]} items
 * @param {K} key
 * @returns {T[K][]}
 */
function pluck(items, key) {
  return items.map((item) => item[key]);
}

const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
];

// T는 users의 원소 모양으로 추론되고, K는 그 모양에 실제로 존재하는 키로 제한됩니다.
// 그 결과 반환 타입도 각각 string[]과 number[]로 구체화됩니다.
const names = pluck(users, "name");
const ids = pluck(users, "id");

// 아래 호출의 주석을 풀면 존재하지 않는 키를 직접 검사해 볼 수 있습니다.
// pluck(users, "email");
// error TS2345: Argument of type '"email"' is not assignable to parameter of type '"id" | "name"'.

console.log(names, ids);

// 다른 예제의 최상위 이름과 전역에서 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
