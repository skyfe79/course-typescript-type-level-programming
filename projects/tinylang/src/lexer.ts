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
