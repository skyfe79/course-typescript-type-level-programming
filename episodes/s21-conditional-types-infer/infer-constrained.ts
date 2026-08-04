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

// badAddress는 포트 자리에 숫자로 읽을 수 없는 문자를 둔 반례다.
// 같은 패턴을 통과하지 못하므로 ExtractPort의 거짓 분기로 가는지 확인할 수 있다.
const badAddress = "localhost:abcd" as const;

// BadPort는 캡처한 조각이 number 제약을 만족하지 못해 남는 값이 없다.
// 이 결과가 never이면 아무 값도 대입할 수 없는 타입으로 계산된 것이다.
type BadPort = ExtractPort<typeof badAddress>;   // never

// 주석을 풀면 error TS2322: Type '3000' is not assignable to type 'never'. 오류가 난다.
// BadPort가 never라서 숫자 3000도 허용되는 값이 아니다.
// const badPort: BadPort = 3000; // 컴파일 오류 — never에는 아무 값도 대입할 수 없다
console.log("badAddress는 숫자 포트를 캡처하지 못해 BadPort가 never가 됩니다.");

export {};
