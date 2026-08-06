// 이 파일은 테스트 프레임워크용 테스트가 아니라, tsconfig.test.json의
// "test/**/*.ts" 패턴이 부모의 include를 대체하는 모습을 확인하기 위한 평범한 스크립트입니다.
// src 파일을 import하지 않고 같은 계산을 직접 수행하므로 이 파일 하나만 실행할 수 있습니다.

const price = 12_000;
const quantity = 3;
const actual = price * quantity;
const expected = 36_000;

if (actual !== expected) {
  throw new Error(`합계가 다릅니다: expected=${expected}, actual=${actual}`);
}

console.log(`계산 확인 완료: ${actual.toLocaleString("ko-KR")}원`);

// 루트 타입 검사에서 다른 실습 파일의 전역 선언과 섞이지 않게 합니다.
export {};
