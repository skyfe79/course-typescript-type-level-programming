// 식 AST를 따라가며 각 식의 타입을 계산하고, 타입 규칙을 어긴 자리에 진단을 만든다.
import { makeDiagnostic, toLine, toOffset } from "./diagnostics.js";
import { createScope, declare, lookup } from "./scope.js";
export const BUILTIN_SIGNATURES = {
    print: { params: ["any"], returnType: "void" },
    input: { params: ["string"], returnType: "string" },
    toNumber: { params: ["string"], returnType: "number" },
    random: { params: ["number"], returnType: "number" },
    toString: { params: ["any"], returnType: "string" },
};
function typeError(message) {
    // AST 노드가 위치를 싣고 있지 않아 offset·line을 0으로 둔다. 진단을 만드는 자리를
    // 이 함수 하나로 모아 두면, 나중에 노드에 위치가 생겼을 때 여기만 고치면 된다.
    return makeDiagnostic("error", message, toOffset(0), toLine(0));
}
// 리터럴의 자바스크립트 타입을 tinylang의 타입 이름으로 옮긴다. Expr의 literal이
// number | string | boolean만 담으므로 세 갈래로 끝나고, 값 유니온이 늘어나면
// 이 함수의 반환 자리가 먼저 컴파일 오류로 알려 준다.
function literalType(value) {
    switch (typeof value) {
        case "number":
            return "number";
        case "string":
            return "string";
        case "boolean":
            return "boolean";
    }
}
// 완전성을 지키는 방법은 자리에 따라 다르다. 연산자 분류는 이 타입 수준 대입으로 두 집합이
// 같은지 확인하고, 노드 순회는 switch의 default에서 never 대입으로 갈래를 소진한다.
const binaryOperatorClassificationIsComplete = true;
// 문자열 전체를 BuiltinName으로 단언하지 않고 실제 표의 소유 키인지 확인한다.
// Record의 키 검사는 위의 정본 타입과 연결되어 있어 표와 판별 결과가 함께 움직인다.
function isBuiltinName(name) {
    return Object.hasOwn(BUILTIN_SIGNATURES, name);
}
function checkUnary(operator, operand) {
    // 자식의 실제 오류가 있으면 연산자 규칙을 적용할 타입 자체가 없다. 이때는 새
    // 진단을 만들지 않고 원래 실패를 올려보내 원인 하나가 두 오류처럼 보이지 않게 한다.
    if (!operand.ok)
        return operand;
    switch (operator) {
        case "-":
            if (operand.type === "number")
                return { ok: true, type: "number" };
            return {
                ok: false,
                diagnostics: [typeError(`단항 연산자 '-'의 피연산자는 number여야 합니다 (현재 ${operand.type})`)],
            };
        case "!":
            if (operand.type === "boolean")
                return { ok: true, type: "boolean" };
            return {
                ok: false,
                diagnostics: [typeError(`단항 연산자 '!'의 피연산자는 boolean이어야 합니다 (현재 ${operand.type})`)],
            };
    }
}
function checkBinary(operator, left, right) {
    // 자식 검사가 실패했다면 그 실패 때문에 생긴 타입 부재를 다시 타입 불일치로
    // 보고하지 않는다. 한쪽 실패는 그 결과를 그대로 올리고, 양쪽 실패만 두 목록을
    // 합쳐서 실제 원인 수만큼 남기므로 정의되지 않은 이름 하나가 연쇄 오류를 만들지 않는다.
    if (!left.ok && !right.ok) {
        return { ok: false, diagnostics: [...left.diagnostics, ...right.diagnostics] };
    }
    if (!left.ok)
        return left;
    if (!right.ok)
        return right;
    switch (operator) {
        case "+": {
            // 덧셈과 이어 붙이기는 같은 기호를 쓰지만 결과 타입까지 피연산자 타입을 따른다.
            // 서로 다른 타입을 자바스크립트처럼 조용히 문자열로 바꾸지 않아, toString을 쓴
            // 명시적 변환만 허용한다. void는 어느 쌍에도 해당하지 않아 같은 진단으로 거절된다.
            if (left.type === "number" && right.type === "number") {
                return { ok: true, type: "number" };
            }
            if (left.type === "string" && right.type === "string") {
                return { ok: true, type: "string" };
            }
            return {
                ok: false,
                diagnostics: [typeError(`'+'의 피연산자는 모두 number이거나 모두 string이어야 합니다 (현재 ${left.type}, ${right.type})`)],
            };
        }
        case "-":
        case "*":
        case "/":
        case "%":
            if (left.type === "number" && right.type === "number") {
                return { ok: true, type: "number" };
            }
            return {
                ok: false,
                diagnostics: [typeError(`산술 연산자 '${operator}'의 피연산자는 모두 number여야 합니다 (현재 ${left.type}, ${right.type})`)],
            };
        case "==":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
            // 같은 타입인지만 보면 void끼리의 비교도 통과한다. 값이 없는 호출은 비교할
            // 대상 자체가 없으므로, 두 타입의 일치 여부를 보기 전에 따로 거절한다.
            if (left.type === "void" || right.type === "void") {
                return {
                    ok: false,
                    diagnostics: [typeError(`비교 연산자 '${operator}'에는 void 타입을 사용할 수 없습니다 (현재 ${left.type}, ${right.type})`)],
                };
            }
            if (left.type === right.type) {
                return { ok: true, type: "boolean" };
            }
            return {
                ok: false,
                diagnostics: [typeError(`비교 연산자 '${operator}'의 두 피연산자 타입이 같아야 합니다 (현재 ${left.type}, ${right.type})`)],
            };
        case "&&":
        case "||":
            if (left.type === "boolean" && right.type === "boolean") {
                return { ok: true, type: "boolean" };
            }
            return {
                ok: false,
                diagnostics: [typeError(`논리 연산자 '${operator}'의 피연산자는 모두 boolean이어야 합니다 (현재 ${left.type}, ${right.type})`)],
            };
    }
}
export function checkExpr(expr, scope, ctx) {
    switch (expr.kind) {
        case "literal":
            return { ok: true, type: literalType(expr.value) };
        case "identifier": {
            const found = lookup(scope, expr.name);
            if (found.kind === "found") {
                return { ok: true, type: found.binding.type };
            }
            return {
                ok: false,
                diagnostics: [typeError(`정의되지 않은 이름 '${found.name}'입니다`)],
            };
        }
        case "binary": {
            // 한쪽 실패만 보고 멈추지 않고 양쪽을 각각 검사해야 서로 독립적인 두 원인을
            // 함께 보여 줄 수 있다. 합치는 과정의 연쇄 오류 억제는 checkBinary가 맡는다.
            const left = checkExpr(expr.left, scope, ctx);
            const right = checkExpr(expr.right, scope, ctx);
            return checkBinary(expr.operator, left, right);
        }
        case "unary": {
            const operand = checkExpr(expr.operand, scope, ctx);
            return checkUnary(expr.operator, operand);
        }
        case "ternary": {
            // 아직 렉서와 파서에는 `? :` 문법이 없지만, 보강 파일이 등록한 AST를 손으로
            // 조립해 넣으면 검사기는 다른 식과 똑같이 자식을 재귀 검사해야 한다. 앞선
            // 자식이 실패했을 때 그 결과를 그대로 올려 연쇄 진단을 만들지 않는다.
            const condition = checkExpr(expr.condition, scope, ctx);
            if (!condition.ok)
                return condition;
            if (condition.type !== "boolean") {
                return {
                    ok: false,
                    diagnostics: [typeError(`삼항식의 조건은 boolean 타입이어야 하지만 ${condition.type} 타입입니다`)],
                };
            }
            const whenTrue = checkExpr(expr.whenTrue, scope, ctx);
            if (!whenTrue.ok)
                return whenTrue;
            const whenFalse = checkExpr(expr.whenFalse, scope, ctx);
            if (!whenFalse.ok)
                return whenFalse;
            if (whenTrue.type !== whenFalse.type) {
                return {
                    ok: false,
                    diagnostics: [typeError(`삼항식의 두 갈래 타입이 같아야 합니다 (현재 ${whenTrue.type}, ${whenFalse.type})`)],
                };
            }
            return { ok: true, type: whenTrue.type };
        }
        case "call": {
            // 코드 생성기도 프렐류드 이름을 사용자 함수보다 먼저 판별한다. 검사 순서를
            // 똑같이 맞춰야 여기서 확인한 시그니처와 실행 때 실제로 부르는 함수가 일치한다.
            if (isBuiltinName(expr.callee)) {
                const signature = BUILTIN_SIGNATURES[expr.callee];
                if (expr.args.length !== signature.params.length) {
                    return {
                        ok: false,
                        diagnostics: [typeError(`함수 '${expr.callee}'는 인자 ${signature.params.length}개가 필요하지만 ${expr.args.length}개를 받았습니다`)],
                    };
                }
                const diagnostics = [];
                for (let index = 0; index < expr.args.length; index += 1) {
                    const argument = checkExpr(expr.args[index], scope, ctx);
                    if (!argument.ok) {
                        diagnostics.push(...argument.diagnostics);
                        continue;
                    }
                    const expected = signature.params[index];
                    if (expected === "any") {
                        if (argument.type === "void") {
                            diagnostics.push(typeError(`함수 '${expr.callee}'의 ${index + 1}번째 인자는 값이 있는 타입이어야 하지만 void 타입입니다`));
                        }
                    }
                    else if (argument.type !== expected) {
                        diagnostics.push(typeError(`함수 '${expr.callee}'의 ${index + 1}번째 인자는 ${expected} 타입이어야 하지만 ${argument.type} 타입입니다`));
                    }
                }
                if (diagnostics.length > 0)
                    return { ok: false, diagnostics };
                return { ok: true, type: signature.returnType };
            }
            const signature = ctx.functions.get(expr.callee);
            if (signature === undefined) {
                return {
                    ok: false,
                    diagnostics: [typeError(`정의되지 않은 함수 '${expr.callee}'입니다`)],
                };
            }
            // 개수가 다르면 어느 인자와 어느 매개변수를 짝지어야 하는지부터 성립하지
            // 않으므로, 개별 인자의 타입을 보기 전에 호출 형태의 오류 하나로 끝낸다.
            if (expr.args.length !== signature.params.length) {
                return {
                    ok: false,
                    diagnostics: [typeError(`함수 '${expr.callee}'는 인자 ${signature.params.length}개가 필요하지만 ${expr.args.length}개를 받았습니다`)],
                };
            }
            const diagnostics = [];
            for (let index = 0; index < expr.args.length; index += 1) {
                const argument = checkExpr(expr.args[index], scope, ctx);
                if (!argument.ok) {
                    // 인자 안의 실패는 그 진단만 보존한다. 타입을 얻지 못했다는 사실을 다시
                    // 매개변수 불일치로 보고하면 같은 원인이 중복되기 때문이다.
                    diagnostics.push(...argument.diagnostics);
                    continue;
                }
                const expected = signature.params[index].typeAnnotation;
                if (argument.type !== expected) {
                    diagnostics.push(typeError(`함수 '${expr.callee}'의 ${index + 1}번째 인자는 ${expected} 타입이어야 하지만 ${argument.type} 타입입니다`));
                }
            }
            if (diagnostics.length > 0)
                return { ok: false, diagnostics };
            return { ok: true, type: signature.returnType };
        }
        default: {
            // 위에서 모든 kind를 처리했다면 여기 도달한 값의 타입은 never다. 나중에 노드 종류가
            // 하나 늘고 그 case를 빠뜨리면 늘어난 갈래가 never에 대입되지 않아 컴파일 오류가 난다.
            // 외부 JSON처럼 타입 단언을 거친 값이 흘러오면 실행 중에도 이 throw가 그 자리에서
            // 멈춰 세우므로, 타입 검사 뒤에 남은 죽은 코드가 아니라 런타임 경계의 방어이기도 하다.
            const exhaustive = expr;
            throw new Error(`처리하지 않은 식 종류입니다: ${JSON.stringify(exhaustive)}`);
        }
    }
}
function checkCondition(expr, scope, ctx) {
    const condition = checkExpr(expr, scope, ctx);
    // 조건식 안에서 이미 실패했다면 비교할 타입이 없다. 원래 진단만 올려보내야
    // "조건은 boolean"이라는 결과 오류가 실제 원인 뒤에 연쇄해서 붙지 않는다.
    if (!condition.ok)
        return condition.diagnostics;
    if (condition.type === "boolean")
        return [];
    return [typeError(`조건은 boolean 타입이어야 하지만 ${condition.type} 타입입니다`)];
}
export function checkStatement(stmt, scope, ctx) {
    switch (stmt.kind) {
        case "block": {
            // 블록마다 자식 스코프를 열어야 안쪽 선언이 바깥 이름을 가릴 수 있으면서도,
            // 블록이 끝난 뒤 그 선언이 바깥 문에 새어 나가지 않는다. 문은 같은 자식
            // 스코프에서 차례로 검사하므로 앞선 선언은 뒤따르는 문에서 보인다.
            const blockScope = createScope(scope);
            const diagnostics = [];
            for (const statement of stmt.statements) {
                diagnostics.push(...checkStatement(statement, blockScope, ctx));
            }
            return diagnostics;
        }
        case "if": {
            const diagnostics = [
                ...checkCondition(stmt.condition, scope, ctx),
                ...checkStatement(stmt.thenBranch, scope, ctx),
            ];
            if (stmt.elseBranch !== null) {
                // Block과 IfStatement가 모두 Statement이므로 같은 함수를 다시 부르면
                // else if 사슬도 별도 반복문 없이 AST 모양 그대로 재귀해 검사된다.
                diagnostics.push(...checkStatement(stmt.elseBranch, scope, ctx));
            }
            return diagnostics;
        }
        case "varDecl": {
            const diagnostics = [];
            const initializer = checkExpr(stmt.initializer, scope, ctx);
            if (!initializer.ok) {
                diagnostics.push(...initializer.diagnostics);
            }
            else if (initializer.type !== stmt.declaredType) {
                diagnostics.push(typeError(`변수 '${stmt.name}'의 선언 타입은 ${stmt.declaredType}이지만 초기값은 ${initializer.type} 타입입니다`));
            }
            // 초기화식이 틀려도 이름은 사용자가 선언한 타입으로 등록한다. 그래야 이후
            // 문들이 같은 이름을 "정의되지 않음"으로 거듭 보고하는 가짜 연쇄 오류가 없다.
            const declared = declare(scope, stmt.name, {
                type: stmt.declaredType,
                kind: "let",
            });
            if (!declared) {
                diagnostics.push(typeError(`같은 스코프에 변수 '${stmt.name}'이 이미 선언되어 있습니다`));
            }
            return diagnostics;
        }
        case "assignment": {
            const target = lookup(scope, stmt.name);
            if (target.kind === "not-found") {
                return [typeError(`정의되지 않은 이름 '${target.name}'에 대입할 수 없습니다`)];
            }
            const value = checkExpr(stmt.value, scope, ctx);
            if (!value.ok)
                return value.diagnostics;
            if (value.type === target.binding.type)
                return [];
            return [typeError(`이름 '${stmt.name}'에는 ${target.binding.type} 타입을 대입해야 하지만 ${value.type} 타입입니다`)];
        }
        case "while": {
            return [
                ...checkCondition(stmt.condition, scope, ctx),
                ...checkStatement(stmt.body, scope, ctx),
            ];
        }
        case "return": {
            const value = checkExpr(stmt.value, scope, ctx);
            // returnType: null은 곧 현재 위치가 어떤 함수에도 속하지 않는다는 뜻이다.
            // 값 식의 독립적인 오류도 먼저 보존하고, 함수 밖 return이라는 문맥 오류도 남긴다.
            if (ctx.returnType === null) {
                return [
                    ...(!value.ok ? value.diagnostics : []),
                    typeError("함수 밖에서는 return을 쓸 수 없습니다"),
                ];
            }
            if (!value.ok)
                return value.diagnostics;
            if (value.type === ctx.returnType)
                return [];
            return [typeError(`반환값은 ${ctx.returnType} 타입이어야 하지만 ${value.type} 타입입니다`)];
        }
        case "exprStatement": {
            const expression = checkExpr(stmt.expression, scope, ctx);
            if (!expression.ok)
                return expression.diagnostics;
            // 문 자리에서는 값이 필요 없으므로 성공 여부만 확인하고 계산된 타입은 버린다.
            return [];
        }
        default: {
            // 위에서 모든 kind를 처리했다면 여기 도달한 값의 타입은 never다. 나중에 노드 종류가
            // 하나 늘고 그 case를 빠뜨리면 늘어난 갈래가 never에 대입되지 않아 컴파일 오류가 난다.
            // 외부 JSON처럼 타입 단언을 거친 값이 흘러오면 실행 중에도 이 throw가 그 자리에서
            // 멈춰 세우므로, 타입 검사 뒤에 남은 죽은 코드가 아니라 런타임 경계의 방어이기도 하다.
            const exhaustive = stmt;
            throw new Error(`처리하지 않은 문 종류입니다: ${JSON.stringify(exhaustive)}`);
        }
    }
}
export function checkFuncDecl(func, outerScope, functions) {
    const paramScope = createScope(outerScope);
    const diagnostics = [];
    for (const param of func.params) {
        const declared = declare(paramScope, param.name, {
            type: param.typeAnnotation,
            kind: "param",
        });
        if (!declared) {
            diagnostics.push(typeError(`함수 '${func.name}'에 매개변수 이름 '${param.name}'이 중복되었습니다`));
        }
    }
    diagnostics.push(...checkStatement(func.body, paramScope, {
        functions,
        returnType: func.returnType,
    }));
    // 모든 실행 경로가 return에 도달하는지는 단순 타입 비교가 아니라 흐름 분석이
    // 필요하다. 이번 단계에서는 실제로 적힌 return의 값만 검사하고 그 분석은 하지 않는다.
    return diagnostics;
}
export function checkProgram(program) {
    const diagnostics = [];
    const mutableFunctions = new Map();
    // 본문보다 먼저 모든 시그니처를 모으면 앞의 함수가 뒤에 적힌 함수를 호출할 수 있고,
    // 서로를 부르는 상호 재귀도 선언 순서와 무관해진다.
    for (const func of program.functions) {
        if (isBuiltinName(func.name)) {
            // 이미터는 이 이름의 호출을 언제나 프렐류드로 보낸다. 선언을 허용하면 사용자가
            // 만든 함수는 호출될 수 없는 죽은 코드가 되므로, 표에 넣지 않고 선언 자리에서 알린다.
            diagnostics.push(typeError(`'${func.name}'는 내장 함수 이름이라 다시 선언할 수 없습니다`));
            continue;
        }
        if (mutableFunctions.has(func.name)) {
            // 스코프 재선언과 같은 규칙으로 먼저 등록된 시그니처를 유지한다.
            diagnostics.push(typeError(`함수 '${func.name}'이 이미 선언되어 있습니다`));
            continue;
        }
        mutableFunctions.set(func.name, {
            params: func.params,
            returnType: func.returnType,
        });
    }
    const functions = mutableFunctions;
    const globalScope = createScope(null);
    const topLevelContext = { functions, returnType: null };
    // 최상위 문 자체를 전역 스코프에서 차례로 검사해 선언을 모두 남긴 뒤 함수 본문을
    // 검사한다. 그래서 함수는 소스상 위치와 상관없이 전역 변수를 볼 수 있다. 명시적인
    // 최상위 블록은 checkStatement가 자식 스코프를 열므로 블록 경계는 그대로 지켜진다.
    for (const statement of program.statements) {
        diagnostics.push(...checkStatement(statement, globalScope, topLevelContext));
    }
    for (const func of program.functions) {
        diagnostics.push(...checkFuncDecl(func, globalScope, functions));
    }
    return diagnostics;
}
