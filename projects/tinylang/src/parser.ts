// 토큰 배열 위를 한 번만 앞으로 이동하면서, 연산자 우선순위가 드러나는 식 트리를 만든다.

import type { Block, Expr, FuncDecl, IfStatement, Param, Program, Statement, TypeName } from "./ast.ts";
import { makeDiagnostic } from "./diagnostics.ts";
import type { Diagnostic } from "./diagnostics.ts";
import type { Keyword, Operator, Punct, Token, TokenKind } from "./tokens.ts";

// 1부(ep_092)에서 배운 Result<T> 패턴을 이 프로젝트에도 의도적으로 다시 쓴다.
// 렉서는 diagnostics 목록을 모으지만, 파서는 첫 실패의 Diagnostic 하나에서 곧바로 멈춘다.
export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostic: Diagnostic };

// 실패 갈래에는 T가 나타나지 않으므로 ParseResult<never>는 Token, Expr, Statement 등
// 어떤 ParseResult 자리에도 그대로 흐를 수 있다. 호출자는 실패를 다시 만들지 않고 반환한다.
function fail(token: Token, message: string): ParseResult<never> {
  return {
    ok: false,
    diagnostic: makeDiagnostic("error", message, token.offset, token.line),
  };
}

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

  // 대입문과 식 문은 모두 식별자로 시작할 수 있다. 예를 들어 `x = 1;`과
  // `x + 1;`은 첫 토큰만 보고는 구분할 수 없으므로, 현재 토큰을 소비하지 않은 채
  // 바로 다음 토큰까지 미리 본다. peek과 마찬가지로 배열 끝에서는 마지막 eof에
  // 인덱스를 고정해, 짧은 입력에서도 범위를 벗어나지 않게 한다.
  function peekNext(): Token {
    return tokens[Math.min(current + 1, tokens.length - 1)];
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

  // kind만 확인하는 check로는 `if`와 `while`, `}`와 `;`를 서로 구별할 수 없다.
  // 문법을 소비하기 전에 구체적인 키워드와 구두점을 미리 볼 수 있게 값까지 비교한다.
  function checkKeyword(word: Keyword): boolean {
    const token = peek();
    return token.kind === "keyword" && token.word === word;
  }

  function checkPunct(char: Punct): boolean {
    const token = peek();
    return token.kind === "punct" && token.char === char;
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

  // matchOperator와 똑같이, 찾은 키워드 자체를 반환해 K의 좁은 타입을 호출자까지
  // 운반한다. boolean만 반환하고 previous()를 읽는 방식과 달리 타입 단언이 필요 없다.
  function matchKeyword<K extends Keyword>(...candidates: readonly K[]): K | undefined {
    const token = peek();
    if (token.kind !== "keyword") return undefined;

    const found = candidates.find((candidate) => candidate === token.word);
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

  // matchKeyword는 있으면 소비하고 알려 주며, expectKeyword는 반드시 있어야 하는 경계를 확인한다.
  function expectKeyword(word: Keyword): ParseResult<Token> {
    const token = peek();
    if (token.kind === "keyword" && token.word === word) {
      return { ok: true, value: advance() };
    }

    return fail(token, `'${word}' 키워드가 필요합니다`);
  }

  // matchOperator는 있으면 소비하고 알려 주며, expectOperator는 반드시 있어야 하는 경계를 확인한다.
  function expectOperator(op: Operator): ParseResult<Token> {
    const token = peek();
    if (token.kind === "operator" && token.op === op) {
      return { ok: true, value: advance() };
    }

    return fail(token, `'${op}' 연산자가 필요합니다`);
  }

  function expectPunct(char: Punct): ParseResult<Token> {
    const token = peek();
    if (token.kind === "punct" && token.char === char) {
      return { ok: true, value: advance() };
    }

    // 반드시 있어야 하는 경계가 빠지면 예외 대신 현재 위치를 담은 실패 값을 돌려준다.
    return fail(token, `'${char}' 구두점이 필요합니다`);
  }

  function expectIdentifier(): ParseResult<string> {
    const token = peek();
    if (token.kind === "identifier") {
      // advance()의 반환 타입은 다시 넓은 Token이다. 이름은 kind 검사로 이미 좁혀진
      // token에서 읽고, advance는 커서를 옮기는 용도로만 써서 단언을 피한다.
      advance();
      return { ok: true, value: token.name };
    }

    return fail(token, "식별자가 필요합니다");
  }

  function parseTypeAnnotation(): ParseResult<TypeName> {
    const token = peek();
    if (
      token.kind === "identifier"
      && (token.name === "number" || token.name === "string" || token.name === "boolean")
    ) {
      advance();
      // 문자열 비교가 token.name을 TypeName의 세 리터럴 중 하나로 좁혀 준다.
      return { ok: true, value: token.name };
    }

    return fail(token, "타입 이름(number, string, boolean)이 필요합니다");
  }

  // 괄호 안에서는 바깥에서 내려오던 우선순위를 이어 가지 않고 가장 낮은 or부터
  // 다시 시작해야 한다. 그래서 그룹핑을 만드는 이번 스텝에, parsePrimary가 우선순위
  // 체인의 꼭대기를 다시 부를 수 있는 완전한 식의 진입점 이름이 함께 생긴다.
  function parseExpression(): ParseResult<Expr> {
    return parseOr();
  }

  // 아래 여섯 함수는 모두 "더 강한 레벨을 먼저 읽고, 같은 레벨 연산자를 while로
  // 이어 붙인다"라는 패턴을 반복한다. 지금은 이 반복 자체가 우선순위 층을 눈에
  // 보이게 하는 교육 포인트이므로 공통 함수로 추상화하지 않는다.
  function parseOr(): ParseResult<Expr> {
    const first = parseAnd();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("||");
      if (operator === undefined) break;

      const right = parseAnd();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseAnd(): ParseResult<Expr> {
    const first = parseEquality();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("&&");
      if (operator === undefined) break;

      const right = parseEquality();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseEquality(): ParseResult<Expr> {
    const first = parseComparison();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("==", "!=");
      if (operator === undefined) break;

      const right = parseComparison();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseComparison(): ParseResult<Expr> {
    const first = parseAdditive();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("<", "<=", ">", ">=");
      if (operator === undefined) break;

      const right = parseAdditive();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseAdditive(): ParseResult<Expr> {
    const first = parseMultiplicative();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("+", "-");
      if (operator === undefined) break;

      const right = parseMultiplicative();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseMultiplicative(): ParseResult<Expr> {
    const first = parseUnary();
    if (!first.ok) return first;

    let left = first.value;

    while (true) {
      const operator = matchOperator("*", "/", "%");
      if (operator === undefined) break;

      const right = parseUnary();
      if (!right.ok) return right;

      left = { kind: "binary", operator, left, right: right.value };
    }

    return { ok: true, value: left };
  }

  function parseUnary(): ParseResult<Expr> {
    const operator = matchOperator("-", "!");
    if (operator !== undefined) {
      // 이항 레벨은 while로 왼쪽 결합을 만들지만, 피연산자 앞에 붙는 전위 단항은
      // 오른쪽 결합이다. 자기 자신을 다시 불러 - -3도 안쪽 단항부터 차례로 묶는다.
      const operand = parseUnary();
      if (!operand.ok) return operand;

      return { ok: true, value: { kind: "unary", operator, operand: operand.value } };
    }

    return parsePrimary();
  }

  function parsePrimary(): ParseResult<Expr> {
    if (matchPunct("(")) {
      // 괄호는 묶는 방법만 정한다. 트리가 완성되면 그 묶음은 자식 관계 자체에 이미
      // 기록되므로 group 노드를 덧붙이지 않고 안쪽 식을 그대로 돌려준다. Expr에
      // group 변형이 없는 이유도 같다.
      const inner = parseExpression();
      if (!inner.ok) return inner;

      const closed = expectPunct(")");
      if (!closed.ok) return closed;

      return { ok: true, value: inner.value };
    }

    const token = peek();

    // 토큰에서는 number와 string이 서로 다른 갈래이고, 불리언은 keyword 갈래지만
    // AST에서는 셋이 모두 하나의 literal 갈래로 모인다. 각 kind 검사만으로 Token
    // 유니온이 충분히 좁혀지므로 아래 필드를 읽는 데 타입 단언은 하나도 필요 없다.
    // 넓은 Token을 돌려주는 advance의 반환값은 읽지 않고 커서만 옮기며, 값은 이미
    // 좁혀진 token에서 읽어 토큰의 구체적인 갈래를 끝까지 유지한다.
    if (token.kind === "number") {
      advance();
      return { ok: true, value: { kind: "literal", value: token.value } };
    }

    if (token.kind === "string") {
      advance();
      return { ok: true, value: { kind: "literal", value: token.value } };
    }

    if (token.kind === "keyword" && (token.word === "true" || token.word === "false")) {
      advance();
      // 키워드의 철자를 그대로 싣지 않고 실제 boolean 값으로 바꿔 literal에 넣는다.
      return { ok: true, value: { kind: "literal", value: token.word === "true" } };
    }

    if (token.kind === "identifier") {
      advance();

      // 식별자 바로 뒤의 여는 괄호는 그 이름을 함수로 호출한다는 표식이다. 매개변수
      // 목록과 대칭으로, 바로 닫히면 0개이고 그렇지 않으면 하나를 먼저 읽은 뒤
      // 콤마가 있는 동안만 다음 식을 읽어 1개와 N개를 같은 흐름으로 처리한다.
      if (matchPunct("(")) {
        const args: Expr[] = [];

        if (!checkPunct(")")) {
          const firstArg = parseExpression();
          if (!firstArg.ok) return firstArg;
          args.push(firstArg.value);

          while (matchPunct(",")) {
            const arg = parseExpression();
            if (!arg.ok) return arg;
            args.push(arg.value);
          }
        }

        const closed = expectPunct(")");
        if (!closed.ok) return closed;

        // callee는 이름 문자열일 뿐이며, 실제로 존재하는 함수인지는 파서가 확인하지
        // 않는다. 그 확인은 다음 화의 스코프 해석 몫이다. 따라서 factorial 본문에서
        // factorial(n - 1)을 부르는 재귀도 다른 호출과 완전히 같은 경로로 파싱되며,
        // 재귀만을 위한 특별 처리는 파서에 없다.
        return { ok: true, value: { kind: "call", callee: token.name, args } };
      }

      // 여는 괄호가 이어지지 않으면 호출이 아니라 이름 자체를 가리키는 식이다.
      return { ok: true, value: { kind: "identifier", name: token.name } };
    }

    // 식이 될 수 없는 토큰도 예외를 일으키지 않고 위치가 분리된 진단 값이 된다.
    return fail(token, "표현식이 와야 하는 자리입니다");
  }

  function parseStatement(): ParseResult<Statement> {
    if (checkPunct("{")) return parseBlock();
    if (checkKeyword("if")) return parseIfStatement();
    if (checkKeyword("while")) return parseWhileStatement();
    if (checkKeyword("let")) return parseVarDecl();
    if (checkKeyword("return")) return parseReturnStatement();

    const token = peek();
    const next = peekNext();
    if (token.kind === "identifier" && next.kind === "operator" && next.op === "=") {
      return parseAssignment();
    }

    const expression = parseExpression();
    if (!expression.ok) return expression;

    const semicolon = expectPunct(";");
    if (!semicolon.ok) return semicolon;

    return { ok: true, value: { kind: "exprStatement", expression: expression.value } };
  }

  function parseBlock(): ParseResult<Block> {
    const opened = expectPunct("{");
    if (!opened.ok) return opened;

    const statements: Statement[] = [];

    // eof 검사 없이 `}`만 기다리면 닫는 중괄호가 빠진 입력에서 같은 eof를 보며
    // 반복할 수 있다. 입력 끝에서는 반복을 멈추고 아래 expectPunct의 실패 값을 돌려준다.
    while (!checkPunct("}") && !isAtEnd()) {
      const statement = parseStatement();
      if (!statement.ok) return statement;

      statements.push(statement.value);
    }

    const closed = expectPunct("}");
    if (!closed.ok) return closed;

    return { ok: true, value: { kind: "block", statements } };
  }

  function parseIfStatement(): ParseResult<IfStatement> {
    const keyword = expectKeyword("if");
    if (!keyword.ok) return keyword;

    const opened = expectPunct("(");
    if (!opened.ok) return opened;

    const condition = parseExpression();
    if (!condition.ok) return condition;

    const closed = expectPunct(")");
    if (!closed.ok) return closed;

    const thenBranch = parseBlock();
    if (!thenBranch.ok) return thenBranch;

    let elseBranch: Block | IfStatement | null = null;
    if (matchKeyword("else") !== undefined) {
      // else 다음이 if라면 parseIfStatement가 그 키워드부터 다시 소비한다. 그래서
      // elseBranch가 Block뿐 아니라 IfStatement도 허용하며, 체인이 AST에 그대로 남는다.
      const parsedElse = checkKeyword("if") ? parseIfStatement() : parseBlock();
      if (!parsedElse.ok) return parsedElse;

      elseBranch = parsedElse.value;
    }

    return {
      ok: true,
      value: {
        kind: "if",
        condition: condition.value,
        thenBranch: thenBranch.value,
        elseBranch,
      },
    };
  }

  function parseWhileStatement(): ParseResult<Statement> {
    const keyword = expectKeyword("while");
    if (!keyword.ok) return keyword;

    const opened = expectPunct("(");
    if (!opened.ok) return opened;

    const condition = parseExpression();
    if (!condition.ok) return condition;

    const closed = expectPunct(")");
    if (!closed.ok) return closed;

    const body = parseBlock();
    if (!body.ok) return body;

    return {
      ok: true,
      value: { kind: "while", condition: condition.value, body: body.value },
    };
  }

  function parseVarDecl(): ParseResult<Statement> {
    const keyword = expectKeyword("let");
    if (!keyword.ok) return keyword;

    const name = expectIdentifier();
    if (!name.ok) return name;

    const colon = expectPunct(":");
    if (!colon.ok) return colon;

    const declaredType = parseTypeAnnotation();
    if (!declaredType.ok) return declaredType;

    const equals = expectOperator("=");
    if (!equals.ok) return equals;

    const initializer = parseExpression();
    if (!initializer.ok) return initializer;

    const semicolon = expectPunct(";");
    if (!semicolon.ok) return semicolon;

    return {
      ok: true,
      value: {
        kind: "varDecl",
        name: name.value,
        declaredType: declaredType.value,
        initializer: initializer.value,
      },
    };
  }

  function parseAssignment(): ParseResult<Statement> {
    const name = expectIdentifier();
    if (!name.ok) return name;

    const equals = expectOperator("=");
    if (!equals.ok) return equals;

    const value = parseExpression();
    if (!value.ok) return value;

    const semicolon = expectPunct(";");
    if (!semicolon.ok) return semicolon;

    return { ok: true, value: { kind: "assignment", name: name.value, value: value.value } };
  }

  function parseReturnStatement(): ParseResult<Statement> {
    const keyword = expectKeyword("return");
    if (!keyword.ok) return keyword;

    const value = parseExpression();
    if (!value.ok) return value;

    const semicolon = expectPunct(";");
    if (!semicolon.ok) return semicolon;

    return { ok: true, value: { kind: "return", value: value.value } };
  }

  function parseParam(): ParseResult<Param> {
    const name = expectIdentifier();
    if (!name.ok) return name;

    // 매개변수 이름과 타입을 콜론으로 분리해 두면, 호출자가 넘길 값의 타입을 함수
    // 본문까지 읽지 않고도 선언의 시그니처만으로 확인할 수 있다.
    const colon = expectPunct(":");
    if (!colon.ok) return colon;

    const typeAnnotation = parseTypeAnnotation();
    if (!typeAnnotation.ok) return typeAnnotation;

    return {
      ok: true,
      value: { name: name.value, typeAnnotation: typeAnnotation.value },
    };
  }

  function parseFnDecl(): ParseResult<FuncDecl> {
    const keyword = expectKeyword("fn");
    if (!keyword.ok) return keyword;

    const name = expectIdentifier();
    if (!name.ok) return name;

    const opened = expectPunct("(");
    if (!opened.ok) return opened;

    const params: Param[] = [];

    // 바로 닫는 괄호가 오면 0개로 끝낸다. 그렇지 않으면 하나를 먼저 읽고 콤마가
    // 있는 동안만 더 읽는다. 이 "하나 읽고 반복" 패턴 하나로 1개와 N개를 함께
    // 처리하고, 바깥의 닫는 괄호 검사까지 합쳐 0개인 목록도 같은 흐름에 놓는다.
    if (!checkPunct(")")) {
      const firstParam = parseParam();
      if (!firstParam.ok) return firstParam;
      params.push(firstParam.value);

      while (matchPunct(",")) {
        const param = parseParam();
        if (!param.ok) return param;
        params.push(param.value);
      }
    }

    const closed = expectPunct(")");
    if (!closed.ok) return closed;

    // 반환 타입을 선언 시점에 반드시 적게 하면 본문을 살펴보지 않아도 함수의 입력과
    // 출력 시그니처가 모두 확정된다. 타입 이름의 범위는 기존 세 가지를 그대로 쓴다.
    const colon = expectPunct(":");
    if (!colon.ok) return colon;

    const returnType = parseTypeAnnotation();
    if (!returnType.ok) return returnType;

    // 함수 본문도 별도 규칙을 만들지 않고 이미 완성된 블록 파서에 맡긴다. 따라서
    // 지난 단계에서 추가한 if와 while을 비롯한 모든 문을 함수 안에서도 그대로 쓴다.
    const body = parseBlock();
    if (!body.ok) return body;

    return {
      ok: true,
      value: {
        kind: "funcDecl",
        name: name.value,
        params,
        returnType: returnType.value,
        body: body.value,
      },
    };
  }

  function parseProgram(): ParseResult<Program> {
    const functions: FuncDecl[] = [];
    const statements: Statement[] = [];

    // Program이 두 목록을 따로 가지므로, 함수 선언이 파일의 앞·중간·뒤 어디에
    // 적혀 있든 최상위 문과 섞이지 않고 functions와 statements에 각각 모인다.
    while (!isAtEnd()) {
      if (checkKeyword("fn")) {
        const declaration = parseFnDecl();
        if (!declaration.ok) return declaration;
        functions.push(declaration.value);
      } else {
        const statement = parseStatement();
        if (!statement.ok) return statement;
        statements.push(statement.value);
      }
    }

    return { ok: true, value: { kind: "program", functions, statements } };
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
    parseStatement,
    parseBlock,
    parseIfStatement,
    parseWhileStatement,
    parseFnDecl,
    parseParam,
    parseProgram,
  };
}
