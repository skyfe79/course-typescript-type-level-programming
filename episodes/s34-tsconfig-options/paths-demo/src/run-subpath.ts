// package.json의 imports는 Node.js가 직접 읽는 런타임 매핑입니다.
// `node src/run-subpath.ts`는 이 별칭을 format.ts로 풀어 `$9.50`을 출력합니다.
import { formatPrice } from "#utils/format";

console.log(formatPrice(9.5));
