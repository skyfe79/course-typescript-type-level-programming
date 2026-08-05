// 값으로 구현한 tinylang 검사 규칙을 타입으로 옮겨, 같은 판정을 컴파일 때와 실행 때 대조한다.

import { compile, formatDiagnostic } from "./src/compile.ts";

// codeStep 492 — 타입 레벨 토크나이저

// §25에서 경로 조각을 나누던 타입 레벨 토크나이저와 재귀 구조가 완전히 같다.
// 구분자가 "/"에서 " "로 바뀌었을 뿐, 첫 공백 앞의 Head를 결과 맨 앞에 놓고
// 공백 뒤의 Tail을 다시 Tokenize에 넣어 나머지 토큰을 차례로 이어 붙인다.
type Tokenize<S extends string> =
  S extends `${infer Head} ${infer Tail}`
    ? [Head, ...Tokenize<Tail>]
    : [S];

type T1 = Tokenize<"1 + true">; // ["1", "+", "true"]

// codeStep 493 — 타입 레벨 검사 규칙

// 이 작은 검사기가 표현할 수 있는 값 타입 세 가지에, 아직 해석하지 못하는 식별자 같은
// 토큰을 표시할 unknown을 더한다. unknown은 TypeScript의 unknown 타입이 아니라 문자열
// 리터럴 "unknown"이며, 아래 오류 문장에 현재 피연산자 타입 이름으로 그대로 들어간다.
type TokenTypeName = "number" | "string" | "boolean" | "unknown";

// 숫자로 해석할 수 있는 문자열을 먼저 고르고, 그다음 불리언 리터럴과 큰따옴표로 감싼
// 문자열 리터럴을 판정한다. 어느 모양에도 맞지 않으면 이 데모가 아직 모르는 토큰이다.
type TypeOfToken<Token extends string> =
  Token extends `${number}` ? "number"
    : Token extends "true" | "false" ? "boolean"
      : Token extends `"${string}"` ? "string"
        : "unknown";

// 값 검사기의 진단 문장을 템플릿 리터럴 타입으로 그대로 옮긴다. 왼쪽과 오른쪽 타입은
// 각 재귀 단계에서 계산된 이름이므로, 규칙을 어긴 바로 그 피연산자 쌍이 문장에 남는다.
type PlusOperandError<
  Left extends TokenTypeName,
  Right extends TokenTypeName,
> = `'+'의 피연산자는 모두 number이거나 모두 string이어야 합니다 (현재 ${Left}, ${Right})`;

// §23 ReduceT와 같은 접기 구조다. Accumulator는 지금까지 계산한 왼쪽 피연산자의
// 타입 이름이고, ["+", 오른쪽, ...나머지]를 한 단계씩 소비하면서 새 누산기를 만든다.
// 따라서 1 + 2 + 3도 값 검사기의 왼쪽 결합과 같이 (1 + 2) + 3 순서로 검사된다.
type CheckTokenTail<
  Accumulator extends TokenTypeName,
  Tokens extends readonly string[],
> = Tokens extends readonly []
  ? "ok"
  : Tokens extends readonly ["+", infer RightToken extends string, ...infer Rest extends readonly string[]]
    ? TypeOfToken<RightToken> extends infer Right extends TokenTypeName
      ? Accumulator extends "number"
        ? Right extends "number"
          ? CheckTokenTail<"number", Rest>
          : PlusOperandError<Accumulator, Right>
        : Accumulator extends "string"
          ? Right extends "string"
            ? CheckTokenTail<"string", Rest>
            : PlusOperandError<Accumulator, Right>
          : PlusOperandError<Accumulator, Right>
      : never
    : never;

// 첫 토큰의 타입 이름이 폴드의 초깃값이다. 이후 규칙이 실패하면 오류 문자열을 즉시
// 반환하므로 남은 토큰은 더 보지 않는다. 빈 튜플은 검사할 규칙이 없으므로 성공이다.
type CheckTokens<Tokens extends readonly string[]> =
  Tokens extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
    ? CheckTokenTail<TypeOfToken<First>, Rest>
    : "ok";

// Eq는 호버에서만 보이던 결과를 두 타입의 정확한 동일성으로 바꾸어 컴파일러가 검사하게 한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type CheckedNumbers = CheckTokens<["1", "+", "2"]>;
type CheckedMixed = CheckTokens<["1", "+", "true"]>;

const checkedNumbersIsOk: Eq<CheckedNumbers, "ok"> = true;
const checkedMixedHasSameDiagnostic: Eq<
  CheckedMixed,
  "'+'의 피연산자는 모두 number이거나 모두 string이어야 합니다 (현재 number, boolean)"
> = true;

// codeStep 494 — Check 진입점과 값 버전과의 대조

// 문자열을 토큰화한 결과를 곧바로 검사기에 넘기면 사용자가 볼 단일 진입점이 된다.
type Check<S extends string> = CheckTokens<Tokenize<S>>;

type Bad = Check<"1 + true">; // 오류 문자열 타입
type Good = Check<"1 + 2">; // "ok"

const badHasSameDiagnostic: Eq<
  Bad,
  "'+'의 피연산자는 모두 number이거나 모두 string이어야 합니다 (현재 number, boolean)"
> = true;
const goodIsOk: Eq<Good, "ok"> = true;

// 같은 두 식을 실제 프로그램으로 감싸 값 검사기에 넣는다. 실패 쪽은 타입 레벨의 Bad와
// 같은 문장을 출력하고, 성공 쪽은 진단 없이 컴파일 경계를 통과한다.
function observeValueChecker(source: string): void {
  const result = compile(source);
  console.log(`\n${source}`);
  if (result.ok) {
    console.log("진단 없음");
    return;
  }
  for (const diagnostic of result.diagnostics) console.log(formatDiagnostic(diagnostic));
}

console.log("=== 값 검사기와 타입 레벨 검사 결과 대조 ===");
observeValueChecker("print(1 + true);");
observeValueChecker("print(1 + 2);");
