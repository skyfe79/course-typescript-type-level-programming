// 튜플 누산기에 무엇을 쌓느냐에 따라 같은 반복 모양이 Reverse와 Length로 갈라지는 것을 보인다.
// 실행: node episodes/s22-tuples-variadics/tuple-ops.ts red green blue
// 검사: npx tsc --noEmit

// 머리 원소를 누산기 앞에 붙이면, 입력을 다 소비했을 때 순서가 뒤집혀 있다.
// 지난 화의 Duplicate와 뼈대는 같다. 다른 것은 쌓는 위치뿐이다.
type Reverse<T extends readonly unknown[], Acc extends readonly unknown[] = []> =
  T extends readonly [infer Head, ...infer Tail]
    ? Reverse<Tail extends readonly unknown[] ? Tail : never, [Head, ...Acc]>
    : Acc;

// as const로 고정한 리터럴 튜플이어야 타입 레벨에서도 각 원소와 길이가 보인다.
const colors = ["red", "green", "blue", "yellow"] as const;

type ColorsReversed = Reverse<typeof colors>;

// 결과는 읽기 전용 튜플이 아니라 쓰기 가능한 튜플이다. 누산기를 [Head, ...Acc]로 매번 새로
// 만들기 때문에 입력에 붙어 있던 readonly가 결과까지 따라오지 않는다.
// 아래 대입이 통과한다는 사실이 Reverse가 정확히 이 튜플을 계산했다는 증거다.
const reversedColors: ColorsReversed = ["yellow", "blue", "green", "red"];

console.log("뒤집힌 색상:", reversedColors);

// 원소 값 대신 자리표시자 0 하나를 누산기에 쌓으면, 다 소비했을 때 누산기의 길이가 곧 개수다.
// Reverse가 머리를 누산기 앞에 놓았다면, 여기서는 머리의 값을 버리고 0만 누산기 뒤에 붙인다.
// 재귀가 끝나는 자리에서 누산기 자체가 아니라 그 length를 읽는 것이 이 타입의 마지막 한 걸음이다.
type Length<T extends readonly unknown[], Acc extends readonly 0[] = []> =
  T extends readonly [infer _Head, ...infer Tail]
    ? Length<Tail extends readonly unknown[] ? Tail : never, [...Acc, 0]>
    : Acc["length"];

type ColorsLength = Length<typeof colors>;

// 결과는 넓은 number가 아니라 리터럴 타입 4다.
// 이 대입이 통과한다는 사실이 Length가 색상 튜플의 길이를 정확히 세었다는 증거다.
const colorsLength: ColorsLength = 4;

// 이 저장소가 이미 쓰고 있는 Repeat나 NestArr도 Acc["length"]를 본다. 다만 방향이 반대다.
// 그쪽은 목표 개수 N을 받아 그만큼 만들 때까지 쌓고, 여기는 주어진 튜플이 빌 때까지 쌓은 뒤
// 그 길이를 답으로 읽는다. 같은 도구를 반대로 쥐면 만드는 일이 세는 일이 된다.
console.log("색상 개수:", colorsLength);

// 두 타입에 같은 모양의 런타임 함수를 붙인다. 결과의 구체적인 모양은 Reverse<T>와 Length<T>가
// 바깥에서 계산하고, 본문은 실제 배열 연산의 결과를 그 계약으로 단언한다.
function reverseTuple<T extends readonly unknown[]>(list: T): Reverse<T> {
  return [...list].reverse() as Reverse<T>;
}

function countTuple<T extends readonly unknown[]>(list: T): Length<T> {
  return list.length as Length<T>;
}

// 리터럴 튜플을 넣으면 앞에서 타입으로만 확인한 두 결과가 함수의 반환 타입에도 그대로 나온다.
// 아래 두 대입이 통과하는 것이 그 증거다.
const reversedByFunction: ["yellow", "blue", "green", "red"] = reverseTuple(colors);
const lengthByFunction: 4 = countTuple(colors);

// process.argv.slice(2)의 타입은 string[]이다. 값은 여러 개 들어 있어도 타입에는 길이가 없다.
// 길이를 모르는 배열은 [infer Head, ...infer Tail]에 맞지 않아 조건이 첫 걸음에서 거짓이 되고,
// 두 타입 모두 초기 누산기 그대로 끝난다. Reverse<string[]>는 [], Length<string[]>는 0이다.
const args = process.argv.slice(2);
const cliReversed = reverseTuple(args);
const cliLength = countTuple(args);

// 이 두 대입이 통과한다는 사실이 곧 그 증거다. 화면에 찍히는 값은 제대로 뒤집히고 제대로 세지만,
// 타입이 아는 것은 빈 튜플과 0뿐이다. 머리와 꼬리로 쪼갤 수 있는 것은 길이가 정해진 튜플뿐이라,
// 타입 레벨 결과를 보이려면 위처럼 as const로 고정한 리터럴 튜플을 따로 세워야 한다.
const argsReversedProof: [] = cliReversed;
const argsLengthProof: 0 = cliLength;

console.log("Reversed:", cliReversed);
console.log("Length:", cliLength);

export {};
