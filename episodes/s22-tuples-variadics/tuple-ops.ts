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

export {};
