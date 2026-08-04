// 여러 배열을 zip할 때 각 열의 원소 타입을 잃지 않는 방법을 단계적으로 확인한다.
// 실행: node episodes/s22-tuples-variadics/zip-lab.ts
// 검사: npx tsc --noEmit

// 배열마다 타입 매개변수를 따로 둔다. 제네릭을 하나만 쓰면 그 하나가 모든 배열의 원소
// 타입을 동시에 만족시켜야 해서, 타입이 다른 배열을 넣는 순간 아예 컴파일되지 않는다.
function zipPair<A, B>(a: readonly A[], b: readonly B[]): Array<[A, B]> {
  const length = Math.min(a.length, b.length);
  const rows: Array<[A, B]> = [];

  for (let index = 0; index < length; index += 1) {
    rows.push([a[index], b[index]]);
  }

  return rows;
}

const pairs = zipPair([1, 2, 3], ["a", "b", "c"]);

// 0번 열은 number, 1번 열은 string으로 남아 있어 각자 자기 타입의 메서드를 받는다.
// 두 열이 하나로 합쳐졌다면 이 두 줄 중 어느 쪽도 통과하지 못한다.
const firstPairNumber = pairs[0][0].toFixed(2);
const firstPairString = pairs[0][1].toUpperCase();

// 반대로 0번 열을 string으로 받으려 하면 막힌다. 지시문으로 눌러 두었을 뿐이라
// 실행하면 원래 값인 숫자가 그대로 들어온다.
// @ts-expect-error - 0번 열은 number라서 string 변수에 담을 수 없다.
const firstPairAsString: string = pairs[0][0];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/zip-lab.ts(28,7): error TS2322: Type 'number' is not assignable to type 'string'.

console.log(`zipPair 첫 행의 0번 열은 숫자 메서드 결과 ${firstPairNumber}입니다.`);
console.log(`zipPair 첫 행의 1번 열은 문자열 메서드 결과 ${firstPairString}입니다.`);
console.log(`string으로 받아 둔 0번 열의 실제 값은 ${String(firstPairAsString)}입니다.`);

// 배열 목록 전체를 튜플 타입 매개변수 하나로 받고, 그 튜플을 자리별로 매핑해
// 열 개수만큼의 원소 타입을 만든다. 그래서 배열을 몇 개 넣든 열이 그만큼 늘어난다.
type ZippedRow<T extends readonly unknown[][]> = {
  [K in keyof T]: T[K] extends readonly (infer U)[] ? U : never;
};

function zip<T extends readonly unknown[][]>(...arrays: T): Array<ZippedRow<T>> {
  const length = arrays.length === 0 ? 0 : Math.min(...arrays.map((array) => array.length));
  const rows: Array<ZippedRow<T>> = [];

  for (let index = 0; index < length; index += 1) {
    // 런타임의 map은 결과 길이와 자리 정보를 튜플로 증명하지 못하므로 여기에서만 단언한다.
    const row = arrays.map((array) => array[index]) as ZippedRow<T>;
    rows.push(row);
  }

  return rows;
}

const triples = zip([1, 2, 3], ["a", "b", "c"], [true, false, true]);
const firstTripleNumber = triples[0][0].toFixed(1);
const firstTripleString = triples[0][1].toUpperCase();
const firstTripleBoolean = triples[0][2].valueOf();

// 네 번째 배열의 원소는 Date다. 원시 타입이 아니어도 그 자리의 타입이 그대로 남는다.
const quads = zip(
  [10, 20],
  ["left", "right"],
  [false, true],
  [new Date("2026-01-01T00:00:00.000Z"), new Date("2026-06-01T00:00:00.000Z")],
);
const firstQuadDateYear = quads[0][3].getUTCFullYear();

console.log(
  `zip 세 열은 숫자 ${firstTripleNumber}, 문자열 ${firstTripleString}, 불리언 ${firstTripleBoolean}로 다룰 수 있습니다.`,
);
console.log(`네 번째 열은 Date로 남아 getUTCFullYear를 부를 수 있고, 결과는 ${firstQuadDateYear}입니다.`);

// 같은 행 안에서도 자리마다 다른 타입이 남아 있어 잘못된 대입이 막힌다.
// 이 두 줄이 오류로 잡힌다는 사실 자체가 열 타입이 끝까지 살아남았다는 증거다.
const row = triples[0];

// @ts-expect-error - 0번 자리는 number라서 문자열을 넣을 수 없다.
row[0] = "not a number";
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/zip-lab.ts(79,1): error TS2322: Type 'string' is not assignable to type 'number'.

// @ts-expect-error - 2번 자리는 boolean이라서 숫자를 넣을 수 없다.
row[2] = 123;
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/zip-lab.ts(84,1): error TS2322: Type 'number' is not assignable to type 'boolean'.

// 막고 있는 것은 타입 검사뿐이라, 지시문으로 누른 두 줄은 실행되어 값을 바꿔 놓는다.
console.log(`지시문으로 누른 두 줄이 실행된 뒤 행의 값은 ${JSON.stringify(row)}입니다.`);
console.log("오늘의 결과는 배열 개수가 늘어나도 각 열의 타입을 끝까지 지키는 zip입니다.");

export {};
