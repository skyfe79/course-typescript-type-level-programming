// grep -rn 'from "ascii-banner"' episodes 로 호출 지점을 찾으면,
// 이 프로젝트가 ascii-banner에서 실제로 부르는 함수는 banner와 divider 두 개뿐입니다.
// 패키지 자체는 그 둘 말고 box·gradient도 내보냅니다.
//
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/usage-check.ts

import { banner, divider } from "ascii-banner";

const title = banner("배포 완료", { width: 40 });
const line = divider("-", 40);

console.log(title);
console.log(line);

// 실측 — ascii-banner.d.ts를 추가한 뒤 이 파일은 0 오류로 통과합니다.
// 앞 단계에서 import 줄에 붙여 두었던 @ts-expect-error는 함께 지웠습니다.
// 그대로 두면 이번엔 그 지시문이 남아 게이트가 깨집니다:
// episodes/s16-declaration-files/usage-check.ts(8,1): error TS2578: Unused '@ts-expect-error' directive.
//
// 실측 — 이제 인자 타입이 실제로 검사됩니다.
// title 줄을 banner(123, { width: 40 })으로 바꾸면:
// episodes/s16-declaration-files/usage-check.ts(10,22): error TS2345: Argument of type 'number' is
//   not assignable to parameter of type 'string'.
//
// 실측 — ascii-banner.d.ts를 다시 치우면 앞 단계의 TS7016으로 돌아갑니다.
// 20줄 남짓한 파일 하나가 그 검사를 통째로 되살린 셈입니다.
