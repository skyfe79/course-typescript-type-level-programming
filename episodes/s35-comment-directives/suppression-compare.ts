// 같은 TS2322 오류를 @ts-ignore와 @ts-expect-error로 각각 억제했을 때의 현재 결과를 비교합니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/suppression-compare.ts
// 실행: node episodes/s35-comment-directives/suppression-compare.ts

// 지시어 뒤에는 억제가 필요한 이유와 추적할 티켓을 함께 적어, 임시 예외의 맥락과 정리 계획을
// 코드만 읽어도 알 수 있게 하는 것이 팀의 관행입니다.
// @ts-ignore TS2322: 레거시 데이터 소스가 아직 문자열을 돌려준다 — TICKET-482에서 정리 예정
const legacyTotal: number = "1200";

// @ts-expect-error TS2322: 레거시 데이터 소스가 아직 문자열을 돌려준다 — TICKET-482에서 정리 예정
const legacySubtotal: number = "800";

// 지금은 두 지시어 모두 바로 다음 줄의 같은 오류를 억제하므로 검사 결과가 똑같이 보입니다.
// 밑의 오류가 사라졌을 때 두 지시어가 어떻게 달라지는지는 다음 화에서 확인합니다.
// 타입 오류를 억제해도 런타임 값은 변환되지 않으므로 두 값은 여전히 문자열 그대로 출력됩니다.
console.log(legacyTotal, legacySubtotal);

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
