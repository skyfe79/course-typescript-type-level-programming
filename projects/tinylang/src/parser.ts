// 토큰 배열 위를 한 번만 앞으로 이동하면서, 연산자 우선순위가 드러나는 식 트리를 만든다.

import type { Expr } from "./ast.ts";
import type { Operator, Token, TokenKind } from "./tokens.ts";

// 파서마다 자기 커서를 갖게 하면 서로 다른 토큰 배열을 파싱하는 작업이 전역 상태를
// 공유하지 않는다. 다음 화에서 문 파싱 함수와 진단 수집 상태가 늘어나더라도 모두 이
// 클로저 안에 함께 둘 수 있으므로, 파서의 생명 주기도 한곳에서 관리할 수 있다.
export function createParser(tokens: readonly Token[]) {
  let current = 0;

  // 렉서는 언제나 마지막에 eof 토큰을 붙인다. 파싱 도중 커서가 배열 끝을 넘어가도
  // 마지막 eof를 계속 돌려주면 각 파싱 함수에서 배열 범위를 거듭 검사하지 않아도 된다.
  function peek(): Token {
    return tokens[Math.min(current, tokens.length - 1)];
  }

  // advance가 커서를 옮긴 직후 소비한 토큰을 다시 확인할 때 쓴다. 첫 토큰을 소비하기
  // 전에도 안전한 값을 돌려주도록 인덱스의 아래쪽 경계 역시 0으로 고정한다.
  function previous(): Token {
    return tokens[Math.max(0, current - 1)];
  }

  function isAtEnd(): boolean {
    return peek().kind === "eof";
  }

  // eof는 입력의 끝을 나타내는 표식이지 소비할 문법 요소가 아니다. 따라서 eof에
  // 도착한 뒤 advance를 다시 불러도 커서를 더 움직이지 않는다.
  function advance(): Token {
    if (!isAtEnd()) {
      current += 1;
    }
    return previous();
  }

  // 값 필드가 필요 없고 토큰 종류만 미리 볼 때 쓰는 가장 작은 검사다. 다음 화에서
  // 식별자나 구두점을 파싱할 때 같은 커서 규칙을 재사용할 수 있다.
  function check(kind: TokenKind): boolean {
    return peek().kind === kind;
  }

  // boolean을 돌려준 뒤 previous()를 읽는 방식은 previous()의 타입을 넓은 Token
  // 유니온으로 되돌린다. 그러면 토큰의 op를 읽기 위해 다시 좁히거나 단언해야 한다.
  // 대신 실제로 찾은 O를 반환하면 호출 위치에서 "+" | "-" 같은 좁은 타입이 그대로
  // AST의 operator 필드까지 이어진다. 값과 타입 정보를 함께 운반하는 헬퍼인 셈이다.
  function matchOperator<O extends Operator>(...candidates: readonly O[]): O | undefined {
    const token = peek();
    if (token.kind !== "operator") return undefined;

    const found = candidates.find((candidate) => candidate === token.op);
    if (found === undefined) return undefined;

    advance();
    return found;
  }

  // 아래 여섯 함수는 모두 "더 강한 레벨을 먼저 읽고, 같은 레벨 연산자를 while로
  // 이어 붙인다"라는 패턴을 반복한다. 지금은 이 반복 자체가 우선순위 층을 눈에
  // 보이게 하는 교육 포인트이므로 공통 함수로 추상화하지 않는다.
  function parseOr(): Expr {
    let left = parseAnd();

    while (true) {
      const operator = matchOperator("||");
      if (operator === undefined) break;

      const right = parseAnd();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseAnd(): Expr {
    let left = parseEquality();

    while (true) {
      const operator = matchOperator("&&");
      if (operator === undefined) break;

      const right = parseEquality();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseEquality(): Expr {
    let left = parseComparison();

    while (true) {
      const operator = matchOperator("==", "!=");
      if (operator === undefined) break;

      const right = parseComparison();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseComparison(): Expr {
    let left = parseAdditive();

    while (true) {
      const operator = matchOperator("<", "<=", ">", ">=");
      if (operator === undefined) break;

      const right = parseAdditive();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseAdditive(): Expr {
    let left = parseMultiplicative();

    while (true) {
      const operator = matchOperator("+", "-");
      if (operator === undefined) break;

      const right = parseMultiplicative();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseMultiplicative(): Expr {
    let left = parseUnary();

    while (true) {
      const operator = matchOperator("*", "/", "%");
      if (operator === undefined) break;

      const right = parseUnary();
      left = { kind: "binary", operator, left, right };
    }

    return left;
  }

  function parseUnary(): Expr {
    // 이번 스텝에서는 우선순위 체인을 실행하는 데 필요한 통로만 둔다. 단항 -와 !를
    // 재귀적으로 묶는 처리는 다음 스텝(codeStep 464)에서 바로 이 자리에 채운다.
    return parsePrimary();
  }

  function parsePrimary(): Expr {
    const token = peek();

    // kind 검사로 Token 유니온이 number 변형으로 좁혀지므로 value를 단언 없이 읽어
    // literal 노드로 옮길 수 있다. AST에는 숫자 전용 노드가 따로 없다는 점도 중요하다.
    if (token.kind === "number") {
      advance();
      return { kind: "literal", value: token.value };
    }

    // 문자열·불리언·식별자·괄호는 다음 스텝들(codeStep 464·465)에서 채운다.
    // 지금의 throw도 의도된 임시 상태다. 렉서가 그랬듯 다음 화(ep_209)에서는 파싱
    // 오류를 예외가 아닌 ParseResult의 진단 값으로 모아 호출자에게 돌려준다.
    throw new Error("표현식이 와야 하는 자리입니다");
  }

  // 이번 스텝의 각 층을 따로 관찰할 수 있게 공개한다. 이후 문 파서는 가장 낮은
  // 우선순위의 parseOr를 완전한 식의 진입점으로 사용하게 된다.
  return {
    parseOr,
    parseAnd,
    parseEquality,
    parseComparison,
    parseAdditive,
    parseMultiplicative,
    parseUnary,
    parsePrimary,
  };
}
