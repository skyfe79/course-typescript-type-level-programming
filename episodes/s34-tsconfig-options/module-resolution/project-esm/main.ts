// Node.js에서 컴파일 결과를 곧바로 실행할 수 있도록 출력 파일의 확장자인 `.js`를 적습니다.
// TypeScript는 타입 검사 중 이 경로를 같은 폴더의 math.ts로 해석합니다.
import { add } from "./math.js";

console.log(add(2, 3));
