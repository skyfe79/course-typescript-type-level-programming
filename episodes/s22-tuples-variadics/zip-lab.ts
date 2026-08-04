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

export {};
