// 이 파일은 Node.js 런타임이 제공하는 `process` 전역을 사용합니다.
// import 없이 쓸 수 있지만, TypeScript가 이 이름을 저절로 아는 것은 아닙니다.
//
// `process`의 타입은 Promise나 Array 메서드, DOM처럼 `lib`에서 오는 내장 전역이 아닙니다.
// `@types/node` 패키지의 전역 선언을 `types: ["node"]`로 주입해야 타입 검사에서 찾을 수 있습니다.
const arg = process.argv[2];

console.log(`받은 인자: ${arg}`);

// 루트 타입 검사에서 이 파일을 독립 모듈로 취급하게 해 전역 이름 충돌을 막습니다.
export {};
