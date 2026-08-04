// 배열 리터럴 반환 타입이 배열로 넓혀지는 경우와 튜플로 고정되는 경우를 대조한다.
// 실행: node episodes/s22-tuples-variadics/tuple-lab.ts
// 검사: npx tsc --noEmit

// 반환 타입을 따로 적지 않으면 [x, y]라는 배열 리터럴은 number[]로 추론된다.
// 그래서 "숫자가 들어 있는 배열"이라는 정보는 남지만, 길이가 2라는 정보는 사라진다.
function makePoint(x: number, y: number) {
  return [x, y];
}

// 반환 타입을 [number, number]로 명시하면 이 함수의 결과는 길이 2짜리 튜플로 고정된다.
// 값은 똑같이 배열이지만, 타입 검사 단계에서는 0번과 1번 원소만 있다는 사실을 기억한다.
function makePointFixed(x: number, y: number): [number, number] {
  return [x, y];
}

const p = makePoint(10, 20);
const q = makePointFixed(10, 20);

// p는 number[]라서 타입 검사 단계에서는 5번 인덱스 접근이 막히지 않는다.
// 하지만 실제 값은 두 개뿐이므로 런타임에서는 undefined가 나온다.
const pFifth = p[5];

// q는 [number, number] 튜플이라 길이가 2라는 정보가 남아 있다.
// @ts-expect-error - 길이 2인 튜플에는 5번 인덱스 원소가 없어서 바로 오류로 잡힌다.
const qFifth = q[5];

// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/tuple-lab.ts(26,18): error TS2493: Tuple type '[number, number]' of length '2' has no element at index '5'.
// 오류가 나는 곳은 이 한 줄뿐이다. 같은 자리를 p로 접근한 위쪽 줄은 아무 말도 듣지 않는다.

console.log(`makePoint 결과 p = [${p.join(", ")}]`);
console.log(`makePointFixed 결과 q = [${q.join(", ")}]`);
console.log(`p[5]는 타입 검사를 통과하지만, 실행하면 ${String(pFifth)}입니다.`);
console.log(`q[5]는 지시문으로 눌러 두지 않으면 타입 검사에서 막힙니다. 실행하면 ${String(qFifth)}입니다.`);
console.log("같은 값을 담은 배열인데, 남아 있는 길이 정보가 이 차이를 만듭니다.");

export {};
