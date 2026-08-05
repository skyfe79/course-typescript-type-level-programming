// 렉서가 만드는 일곱 토큰 값과 브랜드가 붙은 소스 위치의 계약을 정의한다.

import type { Line, Offset } from "./diagnostics.ts";

// 렉서가 알아보는 키워드를 일반 string과 구분해 두면, 오타 난 키워드 토큰을
// 뒤 단계인 파서에 넘길 수 없다. 처음 다섯 제어 키워드뿐 아니라 return과 불리언
// 리터럴도 실제 프로그램이 사용하므로 처음부터 여덟 개를 모두 포함한다.
export type Keyword = "let" | "fn" | "if" | "else" | "while" | "return" | "true" | "false";

// 연산자 역시 string으로 넓히지 않는다. 이 목록은 렉서가 만들 수 있는 연산자의
// 전체 집합이고, AST에서는 문맥에 맞는 이항·단항 연산자만 다시 추려서 사용한다.
export type Operator =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | "<=" | ">" | ">="
  | "&&" | "||" | "!" | "=";

// 콜론은 함수 매개변수와 반환 타입, 변수의 타입 어노테이션을 구분한다.
// 괄호류만 넣으면 `fn add(a: number): number` 같은 선언을 파싱할 수 없다.
export type Punct = "(" | ")" | "{" | "}" | "," | ";" | ":";

// 모든 토큰을 하나의 큰 객체로 만들지 않고 kind로 나눈 이유는 각 변형이 자신에게
// 필요한 정보만 갖게 하기 위해서다. 예를 들어 number에는 value만 있고, keyword에만
// word가 있으므로 존재하지 않는 필드를 다음 단계에서 실수로 읽을 수 없다.
// 값의 일곱 갈래와 모든 갈래에 공통인 위치를 따로 조합할 수 있도록, 판별 유니온에는
// TokenValue라는 이름을 붙인다.
export type TokenValue =
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "identifier"; readonly name: string }
  | { readonly kind: "keyword"; readonly word: Keyword }
  | { readonly kind: "operator"; readonly op: Operator }
  | { readonly kind: "punct"; readonly char: Punct }
  | { readonly kind: "eof" };

// 이제 Offset과 Line 브랜드가 먼저 준비되었으므로 토큰에도 시작 위치를 붙인다.
// 둘을 그냥 number로 두면 객체를 만들 때 서로 뒤바꾸어도 잡을 수 없지만, 서로 다른
// 브랜드는 그 실수를 컴파일 단계에서 막는다.
export type SourcePosition = {
  readonly offset: Offset;
  readonly line: Line;
};

// 인터섹션으로 공통 위치를 한 번만 적어도 kind 판별 유니온의 좁히기는 유지된다.
// 따라서 파서는 switch 분기 안에서 각 변형의 고유 필드를 단언 없이 읽을 수 있다.
export type Token = TokenValue & SourcePosition;

// 판별자만 필요한 코드가 Token 전체 모양을 다시 복사하지 않도록 인덱스 접근 타입으로
// 뽑는다. Token에 변형을 추가하면 TokenKind도 자동으로 함께 갱신된다.
export type TokenKind = Token["kind"];
