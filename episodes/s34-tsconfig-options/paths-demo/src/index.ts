// TypeScript는 tsconfig.json의 paths를 읽어 이 별칭을 format.ts로 해석합니다.
// Node.js는 tsconfig.json을 읽지 않으므로 같은 문자열을 실제 실행에서는 풀지 못합니다.
import { formatPrice as formatByPaths } from "@utils/format";
// nodenext 타입 검사는 package.json의 imports를 읽고, Node.js도 같은 표를 런타임에 읽습니다.
import { formatPrice as formatBySubpath } from "#utils/format";

// `npx tsc --noEmit`은 두 호출을 모두 검사합니다. 그러나 Node.js로 이 파일을 실행하면
// 정적 import를 먼저 연결하는 중 @utils/format에서 실패하므로 아래 두 줄은 실행되지 않습니다.
console.log(formatByPaths(9.5));
console.log(formatBySubpath(9.5));
