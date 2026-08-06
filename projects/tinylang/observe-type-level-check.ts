// 값으로 구현한 tinylang 검사 규칙을 타입으로 옮겨, 같은 판정을 컴파일 때와 실행 때 대조한다.
// 타입 비용은 프로젝트 전체가 아니라 `npm run bench:types`로 이 파일만 격리해 잰다. 전체를
// 재면 인스턴스화 10만 중 대부분을 차지하는 @types/node 비용에 우리 타입의 변화가 묻힌다.

import { compile, formatDiagnostic } from "./src/compile.ts";

// codeStep 492 — 타입 레벨 토크나이저

// 돌아오는 길에 [Head, ...Tokenize<Tail>]을 이어 붙이면 재귀 호출이 끝날 때까지
// 튜플 생성을 미뤄 두어 토큰 60개 남짓에서 깊이 한계에 닿는다. 누산기에 가는 길에
// 토큰을 붙이면 꼬리 재귀 최적화를 받을 수 있고, 기본값 덕분에 기존 호출법도 같다.
type Tokenize<S extends string, Accumulator extends readonly string[] = []> =
  S extends `${infer Head} ${infer Tail}`
    ? Tokenize<Tail, [...Accumulator, Head]>
    : [...Accumulator, S];

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

// codeStep 496 — 중간 토큰 튜플 없이 문자열 위에서 직접 접기

// 문자열 앞에서 토큰 하나를 떼어 [토큰, 나머지]로 돌려준다. 공백이 없으면 남은
// 전체가 마지막 토큰이고, 빈 나머지는 다음 재귀가 끝났다는 표지가 된다.
type NextToken<S extends string> =
  S extends `${infer Head} ${infer Rest}` ? [Head, Rest] : [S, ""];

// Tokenize는 ep_220의 학습 코드와 단언을 위해 그대로 남긴다. 다만 누산기 튜플도
// 매 단계 길이 n짜리 새 튜플을 만들어 전체 비용이 제곱으로 자란다. 실제 Check는
// 중간 자료구조 없이 왼쪽 타입 이름 하나만 들고 문자열을 끝까지 흘려보낸다.
type CheckFrom<Accumulator extends TokenTypeName, S extends string> =
  S extends "" ? "ok"
    : NextToken<S> extends [infer Operator extends string, infer AfterOperator extends string]
      ? Operator extends "+"
        ? NextToken<AfterOperator> extends [infer RightToken extends string, infer Rest extends string]
          ? TypeOfToken<RightToken> extends infer Right extends TokenTypeName
            ? Accumulator extends "number"
              ? Right extends "number" ? CheckFrom<"number", Rest> : PlusOperandError<Accumulator, Right>
              : Accumulator extends "string"
                ? Right extends "string" ? CheckFrom<"string", Rest> : PlusOperandError<Accumulator, Right>
                : PlusOperandError<Accumulator, Right>
            : never
          : never
        : never
      : never;

type Check<S extends string> =
  NextToken<S> extends [infer First extends string, infer Rest extends string]
    ? CheckFrom<TypeOfToken<First>, Rest>
    : "ok";

// 튜플을 먼저 만드는 ep_220 구현과 문자열을 직접 접는 오늘 구현이 성공과 실패에서
// 정확히 같은 타입을 돌려준다는 사실을 호버가 아니라 대입으로 고정한다.
const directNumbersMatchTupleVersion: Eq<
  Check<"1 + 2 + 3">,
  CheckTokens<Tokenize<"1 + 2 + 3">>
> = true;
const directMixedMatchesTupleVersion: Eq<
  Check<"1 + true">,
  CheckTokens<Tokenize<"1 + true">>
> = true;

type Bad = Check<"1 + true">; // 오류 문자열 타입
type Good = Check<"1 + 2">; // "ok"

const badHasSameDiagnostic: Eq<
  Bad,
  "'+'의 피연산자는 모두 number이거나 모두 string이어야 합니다 (현재 number, boolean)"
> = true;
const goodIsOk: Eq<Good, "ok"> = true;

// 숫자 40개와 연산자 39개, 모두 79토큰인 입력이다. 이전의 돌아오는 길 재귀
// Tokenize를 Check가 사용하면 TS2589로 실패하지만, 문자열 직접 접기는 끝까지 통과한다.
type LongProgram = "1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25 + 26 + 27 + 28 + 29 + 30 + 31 + 32 + 33 + 34 + 35 + 36 + 37 + 38 + 39 + 40";
const longProgramIsOk: Eq<Check<LongProgram>, "ok"> = true;

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
