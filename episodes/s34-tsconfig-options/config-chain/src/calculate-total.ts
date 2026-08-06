// 이 파일이 tsconfig.json의 "src/**/*.ts" 패턴에 실제로 포함되는 애플리케이션 소스입니다.
// 다른 파일을 import하지 않아 이 파일 하나만 node로 직접 실행할 수 있습니다.

function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

const total = calculateTotal(12_000, 3);

console.log(`애플리케이션 합계: ${total.toLocaleString("ko-KR")}원`);

// 루트 타입 검사에서 이 파일을 독립 모듈로 취급하게 해 전역 이름 충돌을 막습니다.
export {};
