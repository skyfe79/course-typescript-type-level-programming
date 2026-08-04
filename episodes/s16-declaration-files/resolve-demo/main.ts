// 패키지 임포트 하나가 선언 파일로 연결될 때 끊길 수 있는 네 지점을 한 파일에서 재현합니다.
// 원인은 넷 다 다른데 겉으로 드러나는 오류 문구는 똑같이 TS7016입니다.
// 자바스크립트는 멀쩡히 돌고 타입만 any로 새어 나가므로 실행 결과는 여섯 줄이 모두 찍힙니다.
//
// 옆의 node_modules 폴더는 일부러 지은 이름입니다. 타입스크립트도 node도 이 파일이 있는 폴더에서
// 위로 올라가며 node_modules를 찾으므로, 여섯 개의 픽스처가 실제로 설치된 패키지처럼 해석됩니다.
//
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/resolve-demo/main.ts
//
// 아래 네 개의 실측 진단은 // @ts-expect-error 를 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때
// 측정한 값입니다. 지시문 줄을 통째로 지우면 그만큼 줄 번호가 당겨집니다.

import { format as formatFixed } from "widget-fmt";

// 실측 — exports 맵의 맨 앞에 "types": "./types/index.d.ts"가 있으면 0 오류로 통과합니다.
// 네 단계 중 1단계에서 곧바로 선언 파일이 잡히는, 유일하게 성한 구성입니다.
console.log(formatFixed("fixed"));

// 실측 ① exports 맵에 types 조건이 없고 선언 파일은 types/index.d.ts에만 있습니다.
// import 조건이 가리키는 index.js 옆에 짝 선언 파일이 없어 1단계가 빈손으로 끝납니다.
// main.ts(28,41): error TS7016: Could not find a declaration file for module 'widget-fmt-exports'.
//   '<repo>/episodes/s16-declaration-files/resolve-demo/node_modules/widget-fmt-exports/index.js'
//   implicitly has an 'any' type.
//   Try `npm i --save-dev @types/widget-fmt-exports` if it exists or add a new declaration (.d.ts)
//   file containing `declare module 'widget-fmt-exports';`
// @ts-expect-error
import { format as formatExports } from "widget-fmt-exports";

// 실측 ② typesVersions가 { "<4.0": { "*": ["ts4.0/*"] } }이고 선언 파일은 ts4.0/index.d.ts에만
// 있습니다. 이 프로젝트의 타입스크립트가 그보다 최신이라 어느 항목과도 맞지 않아 2단계가 끊깁니다.
// main.ts(38,42): error TS7016: Could not find a declaration file for module 'widget-fmt-versions'.
//   '<repo>/episodes/s16-declaration-files/resolve-demo/node_modules/widget-fmt-versions/index.js'
//   implicitly has an 'any' type.
//   Try `npm i --save-dev @types/widget-fmt-versions` if it exists or add a new declaration (.d.ts)
//   file containing `declare module 'widget-fmt-versions';`
// @ts-expect-error
import { format as formatVersions } from "widget-fmt-versions";

// 실측 ③ package.json에 "types": "index.d.ts"라고 적혀 있는데 그 파일이 실제로는 없습니다.
// 3단계가 경로를 알려 주고도 그 자리에 파일이 없어 빈손으로 끝납니다.
// main.ts(48,44): error TS7016: Could not find a declaration file for module 'widget-fmt-types-field'.
//   '<repo>/episodes/s16-declaration-files/resolve-demo/node_modules/widget-fmt-types-field/index.js'
//   implicitly has an 'any' type.
//   Try `npm i --save-dev @types/widget-fmt-types-field` if it exists or add a new declaration (.d.ts)
//   file containing `declare module 'widget-fmt-types-field';`
// @ts-expect-error
import { format as formatTypesField } from "widget-fmt-types-field";

// 실측 ④ main만 있고 선언 파일도, 짝이 되는 @types/widget-fmt-bare도 없습니다.
// 네 단계를 전부 지나도록 후보가 하나도 없는, 가장 흔한 경우입니다.
// main.ts(58,38): error TS7016: Could not find a declaration file for module 'widget-fmt-bare'.
//   '<repo>/episodes/s16-declaration-files/resolve-demo/node_modules/widget-fmt-bare/index.js'
//   implicitly has an 'any' type.
//   Try `npm i --save-dev @types/widget-fmt-bare` if it exists or add a new declaration (.d.ts)
//   file containing `declare module 'widget-fmt-bare';`
// @ts-expect-error
import { format as formatBare } from "widget-fmt-bare";

import { format as formatOrder } from "widget-fmt-order";

// 네 경우 모두 타입은 any지만 자바스크립트는 그대로 돌아갑니다.
console.log(formatExports("exports"));
console.log(formatVersions("versions"));
console.log(formatTypesField("types-field"));
console.log(formatBare("bare"));

// 실측 ⑤ 순서 규칙 — { "import": "./index.js", "types": "./types/index.d.ts" }처럼 types를 뒤에 두면,
// 먼저 맞은 import 조건이 가리킨 index.js 옆의 짝 선언 index.d.ts가 이기고 types 조건은 밀립니다.
// 짝 선언은 format(count: number), types 조건 파일은 format(text: string)이라 어느 쪽이 쓰였는지가
// 호출 한 줄로 드러납니다. 아래 줄을 formatOrder("order")로 바꾸면:
// main.ts(74,25): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
// 그래서 여기서는 이긴 짝 선언이 요구하는 대로 숫자를 넘깁니다.
console.log(formatOrder(250));

// 실측 — 다만 "뒤에 두면 언제나 무시된다"는 아닙니다. 앞 조건이 가리킨 자바스크립트 옆에 짝 선언
// 파일이 없으면(위 ①이 그렇습니다) 타입스크립트는 계속 내려가 결국 뒤쪽 types 조건을 씁니다.
// 정확히는 먼저 맞은 조건의 결과가 이기는 것이고, 그래서 types를 맨 앞에 두는 것이 안전합니다.
