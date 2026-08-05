// tinylang의 검사 규칙을 값이 아니라 타입으로 다시 짜서, 같은 판정을 타입 검사만으로 내린다.

// codeStep 492 — 타입 레벨 토크나이저

// §25에서 경로 조각을 나누던 타입 레벨 토크나이저와 재귀 구조가 완전히 같다.
// 구분자가 "/"에서 " "로 바뀌었을 뿐, 첫 공백 앞의 Head를 결과 맨 앞에 놓고
// 공백 뒤의 Tail을 다시 Tokenize에 넣어 나머지 토큰을 차례로 이어 붙인다.
type Tokenize<S extends string> =
  S extends `${infer Head} ${infer Tail}`
    ? [Head, ...Tokenize<Tail>]
    : [S];

type T1 = Tokenize<"1 + true">; // ["1", "+", "true"]
