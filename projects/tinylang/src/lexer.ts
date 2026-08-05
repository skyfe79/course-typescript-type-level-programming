import type { Keyword, Operator, Punct, Token } from "./tokens.ts";

// 렉서가 한 문자를 보았을 때 선택할 수 있는 갈래를 문자열 리터럴 유니온으로
// 고정한다. 호출하는 쪽은 이 일곱 경우를 switch로 나누어 다음 동작을 결정한다.
export type CharClass =
  | "digit"
  | "alpha"
  | "whitespace"
  | "quote"
  | "operator"
  | "punct"
  | "eof";

// source[pos]는 pos가 문자열 끝에 닿으면 undefined가 된다. 그 값을 그대로 받아
// eof로 분류하므로, 호출자가 문자를 읽을 때마다 범위를 따로 검사할 필요가 없다.
export function classify(ch: string | undefined): CharClass {
  if (ch === undefined) return "eof";

  // 정규식 없이 문자 코드의 순서만 이용한다. 숫자를 먼저 분리해 두어 낱말을
  // 읽는 쪽에서 alpha 뒤에 이어지는 digit을 명시적으로 허용할 수 있다.
  if (ch >= "0" && ch <= "9") return "digit";

  // 밑줄은 식별자의 첫 글자와 이어지는 글자 모두에 올 수 있으므로 alpha 갈래에
  // 포함한다. 이 검사를 공백이나 기호 검사보다 먼저 끝내는 순서에도 의미가 있다.
  if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
    return "alpha";
  }

  if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") return "whitespace";
  if (ch === '"') return "quote";
  if ("+-*/%=!<>&|".includes(ch)) return "operator";

  // 앞의 어느 범주에도 들지 않은 문자는 모두 punct로 보낸다. 여기서는 넓게
  // 분류하고, 실제 허용 구두점인지는 tokenize의 타입이 붙은 목록에서 확인한다.
  return "punct";
}

// 배열 자체에 리터럴 유니온 타입을 붙인다. source.slice로 얻은 string과 같은
// 항목을 find하면, 반환값은 이미 Keyword이거나 undefined인 값이 된다.
const KEYWORDS: readonly Keyword[] = [
  "let",
  "fn",
  "if",
  "else",
  "while",
  "return",
  "true",
  "false",
];

const TWO_CHAR_OPERATORS: readonly Operator[] = ["==", "!=", "<=", ">=", "&&", "||"];
const ONE_CHAR_OPERATORS: readonly Operator[] = ["+", "-", "*", "/", "%", "<", ">", "!", "="];
const PUNCTS: readonly Punct[] = ["(", ")", "{", "}", ",", ";", ":"];

// Set.has는 포함 여부인 boolean만 돌려주므로 검사한 string을 Keyword로 좁혀 주지
// 못한다. 타입이 붙은 배열에서 값을 직접 찾아 오면 undefined 검사 뒤에 단언 없이
// 곧바로 keyword 토큰을 만들 수 있다.
function findKeyword(word: string): Keyword | undefined {
  return KEYWORDS.find((keyword) => keyword === word);
}

// 연산자와 구두점도 같은 원리를 쓴다. 각 find가 돌려주는 값에는 처음부터
// Operator 또는 Punct 타입이 붙어 있어 Token의 필드에 안전하게 들어간다.
function findOperator(candidate: string, operators: readonly Operator[]): Operator | undefined {
  return operators.find((operator) => operator === candidate);
}

function findPunct(candidate: string): Punct | undefined {
  return PUNCTS.find((punct) => punct === candidate);
}

export function tokenize(source: string): Token[] {
  // Token의 각 필드는 readonly지만, 렉싱 도중 결과 배열에 새 토큰을 push하는 것은
  // 별개의 일이다. 완성된 토큰 객체의 필드만 이후에 바꿀 수 없다.
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < source.length) {
    const charClass = classify(source[pos]);

    switch (charClass) {
      case "whitespace": {
        pos += 1;
        break;
      }

      case "digit": {
        const start = pos;
        while (classify(source[pos]) === "digit") {
          pos += 1;
        }

        // 시작과 끝 위치로 slice하면 매 글자를 더하지 않아도 원래 숫자 표기를
        // 그대로 얻는다. 이 화의 작은 언어는 소수점 없는 정수만 다룬다.
        const digits = source.slice(start, pos);
        tokens.push({ kind: "number", value: Number(digits) });
        break;
      }

      case "alpha": {
        const start = pos;
        pos += 1;

        // 첫 글자는 alpha여야 하지만, 그 뒤에는 숫자도 올 수 있다. 따라서 name1은
        // 하나의 식별자이고 1name은 숫자와 식별자 두 토큰으로 나뉜다.
        while (classify(source[pos]) === "alpha" || classify(source[pos]) === "digit") {
          pos += 1;
        }

        const word = source.slice(start, pos);
        const keyword = findKeyword(word);
        if (keyword !== undefined) {
          tokens.push({ kind: "keyword", word: keyword });
        } else {
          tokens.push({ kind: "identifier", name: word });
        }
        break;
      }

      case "quote": {
        // 여는 따옴표는 값에 포함하지 않고, 닫는 따옴표 직전까지만 slice한다.
        pos += 1;
        const start = pos;

        while (classify(source[pos]) !== "quote") {
          if (classify(source[pos]) === "eof") {
            throw new Error(`닫는 따옴표가 없는 문자열입니다. 시작 위치: ${start - 1}`);
          }
          pos += 1;
        }

        const value = source.slice(start, pos);
        pos += 1;
        tokens.push({ kind: "string", value });
        break;
      }

      case "operator": {
        // ==를 = 두 개로 잘못 자르지 않도록 언제나 두 글자 후보를 먼저 찾는다.
        // 성공한 find 결과는 Operator이므로 별도의 타입 단언이 필요 없다.
        const twoChars = source.slice(pos, pos + 2);
        const twoCharOperator = findOperator(twoChars, TWO_CHAR_OPERATORS);
        if (twoCharOperator !== undefined) {
          tokens.push({ kind: "operator", op: twoCharOperator });
          pos += 2;
          break;
        }

        const oneChar = source.slice(pos, pos + 1);
        const oneCharOperator = findOperator(oneChar, ONE_CHAR_OPERATORS);
        if (oneCharOperator === undefined) {
          // 지금은 즉시 멈추지만, 다음 화 ep_207에서는 이 자리를 Diagnostic 값으로
          // 바꾸어 오류 위치와 원인을 데이터로 전달한다.
          throw new Error(`알 수 없는 연산자 '${oneChar}' (위치 ${pos})`);
        }

        tokens.push({ kind: "operator", op: oneCharOperator });
        pos += 1;
        break;
      }

      case "punct": {
        const candidate = source.slice(pos, pos + 1);
        const punct = findPunct(candidate);
        if (punct === undefined) {
          // 허용하지 않는 일반 문자도 다음 화 ep_207에서는 throw 대신 Diagnostic
          // 값으로 바뀐다. 이번 화에는 문제 문자와 위치를 분명하게 보여 준다.
          throw new Error(`알 수 없는 문자 '${candidate}' (위치 ${pos})`);
        }

        tokens.push({ kind: "punct", char: punct });
        pos += 1;
        break;
      }

      case "eof": {
        // while 조건 때문에 정상 실행에서는 도달하지 않는다. 그래도 CharClass의 모든
        // 갈래를 switch에 드러내어 분류와 처리의 대응 관계를 빠짐없이 보여 준다.
        pos = source.length;
        break;
      }
    }
  }

  // 파서는 배열 길이를 거듭 검사하는 대신 이 마지막 토큰을 보고 입력의 끝을 안다.
  tokens.push({ kind: "eof" });
  return tokens;
}
