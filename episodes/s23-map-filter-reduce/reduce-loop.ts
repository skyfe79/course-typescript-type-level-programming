// reduce 하나로 map과 똑같은 결과를 만들어, map이 reduce의 특수한 경우임을 보인다.
// 실행: node episodes/s23-map-filter-reduce/reduce-loop.ts 1 2 3
// 검사: npx tsc --noEmit

// reduce는 누산기를 하나씩 갱신하며 목록을 끝까지 접어 내는 연산이다.
// 그 누산 규칙을 "변환한 원소를 이어 붙인다"로 고르면 결과가 곧 map이 된다.
function mapViaReduce<T, R>(list: readonly T[], f: (item: T) => R): R[] {
  // 누산기를 덮어쓰지 않고 매번 새 배열로 이어 붙인다.
  // 값을 바꾸는 반복문 없이 재귀와 불변성만으로 돌아가는 것이 이 폴드의 조건이다.
  return list.reduce<R[]>((acc, item) => [...acc, f(item)], []);
}

// 인자를 주지 않으면 기본값 1, 2, 3이 쓰이므로 실행만 해도 같은 예제가 그대로 나온다.
const raw = process.argv.slice(2);
const numbers = raw.length > 0 ? raw.map(Number) : [1, 2, 3];

// 변환 규칙을 함수 하나로 떼어 두면 두 경로에 똑같은 규칙을 넘길 수 있다.
const double = (n: number) => n * 2;

// 왼쪽은 reduce로 직접 접은 결과, 오른쪽은 배열이 이미 갖고 있는 map의 결과다.
const viaReduce = mapViaReduce(numbers, double);
const viaMap = numbers.map(double);

// 두 줄이 같은 값으로 찍힌다. map은 reduce가 옷만 갈아입은 모습이다.
console.log("mapViaReduce:", viaReduce);
console.log("Array.prototype.map:", viaMap);

export {};
