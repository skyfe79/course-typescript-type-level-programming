// Node의 ESM 상대 경로 해석은 확장자를 보충하지도, `./prelude.js`를 `./prelude.ts`로
// 바꾸지도 않는다. emitProgram이 적는 이름을 실제 파일로 연결하려면 이 다리가 필요하다.
// allowJs가 꺼진 타입 검사에는 이 파일을 넣지 않고, 실행 로직은 검사 대상인 .ts에만 둔다.
export * from "./prelude.ts";
