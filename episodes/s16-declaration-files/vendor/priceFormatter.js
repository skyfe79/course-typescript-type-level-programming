// 타입 정보 없이 작성된 순수 JavaScript 가격 포매터입니다.
// ESM 함수 export만 사용하며 타입은 옆 선언 파일이 제공합니다.

export function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}
