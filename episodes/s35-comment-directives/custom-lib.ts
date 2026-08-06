/// <reference no-default-lib="true"/>
// 위 참조는 기본 lib을 이 프로그램에서 빼겠다고 컴파일러에 주장하지만, 현재는 존중되지 않습니다.
// 참조가 붙은 상태의 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/custom-lib.ts
// 기본 lib을 실제로 뺀 검사: npx tsc --noEmit --ignoreConfig --strict --noLib episodes/s35-comment-directives/custom-lib.ts
// 파일명을 명령줄에 적으면 상위 tsconfig.json 때문에 TS5112가 발생하므로 --ignoreConfig를 붙입니다.

// 아래 세 줄은 기본 lib에 선언된 Array.prototype.sort와 Math.max, 배열 스프레드에 기대고 있습니다.
// 위 참조가 정말 존중됐다면 이 내장 타입과 기능을 찾을 수 없어 이 줄들은 컴파일되지 않아야 합니다.
const nums: number[] = [3, 1, 2];
const sorted = nums.sort((a, b) => a - b);
const largest = Math.max(...sorted);
console.log(largest);

// 기본 lib을 실제로 빼려면 참조 대신 --noLib 컴파일러 플래그를 사용합니다.
// --noLib 대조 검사에서는 Array, Boolean, CallableFunction, Function, IArguments,
// NewableFunction, Number, Object, RegExp, String을 찾지 못하는 TS2318 오류가 정확히 10줄 발생합니다.

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
