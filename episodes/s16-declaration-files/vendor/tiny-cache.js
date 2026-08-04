// vendor로 받아 둔 tiny-cache JavaScript 구현입니다.
// 타입 이야기를 위해 실제 패키지 코드처럼 그대로 둔다고 가정합니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: 이 파일은 다른 예제에서 import해 쓰는 vendor 구현입니다.

// codeStep 245 — 보강 대상이 되는 JavaScript 모듈 구현을 준비합니다.

export function createCache(options) {
  // options는 이 예제의 런타임에서는 쓰지 않고 타입 층에서만 다룹니다.
  const store = new Map();
  return {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
  };
}
