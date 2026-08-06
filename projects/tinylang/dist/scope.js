// 이름이 가리키는 타입과 선언 종류를 스코프별로 저장하는 심볼 테이블이다.
// 전역 스코프는 null을, 블록이나 함수의 안쪽 스코프는 바깥 Scope를 넘겨 만든다.
// 생성 뒤에는 readonly parent를 다른 스코프로 갈아 끼울 수 없어 체인이 유지된다.
export function createScope(parent) {
    return { bindings: new Map(), parent };
}
// 재선언 검사는 현재 스코프의 Map에만 한다. 부모에 같은 이름이 있어도 막지 않으므로
// 안쪽 선언이 바깥 선언을 가리는 섀도잉은 허용되고, 같은 스코프의 중복만 거절된다.
export function declare(scope, name, binding) {
    if (scope.bindings.has(name))
        return false;
    // 중복일 때는 set을 호출하지 않으므로 먼저 등록된 바인딩을 덮어쓰지 않는다.
    scope.bindings.set(name, binding);
    return true;
}
// 첫 인자를 Scope | null로 받으면 반복문 안의 current와 current.parent가 계속 같은
// 타입을 유지한다. 덕분에 null도 체인의 끝이나 처음 값으로 자연스럽게 다루며, 재귀
// 호출이나 null만 처리하는 별도 헬퍼 없이 한 함수에서 조회를 마칠 수 있다.
export function lookup(scope, name) {
    let current = scope;
    while (current !== null) {
        const binding = current.bindings.get(name);
        // 현재 스코프에서 찾자마자 반환하므로 체인에서 먼저 만난 스코프가 이긴다. 이것이
        // 안쪽 선언이 바깥쪽의 같은 이름을 가리는 섀도잉 규칙이다. Map.get이 준 undefined는
        // 이 자리에서만 검사하고, 함수 바깥에는 명시적인 LookupResult만 내보낸다.
        if (binding !== undefined)
            return { kind: "found", binding };
        current = current.parent;
    }
    // 실패 갈래에는 binding 대신 찾으려던 이름을 보존한다. 이후 타입 검사나 진단 단계는
    // 호출 당시의 name을 따로 전달받지 않아도 이 값만으로 오류 메시지를 만들 수 있다.
    return { kind: "not-found", name };
}
