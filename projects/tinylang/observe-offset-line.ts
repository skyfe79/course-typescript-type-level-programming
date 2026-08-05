// 브랜드가 없는 숫자 위치와 Offset·Line 브랜드 위치의 차이를 관찰한다.

import { toLine, toOffset } from "./src/diagnostics.ts";
import type { Line, Offset } from "./src/diagnostics.ts";

// 둘 다 number라면 매개변수 이름에만 의미가 있을 뿐, 호출 순서를 바꿔도 컴파일러는
// 알아차릴 수 없다. 아래의 뒤바뀐 호출도 그대로 실행된다.
function describePlainPosition(offset: number, line: number): string {
  return `브랜드 없음 - 오프셋 ${offset}, 줄 ${line}`;
}

console.log(describePlainPosition(1, 20));
console.log("number는 순서를 뒤바꿔도 통과:", describePlainPosition(20, 1));

function describeOffset(offset: Offset): string {
  return `브랜드 오프셋: ${offset}`;
}

function describeLine(line: Line): string {
  return `브랜드 줄: ${line}`;
}

const offset = toOffset(20);
const line = toLine(1);

console.log(describeOffset(offset));
console.log(describeLine(line));

// TS2345: Line은 Offset 매개변수에 할당할 수 없다.
// @ts-expect-error - 서로 다른 위치 단위를 일부러 전달해 타입 오류를 고정한다.
describeOffset(line);

// TS2345: Offset은 Line 매개변수에 할당할 수 없다.
// @ts-expect-error - 서로 다른 위치 단위를 일부러 전달해 타입 오류를 고정한다.
describeLine(offset);

// TS2345: 맨 number는 Offset 브랜드가 없으므로 Offset 매개변수에 할당할 수 없다.
// @ts-expect-error - 스마트 생성자를 거치지 않은 숫자는 위치 단위로 사용할 수 없다.
describeOffset(5);
