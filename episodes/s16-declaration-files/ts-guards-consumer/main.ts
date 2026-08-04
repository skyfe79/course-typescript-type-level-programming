// 이 폴더는 우리가 만든 ts-guards 패키지를 남의 프로젝트처럼 설치해 쓰는 작은 컨슈머입니다.
// 라이브러리 폴더의 src를 직접 가져오지 않고, 설치된 패키지의 공개 표면만 사용합니다.
//
// 설치:  cd episodes/s16-declaration-files/ts-guards-consumer && npm install
// 실행:  node main.ts hello        → { ok: true, value: 'hello' }
// 검사:  npx tsc -p episodes/s16-declaration-files/ts-guards-consumer   (저장소 루트에서)
//        npx tsc --noEmit                                              (저장소 전체 게이트)
//
// npm install을 하면 node_modules/ts-guards가 ../../ts-guards를 가리키는 심볼릭 링크가 됩니다.
// 그 링크 안의 package.json exports 맵이 타입 검사에는 types 조건인 ./dist/index.d.ts를 내주고,
// 실행에는 import 조건인 ./dist/index.js를 내줍니다. 상대 경로로 ../ts-guards/src/guards.ts를
// 직접 가리키지 않았다는 점이 핵심입니다. 우리가 배포한 표면만 쓰고 있습니다.
//
// 이 컨슈머는 배포 대상이 아니므로 package.json에 private: true를 둡니다.
// 또한 dist가 없으면 이 임포트는 TS2307로 깨지고, 실행도 dist/index.js를 찾지 못해 실패합니다.
// 그래서 이 화에서는 예외적으로 ts-guards/dist를 커밋합니다.
//
// ts-guards는 저장소 루트 package.json에도 같은 file: 의존성으로 등록해 두었습니다.
// 이 파일도 저장소 전체 타입 게이트 npx tsc --noEmit이 훑는 대상이라, 루트에서 한 번
// npm install을 한 것만으로도 이 임포트가 해석되어야 하기 때문입니다. 앞서 다룬
// ascii-banner를 등록한 것과 같은 이유입니다. 위의 폴더 안 npm install은 그것과 별개로,
// 남의 프로젝트가 이 패키지를 설치하는 과정을 그대로 재현해 보는 실습입니다.
import { assertDefined, checkGuard } from "ts-guards";

const input: string | undefined = process.argv[2];
// assertDefined는 asserts value is NonNullable<T> 술어를 선언 파일로 내보냅니다.
// 이 줄 아래에서 input은 string으로 좁혀지므로 checkGuard(input)에 경고가 나지 않습니다.
// 이 좁힘은 우리가 배포한 .d.ts가 그대로 전해 준 정보입니다.
assertDefined(input, "입력 값이 필요합니다");
console.log(checkGuard(input));

// 실험 — 바로 아래 줄 맨 앞의 "// " 세 글자를 지우면 필수 인자를 뺀 호출이 됩니다.
// 배포한 선언 파일이 실제로 타입 검사에 쓰이고 있다면, 컴파일러가 그 자리에서 막아야 합니다.
// assertDefined();
//
// 실측 — 저장소 루트에서 검사했을 때:
//   episodes/s16-declaration-files/ts-guards-consumer/main.ts(34,1): error TS2554:
//     Expected 1-2 arguments, but got 0.
// 저장소 전체 게이트 npx tsc --noEmit에서도, 위 -p 검사에서도 똑같이 납니다. 열 번호 1은
// 주석을 풀었을 때 호출이 줄 맨 앞에 오기 때문입니다. 들여쓰기를 남긴 채 // 만 지우면
// 그만큼 열 번호가 뒤로 밀립니다.
// 커밋된 상태에서는 주석으로 둡니다 — 살려 두면 태그 시점의 타입 게이트가 깨집니다.
