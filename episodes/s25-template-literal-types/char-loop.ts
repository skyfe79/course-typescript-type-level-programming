// infer로 문자열을 한 글자씩 나누고 재귀적으로 순회할 때 유니코드 문자가 어떻게 처리되는지 확인한다.
// 실행: node episodes/s25-template-literal-types/char-loop.ts
// 검사: npx tsc --noEmit

// codeStep 359 — infer 패턴으로 문자열 나눠 보기

// 튜플의 [infer Head, ...infer Tail]처럼 문자열도 앞 한 글자와 나머지 전체로 분해한다.
// Tail을 다시 SplitChars에 넣어 빈 문자열이 될 때까지 반복하고, 분리한 Head를 튜플에 차례로 쌓는다.
type SplitChars<S extends string> = S extends `${infer Head}${infer Tail}`
  ? [Head, ...SplitChars<Tail>]
  : [];

// 분리된 문자 튜플의 length를 읽으면 타입 수준에서 문자열의 길이를 계산할 수 있다.
type Length<S extends string> = SplitChars<S>["length"];

const word = "hello";
type WordChars = SplitChars<typeof word>;
type WordLength = Length<typeof word>;

// 일반적인 영문 문자열에서는 타입 수준의 Length와 런타임 문자열의 length가 모두 5다.
console.log(word, word.length);

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

const wordCharsMatch: Eq<WordChars, ["h", "e", "l", "l", "o"]> = true;
const wordLengthMatches: Eq<WordLength, 5> = true;

export {};
