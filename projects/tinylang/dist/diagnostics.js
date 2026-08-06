// 소스 위치의 서로 다른 단위를 브랜드 타입으로 구분하고 안전하게 만드는 도구다.
// 단언은 외부에서 아무 number에나 브랜드를 붙이지 못하도록 이 생성 함수 안에만
// 가둔다. 이후 코드는 Offset을 받는 자리에 브랜드 없는 number를 넣을 수 없다.
export function toOffset(n) {
    return n;
}
// Line 역시 같은 스마트 생성자 경계를 통과해야 한다. 이 화에서는 위치를 타입으로
// 구분하는 데 집중하므로 값의 범위를 제한하지 않고, 주어진 숫자를 그대로 보존한다.
export function toLine(n) {
    return n;
}
// 진단 객체를 직접 조립하는 대신 이 생성 경계를 공통으로 거치게 한다. 필드가
// 늘어나더라도 렉서와 파서는 이 함수의 계약을 따라 같은 모양의 값을 만든다.
export function makeDiagnostic(severity, message, offset, line) {
    return { severity, message, offset, line };
}
