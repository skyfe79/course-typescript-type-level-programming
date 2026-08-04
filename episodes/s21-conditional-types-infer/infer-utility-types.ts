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

// MyParameters<T>는 함수 타입의 매개변수 목록 자리에 infer P라는 이름을 붙인다.
// 매개변수 목록은 하나의 튜플 타입으로 잡히므로 원래 함수 호출 모양을 그대로 담을 수 있다.
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

// FormatUserParams는 formatUser가 받는 매개변수 목록을 튜플로 꺼낸다.
// 이름 붙은 매개변수 정보까지 따라와 편집기에서는 [id: number]처럼 표시된다.
type FormatUserParams = MyParameters<typeof formatUser>;   // [id: number]

// callWithParams는 캡처한 매개변수 튜플을 스프레드해 formatUser를 다시 호출한다.
// 원래 함수가 그 튜플을 그대로 받으면 매개변수 목록과 정확히 같다는 실행 가능한 증명이 된다.
function callWithParams(params: FormatUserParams): string {
  return formatUser(...params);
}

// 배열 리터럴 [9]는 FormatUserParams의 튜플 모양에 맞는 호출 인자다.
// 스프레드된 값이 formatUser로 들어가므로 런타임 출력도 같은 규칙을 따른다.
console.log(callWithParams([9]));

// Parameters도 표준 타입에서 직접 만든 타입으로, 다시 표준 타입으로 값을 옮긴다.
// 두 방향 대입이 모두 통과하면 [id: number]라는 매개변수 튜플 결과가 서로 같다는 뜻이다.
const libraryParams: Parameters<typeof formatUser> = [1];
const mineParams: FormatUserParams = libraryParams;
const backToLibraryParams: Parameters<typeof formatUser> = mineParams;

// MyAwaited<T>는 Promise 안쪽 값 자리에 infer V라는 이름을 붙인다.
// 캡처한 V를 다시 MyAwaited에 넘기는 재귀로 프로미스가 몇 겹이든 한 겹씩 벗겨 낸다.
type MyAwaited<T> = T extends Promise<infer V> ? MyAwaited<V> : T;

// Nested는 Promise가 세 번 감싼 문자열 타입이다.
// Unwrapped는 더 이상 Promise가 아닐 때까지 벗겨 낸 뒤 최종 문자열 타입으로 남는다.
type Nested = Promise<Promise<Promise<string>>>;
type Unwrapped = MyAwaited<Nested>;   // string

// loadNested는 중첩된 Promise<string> 모양을 반환 타입으로 드러내는 예제 함수다.
// 실제 값은 Promise.resolve를 여러 번 감싼 문자열이라 Awaited 계열 타입과 잘 맞는다.
async function loadNested(): Promise<Promise<Promise<string>>> {
  return Promise.resolve(Promise.resolve(Promise.resolve("done")));
}

// main은 중첩 Promise 결과를 await로 풀어 Unwrapped 타입 변수에 담는다.
// Unwrapped가 string이면 await 결과를 문자열로 받고 그대로 출력할 수 있다.
async function main(): Promise<void> {
  const value: Unwrapped = await loadNested();
  console.log(value);
}

// main 호출은 비동기 예제를 실행해 최종 문자열 값을 출력한다.
// 앞에서 타입으로 계산한 Awaited 결과가 런타임의 await 동작과 같은 방향임을 보여 준다.
main();

// Awaited도 표준 타입에서 직접 만든 타입으로, 다시 표준 타입으로 값을 옮긴다.
// 두 방향 대입이 모두 통과하면 중첩 Promise를 벗긴 string 결과가 서로 같다는 뜻이다.
const libraryAwaited: Awaited<Nested> = "done";
const mineAwaited: Unwrapped = libraryAwaited;
const backToLibraryAwaited: Awaited<Nested> = mineAwaited;

export {};
