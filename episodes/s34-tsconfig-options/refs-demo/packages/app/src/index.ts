// app은 core의 src를 직접 가져오지 않고, 먼저 빌드된 core의 공개 결과물을 가져옵니다.
// 실행 시 Node.js는 dist/index.js를 읽고, 타입 검사 시 TypeScript는 같은 위치의 index.d.ts를
// 읽습니다. src를 직접 임포트하면 프로젝트 경계를 건너 원본 소스에 결합되어 참조 빌드가
// .d.ts 변경을 기준으로 재빌드 범위를 추적하는 방식과 어긋납니다.
import { double } from "../../core/dist/index.js";

console.log(double(21));
