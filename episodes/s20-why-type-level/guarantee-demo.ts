// 같은 보장을 런타임 체크와 타입 레벨 증명으로 각각 구현해 실패 시점을 비교한다.
// 실행: node episodes/s20-why-type-level/guarantee-demo.ts
// 검사: npx tsc --noEmit

// 런타임 버전은 어떤 배열이든 컴파일을 통과시킨 뒤, 실행 중 길이를 검사한다.
// 빈 배열이면 이 함수 안에서야 실패를 알 수 있다.
function firstRuntime<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("배열이 비어 있습니다");
  }
  return items[0];
}

console.log(firstRuntime([1, 2, 3]));
try {
  firstRuntime([]);
} catch (e) {
  console.log((e as Error).message);
}

export {};
