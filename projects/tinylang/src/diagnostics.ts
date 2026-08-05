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
