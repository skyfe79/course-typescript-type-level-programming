// 토큰 배열 위를 한 번만 앞으로 이동하면서, 연산자 우선순위가 드러나는 식 트리를 만든다.

import type { Expr } from "./ast.ts";
import type { Operator, Punct, Token, TokenKind } from "./tokens.ts";

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

  // 연산자와 달리 구두점은 AST에 실리는 값이 아니라 식의 시작과 끝을 알려 주는
  // 경계 표식이다. 따라서 찾은 Punct를 돌려줄 필요 없이, 맞으면 소비했다는 사실만
  // boolean으로 알린다. 이 자리는 위 matchOperator와 짝을 이루는 구두점 헬퍼다.
  function matchPunct(char: Punct): boolean {
    const token = peek();
    if (token.kind !== "punct" || token.char !== char) return false;

    advance();
    return true;
  }

  function expectPunct(char: Punct): Token {
    const token = peek();
    if (token.kind === "punct" && token.char === char) {
      return advance();
    }

    // 이 throw는 닫는 경계를 반드시 확인하기 위한 의도된 임시 상태다. 다음 화
    // (ep_209, codeStep 467)에서는 예외를 던지는 대신 ParseResult와 Diagnostic 값에
    // 현재 위치를 담아, 호출자가 파싱 오류를 데이터로 다룰 수 있게 바꾼다.
    throw new Error(`'${char}' 구두점이 필요합니다 (줄 ${token.line}, 오프셋 ${token.offset})`);
  }

  // 괄호 안에서는 바깥에서 내려오던 우선순위를 이어 가지 않고 가장 낮은 or부터
  // 다시 시작해야 한다. 그래서 그룹핑을 만드는 이번 스텝에, parsePrimary가 우선순위
  // 체인의 꼭대기를 다시 부를 수 있는 완전한 식의 진입점 이름이 함께 생긴다.
  function parseExpression(): Expr {
    return parseOr();
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
    const operator = matchOperator("-", "!");
    if (operator !== undefined) {
      // 이항 레벨은 while로 왼쪽 결합을 만들지만, 피연산자 앞에 붙는 전위 단항은
      // 오른쪽 결합이다. 자기 자신을 다시 불러 - -3도 안쪽 단항부터 차례로 묶는다.
      const operand = parseUnary();
      return { kind: "unary", operator, operand };
    }

    return parsePrimary();
  }

  function parsePrimary(): Expr {
    if (matchPunct("(")) {
      // 괄호는 묶는 방법만 정한다. 트리가 완성되면 그 묶음은 자식 관계 자체에 이미
      // 기록되므로 group 노드를 덧붙이지 않고 안쪽 식을 그대로 돌려준다. Expr에
      // group 변형이 없는 이유도 같다.
      const inner = parseExpression();
      expectPunct(")");
      return inner;
    }

    const token = peek();

    // kind 검사로 Token 유니온이 number 변형으로 좁혀지므로 value를 단언 없이 읽어
    // literal 노드로 옮길 수 있다. AST에는 숫자 전용 노드가 따로 없다는 점도 중요하다.
    if (token.kind === "number") {
      advance();
      return { kind: "literal", value: token.value };
    }

    // 문자열·불리언·식별자는 다음 스텝(codeStep 465)에서 채운다.
    // 지금의 throw도 의도된 임시 상태다. 렉서가 그랬듯 다음 화(ep_209)에서는 파싱
    // 오류를 예외가 아닌 ParseResult의 진단 값으로 모아 호출자에게 돌려준다.
    throw new Error("표현식이 와야 하는 자리입니다");
  }

  // 이번 스텝의 각 층을 따로 관찰할 수 있게 공개한다. 완전한 식은 parseExpression로
  // 들어오고, 개별 우선순위 함수도 교육용 관찰 스크립트에서 계속 확인할 수 있다.
  return {
    parseExpression,
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
