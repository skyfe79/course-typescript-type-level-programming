// infer의 제약 있는 캡처로 템플릿 리터럴의 숫자 포트만 꺼낸다.
// 실행: node episodes/s21-conditional-types-infer/infer-constrained.ts
// 검사: npx tsc --noEmit

// ExtractPort<S>는 localhost: 다음 자리를 캡처하면서 number 제약까지 함께 검사한다.
// 숫자로 읽히는 문자열이면 숫자 리터럴 타입이 되고, 아니면 never로 떨어진다.
type ExtractPort<S extends string> = S extends `localhost:${infer Port extends number}` ? Port : never;

// address는 포트까지 포함한 문자열 값을 리터럴 타입으로 보존한다.
// as const가 있어야 ExtractPort가 3000이라는 구체적인 숫자 타입을 계산할 수 있다.
const address = "localhost:3000" as const;

// ExtractedPort는 문자열 속 숫자 포트를 실제 숫자 리터럴 타입으로 꺼낸 결과다.
// 조건부 타입 안의 캡처가 성공하면 문자열 "3000"이 아니라 숫자 3000으로 남는다.
type ExtractedPort = ExtractPort<typeof address>;   // 3000

// port는 계산된 숫자 리터럴 타입에 맞는 값을 담아 타입 결과를 값으로 확인한다.
// 런타임에서는 일반 숫자처럼 더할 수 있어 캡처 결과가 number 계열임을 보여 준다.
const port: ExtractedPort = 3000;
console.log(`포트 번호 + 1: ${port + 1}`);

export {};
