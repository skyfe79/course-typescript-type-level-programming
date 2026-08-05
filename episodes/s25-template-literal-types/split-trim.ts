// 정해 둔 구분자로 문자열을 나누고 문자열 양 끝의 공백을 재귀적으로 제거한다.
// 실행: node episodes/s25-template-literal-types/split-trim.ts
// 검사: npx tsc --noEmit

// codeStep 361 — Split 타입 만들기

// 문자열에서 Delim을 찾아 그 앞부분은 Token으로, 뒷부분은 Rest로 분해한다.
// 첫 번째 infer 자리는 탐욕적으로 추론하지 않으므로 Token은 가장 앞에 나오는 구분자까지만 차지한다.
// Rest를 같은 Split에 다시 넣고, 앞에서 얻은 Token을 재귀 결과의 맨 앞에 쌓는다.
type Split<S extends string, Delim extends string> =
  S extends `${infer Token}${Delim}${infer Rest}`
    ? [Token, ...Split<Rest, Delim>]
    : [S];

// 구분자가 더 없을 때 [S]를 반환해야 남은 문자열이 마지막 토큰으로 보존된다.
// 여기서 []를 반환하면 마지막 구분자 뒤의 토큰이 결과에서 사라진다.

export {};
