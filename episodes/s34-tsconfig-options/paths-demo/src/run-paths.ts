// paths는 TypeScript의 타입 검사에는 쓰이지만 Node.js의 모듈 해석 규칙은 아닙니다.
// 따라서 타입 검사는 통과해도 `node src/run-paths.ts`는 ERR_MODULE_NOT_FOUND로 실패합니다.
import { formatPrice } from "@utils/format";

console.log(formatPrice(9.5));
