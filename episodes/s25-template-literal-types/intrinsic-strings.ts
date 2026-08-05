// 내장 문자열 변환 타입의 계산 결과를 같은 동작을 하는 런타임 값과 함께 확인한다.
// 실행: node episodes/s25-template-literal-types/intrinsic-strings.ts
// 검사: npx tsc --noEmit

// codeStep 353 — 내장 문자열 타입과 런타임 변환 비교하기

// 네 내장 타입은 런타임 함수가 아니라 타입 검사기 안에서 문자열 리터럴 타입을 변환한다.
// Uppercase와 Lowercase는 문자열 전체의 대소문자를 바꾼 새로운 리터럴 타입을 계산한다.
type Shout = Uppercase<"hello">;
type Whisper = Lowercase<"HELLO">;

// Capitalize와 Uncapitalize는 나머지 글자는 그대로 두고 첫 글자 하나만 바꾼다.
type Title = Capitalize<"hello">;
type Uncap = Uncapitalize<"Hello">;

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 각 변환이 넓은 string이 아니라 예상한 문자열 리터럴 타입으로 계산되는지 확인한다.
const shoutIsHello: Eq<Shout, "HELLO"> = true;
const whisperIsHello: Eq<Whisper, "hello"> = true;
const titleIsHello: Eq<Title, "Hello"> = true;
const uncapIsHello: Eq<Uncap, "hello"> = true;

// Capitalize는 첫 글자만 바꾸므로 Title을 문자열 전체가 대문자인 "HELLO"로 볼 수 없다.
// @ts-expect-error - Title은 "Hello"이므로 "HELLO"와 같은 타입이 아니다
const titleIsNotAllUppercase: Eq<Title, "HELLO"> = true;

// 값 공간에는 Capitalize 함수가 없으므로 첫 글자와 나머지 문자열을 직접 나누어 같은 동작을 만든다.
// 빈 문자열에서는 s[0]이 없으므로 먼저 길이를 검사해 undefined의 메서드를 호출하지 않게 한다.
function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

// Uncapitalize도 첫 글자에만 소문자 변환을 적용하고 두 번째 글자부터는 원래 값을 보존한다.
function uncapitalize(s: string): string {
  return s.length === 0 ? s : s[0].toLowerCase() + s.slice(1);
}

// 명령줄 인자가 없으면 hello를 사용해 타입 별칭에 넣은 문자열과 런타임 결과를 바로 비교한다.
const word = process.argv[2] ?? "hello";
console.log({
  upper: word.toUpperCase(),
  lower: word.toLowerCase(),
  capitalized: capitalize(word),
  uncapitalized: uncapitalize(word),
});

export {};
