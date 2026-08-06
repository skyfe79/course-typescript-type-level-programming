// 두 해석 방식이 같은 파일과 같은 타입을 가리키는지 비교하려고 구현은 하나만 둡니다.
export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}
