/*
 * ledger는 지금까지 소스 파일을 직접 실행하는 스크립트였습니다.
 * 예를 들어 projects/ledger에서 node src/cli.ts report를 실행하면 CLI가 저널을 읽고
 * 리포트를 출력했습니다. 이제는 같은 도메인 코드를 다른 코드가 import 해서 쓸 수 있는
 * 패키지 표면도 함께 둡니다.
 *
 * 그 차이를 만드는 핵심 산출물이 선언 파일(.d.ts)입니다. 컴파일된 자바스크립트는
 * 런타임 동작만 담고, Transaction이나 Result 같은 타입 정보는 그대로 전달하지 못합니다.
 * declaration: true로 만든 .d.ts가 있어야 패키지를 가져다 쓰는 쪽이 정확한 타입을 봅니다.
 *
 * package.json의 types 필드는 그 선언 파일의 위치를 가리킵니다. 이 값이 맞아야 에디터와
 * 타입 검사기가 dist/index.d.ts를 읽고, 여기서 공개한 함수와 타입만 패키지의 계약으로
 * 이해합니다.
 *
 * main은 import 했을 때 실행할 자바스크립트 진입점이고, bin은 명령행에서 ledger라는
 * 이름으로 실행할 파일을 가리킵니다. 라이브러리 사용자는 main을 통해 이 파일의 공개
 * 표면을 가져오고, 명령행 사용자는 bin을 통해 dist/cli.js를 실행합니다.
 *
 * package.json에서 private: true를 뺀 것은 패키지로 다루는 모양을 보여 주기 위해서입니다.
 * files: ["dist"]는 배포물에 빌드 결과만 담겠다는 뜻입니다. 저장소 안에 src가 남아 있는 것과,
 * 실제 패키지에 src까지 함께 들어가는 것은 별개의 결정입니다.
 *
 * 빌드는 projects/ledger에서 npx tsc -p . 로 수행합니다. 그러면 dist 아래에 .js와 .d.ts가
 * 나란히 생기고, 명령행 결과는 node dist/cli.js report 로 확인할 수 있습니다.
 */
/*
 * 이 배럴 파일은 패키지 밖에서 의존해도 되는 도메인 표면만 모읍니다.
 * 도메인의 순수 결정 함수와 파서, 그리고 사람이 읽을 리포트 포매터는 다른 코드가
 * 가져다 써도 안정적인 계약으로 설명할 수 있습니다.
 */
export { decide, parseJournal, parseTransaction } from "./ledger.js";
export { formatReport, formatTransaction } from "./report.js";
/*
 * interpreter.ts, dry-run-interpreter.ts, replay-interpreter.ts는 일부러 내보내지 않습니다.
 * 이 파일들은 파일 시스템, 표준출력, 실행 로그처럼 앱이 바깥세상과 닿는 방식을 담습니다.
 * 그런 실행 방식까지 라이브러리 사용자가 import 하게 만들면 내부 배선이 공개 계약이 됩니다.
 *
 * cli.ts의 parseCommand, runAdd, runReport, takeFlags 같은 함수도 내보내지 않습니다.
 * CLI는 package.json의 bin으로 실행하는 명령행 표면이지, 라이브러리 사용자가 의존할
 * import 표면이 아닙니다.
 */
