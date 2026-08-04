// infer로 표준 유틸리티 타입의 핵심 아이디어를 직접 구현해 대조한다.
// 실행: node episodes/s21-conditional-types-infer/infer-utility-types.ts
// 검사: npx tsc --noEmit

// MyReturnType<T>는 함수 타입의 반환 타입 자리에 infer R이라는 이름을 붙인다.
// 함수 형태가 맞으면 R을 돌려주고, 함수가 아니면 꺼낼 반환 타입이 없으므로 never가 된다.
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// formatUser는 숫자 id를 받아 문자열 사용자 이름으로 바꾸는 작은 함수다.
// 반환 타입이 string으로 고정되어 MyReturnType의 결과를 눈으로 확인하기 좋다.
function formatUser(id: number): string {
  return `user-${id}`;
}

// FormatUserReturn은 formatUser의 함수 타입에서 반환 타입만 꺼낸다.
// typeof formatUser가 함수 타입을 넘기고, MyReturnType이 그 반환 자리를 추론한다.
type FormatUserReturn = MyReturnType<typeof formatUser>;   // string

// result는 직접 만든 반환 타입을 실제 함수 호출 결과에 붙여 본 값이다.
// 타입 계산은 컴파일 시간에 끝나고 런타임에는 만들어진 문자열만 출력된다.
const result: FormatUserReturn = formatUser(7);
console.log(result);

// 한쪽 방향 대입만으로는 직접 만든 타입이 표준 타입에 포함된다는 사실까지만 확인된다.
// 양쪽 모두 대입되어야 서로 빠진 반환 타입이 없는 같은 타입이라고 볼 수 있다.
const libraryReturn: ReturnType<typeof formatUser> = formatUser(1);
const mineReturn: FormatUserReturn = libraryReturn;
const backToLibraryReturn: ReturnType<typeof formatUser> = mineReturn;

export {};
