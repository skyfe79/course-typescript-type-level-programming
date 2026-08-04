// grep -rn 'from "ascii-banner"' episodes 로 호출 지점을 찾으면,
// 이 프로젝트가 ascii-banner에서 실제로 부르는 함수는 banner와 divider 두 개뿐입니다.
// 패키지 자체는 그 둘 말고 box·gradient도 내보냅니다.
//
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/usage-check.ts

// @ts-expect-error 아직 이 패키지의 선언 파일이 없어 import 자체가 걸립니다. 실측 진단:
// episodes/s16-declaration-files/usage-check.ts(14,33): error TS7016: Could not find a declaration
//   file for module 'ascii-banner'.
//   '<repo>/episodes/s16-declaration-files/vendor/ascii-banner/index.js' implicitly has an 'any' type.
//   Try `npm i --save-dev @types/ascii-banner` if it exists or add a new declaration (.d.ts) file
//   containing `declare module 'ascii-banner';`
import { banner, divider } from "ascii-banner";

const title = banner("배포 완료", { width: 40 });
const line = divider("-", 40);

console.log(title);
console.log(line);

// 실측 — 위 지시문으로 그 경고를 끄고 나면 banner와 divider는 any가 됩니다.
// title 줄을 banner(123, { width: 40 })으로 바꿔도 tsc는 0 오류로 통과합니다.
// 이 상태에서는 잘못된 인자를 넘겨도 컴파일러가 아무것도 잡아 주지 못합니다.
//
// 실행은 지금도 됩니다 — 벤더 사본의 자바스크립트가 그대로 돌아가기 때문입니다.
// 없는 것은 구현이 아니라 타입입니다.
