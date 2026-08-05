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

// codeStep 362 — Split으로 "a,b,c" 나눠 보기

const csv = "a,b,c";
type Tokens = Split<typeof csv, ",">;

// 런타임의 split도 타입 수준의 Split과 같은 세 개의 토큰을 만든다.
console.log(csv.split(","));

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

const tokensMatch: Eq<Tokens, ["a", "b", "c"]> = true;

// codeStep 363 — 타입 레벨 Trim 만들기

// TrimStart는 문자열의 맨 앞에서 공백 하나를 떼어 내고, 남은 Rest를 다시 같은 방식으로 확인한다.
type TrimStart<S extends string> = S extends ` ${infer Rest}` ? TrimStart<Rest> : S;

// TrimEnd는 같은 head/tail 걷기 원리를 문자열의 반대쪽 끝에 겨눠 뒤쪽 공백을 하나씩 떼어 낸다.
type TrimEnd<S extends string> = S extends `${infer Rest} ` ? TrimEnd<Rest> : S;

// 앞쪽 공백을 모두 제거한 결과에서 뒤쪽 공백까지 제거하면 양 끝을 다듬은 문자열이 된다.
type Trim<S extends string> = TrimEnd<TrimStart<S>>;

const padded = "  hi  ";
type Trimmed = Trim<typeof padded>;

const trimmedMatches: Eq<Trimmed, "hi"> = true;

// 런타임의 trim도 타입 수준의 Trim과 같은 "hi"를 만든다.
console.log(JSON.stringify(padded.trim()));

export {};
