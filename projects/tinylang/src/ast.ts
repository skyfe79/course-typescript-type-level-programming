// 타입 어노테이션에 적을 수 있는 이름. tinylang의 값은 세 종류뿐이다.
export type TypeName = "number" | "string" | "boolean";

// 이항/단항 연산자는 토큰의 연산자 집합에서 그 자리에 실제로 올 수 있는 것만 추려 둔다.
// string으로 넓히지 않아 파서가 만들 수 없는 연산자를 AST에 적는 실수를 막는다.
export type BinaryOperator =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | "<=" | ">" | ">="
  | "&&" | "||";

export type UnaryOperator = "-" | "!";

// ── 식 (Expr) ──────────────────────────────────────────────
// 식과 문을 AstNode 하나로 뭉치지 않는다. 뒤의 파서·타입 검사기·코드 생성기가
// 두 타입을 서로 다른 입력으로 받기 때문에, 식 자리에는 Expr만 들어가야 한다.
// 덕분에 while 같은 문을 이항식의 자식으로 넣는 잘못도 실행 전에 거절된다.
// brief 초안의 numberLiteral·binaryExpr·callExpr 대신 literal·binary·call을 쓰는 것도
// 이후 모든 단계가 이 판별자 이름으로 분기하기 때문이다.
// 타입 별칭인 유니온은 다른 파일의 선언과 합쳐지지 않는다. 갈래들을 선언 병합이 가능한
// 인터페이스에 등록하고 그 값들에서 Expr를 유도하면, 이 핵심 파일은 오늘 한 번만 고친 뒤
// 다른 파일이 declare module로 새 식을 등록할 수 있다. 필드 모양은 이전 유니온과 같으므로
// 기존 파서·검사기·코드 생성기가 받는 타입의 의미는 바뀌지 않는다.
export interface ExprRegistry {
  literal: { readonly kind: "literal"; readonly value: number | string | boolean };
  identifier: { readonly kind: "identifier"; readonly name: string };
  binary: { readonly kind: "binary"; readonly operator: BinaryOperator; readonly left: Expr; readonly right: Expr };
  unary: { readonly kind: "unary"; readonly operator: UnaryOperator; readonly operand: Expr };
  call: { readonly kind: "call"; readonly callee: string; readonly args: readonly Expr[] };
}

export type Expr = ExprRegistry[keyof ExprRegistry];

// ── 블록과 문 (Statement) ──────────────────────────────────
export type Block = {
  readonly kind: "block";
  // 필드만 readonly여도 가변 배열이면 push는 가능하다. 배열 요소까지 바뀌지 않도록
  // readonly Statement[]로 적어 대입과 push를 모두 컴파일 단계에서 막는다.
  readonly statements: readonly Statement[];
};

export type IfStatement = {
  readonly kind: "if";
  readonly condition: Expr;
  readonly thenBranch: Block;
  // else 뒤에는 블록이 올 수도 있고, `else if`처럼 또 다른 if 문이 올 수도 있다.
  readonly elseBranch: Block | IfStatement | null;
};

export type Statement =
  | Block
  | IfStatement
  // brief 초안의 letStatement 대신 varDecl을 쓴다. declaredType까지 함께 두어야 이후
  // 타입 검사기가 선언의 어노테이션을 실제 초기화 식의 타입과 비교할 수 있다.
  | { readonly kind: "varDecl"; readonly name: string; readonly declaredType: TypeName; readonly initializer: Expr }
  | { readonly kind: "assignment"; readonly name: string; readonly value: Expr }
  | { readonly kind: "while"; readonly condition: Expr; readonly body: Block }
  | { readonly kind: "return"; readonly value: Expr }
  | { readonly kind: "exprStatement"; readonly expression: Expr };

// ── 함수 선언과 프로그램 ───────────────────────────────────
export type Param = {
  readonly name: string;
  readonly typeAnnotation: TypeName;
};

export type FuncDecl = {
  readonly kind: "funcDecl";
  readonly name: string;
  // 배열 필드도 readonly 배열로 만들어 매개변수의 순서와 개수를 만든 뒤 바꾸지 못하게 한다.
  readonly params: readonly Param[];
  readonly returnType: TypeName;
  readonly body: Block;
};

export type Program = {
  readonly kind: "program";
  readonly functions: readonly FuncDecl[];
  readonly statements: readonly Statement[];
};

// 세 갈래를 한 이름으로 부를 자리가 필요할 때 쓴다. 평소에는 더 정확한 Expr와
// Statement를 유지하고, 트리 전체를 순회하는 코드처럼 공통 이름이 필요할 때만 사용한다.
export type AstNode = Expr | Statement | FuncDecl | Program;
