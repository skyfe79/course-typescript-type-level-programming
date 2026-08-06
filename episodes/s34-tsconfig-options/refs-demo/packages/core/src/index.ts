// 3단계 실험: 아래 함수 본문만 `return n + n;`으로 바꾸고 다시 빌드해 보세요.
// 구현은 달라져도 공개 선언 `double(n: number): number`는 같으므로 core만 다시 빌드되고,
// core의 .d.ts를 읽는 app은 다시 컴파일되지 않습니다.
//
// 4단계 실험: 이어서 시그니처와 본문을 다음처럼 바꾸고 다시 빌드해 보세요.
// `export function double(n: number, times: number = 2): number { return n * times; }`
// 이번에는 dist/index.d.ts가 바뀌므로 core에 의존하는 app도 다시 빌드됩니다.
export function double(n: number): number {
  return n * 2;
}
