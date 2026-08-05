// 소스 위치의 서로 다른 단위를 브랜드 타입으로 구분하고 안전하게 만드는 도구다.

// Set은 실행 중에 어떤 숫자가 등록되어 있는지는 확인할 수 있지만, number 자체를
// "문자 오프셋"과 "줄 번호"라는 서로 다른 타입으로 갈라 주지는 못한다. 복제할 수
// 없는 unique symbol 브랜드를 붙이면 두 값이 런타임에는 number 그대로이면서도
// 컴파일 단계에서는 서로 바꿔 쓸 수 없는 단위가 된다.
export declare const offsetBrand: unique symbol;
export type Offset = number & { readonly [offsetBrand]: true };

// 단언은 외부에서 아무 number에나 브랜드를 붙이지 못하도록 이 생성 함수 안에만
// 가둔다. 이후 코드는 Offset을 받는 자리에 브랜드 없는 number를 넣을 수 없다.
export function toOffset(n: number): Offset {
  return n as Offset;
}

export declare const lineBrand: unique symbol;
export type Line = number & { readonly [lineBrand]: true };

// Line 역시 같은 스마트 생성자 경계를 통과해야 한다. 이 화에서는 위치를 타입으로
// 구분하는 데 집중하므로 값의 범위를 제한하지 않고, 주어진 숫자를 그대로 보존한다.
export function toLine(n: number): Line {
  return n as Line;
}

// 오류와 경고를 문자열 전체로 넓히지 않으면 진단 소비자가 두 경우를 빠짐없이
// 나눌 수 있다. 이후 단계가 새 심각도를 추가하면 그 변경도 타입을 따라 전파된다.
export type Severity = "error" | "warning";

// 진단은 메시지 안에 위치를 중복해서 끼워 넣지 않는다. 단위가 구분된 필드로
// 보관해야 출력 형식을 바꾸거나 위치별로 정렬할 때 문자열을 다시 파싱하지 않는다.
export type Diagnostic = {
  readonly severity: Severity;
  readonly message: string;
  readonly offset: Offset;
  readonly line: Line;
};

// 진단 객체를 직접 조립하는 대신 이 생성 경계를 공통으로 거치게 한다. 필드가
// 늘어나더라도 렉서와 파서는 이 함수의 계약을 따라 같은 모양의 값을 만든다.
export function makeDiagnostic(
  severity: Severity,
  message: string,
  offset: Offset,
  line: Line,
): Diagnostic {
  return { severity, message, offset, line };
}
