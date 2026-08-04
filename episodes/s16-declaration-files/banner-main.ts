// ascii-banner로 배포 결과를 꾸며 출력하는 최종 파일입니다.
// 앞 단계의 usage-check.ts를 그대로 이어받아 이름만 정리했습니다.
//
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/banner-main.ts

import { banner, divider } from "ascii-banner";

console.log(banner("배포 완료", { width: 40 }));
console.log(divider("-", 40));

// 실측 — 에디터에서 banner( 까지만 입력해도 선언 파일의 시그니처가 그대로 힌트로 뜹니다:
// banner(text: string, options?: { width?: number }): string
// options를 열면 width 자동완성이 나옵니다. 20줄 남짓한 선언 파일이 타입 검사뿐 아니라
// 자동완성까지 되살렸습니다.
//
// 실측 — 없는 옵션을 넘기면 초과 속성 검사가 오타를 그 자리에서 잡습니다.
// 9번째 줄을 banner("배포 완료", { padding: 2 })로 바꾸면:
// episodes/s16-declaration-files/banner-main.ts(9,31): error TS2353: Object literal may only specify
//   known properties, and 'padding' does not exist in type '{ width?: number | undefined; }'.
//
// 실측 — 선언 파일에 옮기지 않은 이름은 이 프로젝트에서 아예 보이지 않습니다.
// import에 box를 더하면:
// episodes/s16-declaration-files/banner-main.ts(7,27): error TS2305: Module '"ascii-banner"' has no
//   exported member 'box'.
// 패키지의 자바스크립트에는 box가 분명히 있지만 선언하지 않았으므로 타입 층에는 없습니다.
// 쓰는 만큼만 선언한다는 말은 곧 쓰기로 한 범위를 선언 파일이 정한다는 뜻입니다.
