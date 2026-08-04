// 튜플 누산기로 타입 레벨 반복문을 꼬리 위치에 놓는 관용구를 보인다.
// 실행: node episodes/s22-tuples-variadics/tuple-loop.ts red green
// 검사: npx tsc --noEmit

// 매 단계에서 입력 튜플을 머리와 꼬리로 나누고, 이미 만든 결과는 Acc에만 쌓는다.
// 참인 분기의 Duplicate<...>가 결과값 자리에 그대로 오므로 재귀 호출은 꼬리 위치에 있다.
type Duplicate<T extends readonly unknown[], Acc extends readonly unknown[] = []> =
  T extends readonly [infer Head, ...infer Tail]
    ? Duplicate<Tail extends readonly unknown[] ? Tail : never, [...Acc, Head, Head]>
    : Acc;

// 런타임 구현도 누산기를 왼쪽에서 오른쪽으로 키우면 타입 계산과 같은 순서를 갖는다.
// reduce의 결과 배열은 실행 계약이고, 구체적인 튜플 모양은 Duplicate<T>가 바깥에서 계산한다.
function duplicate<T extends readonly unknown[]>(list: T): Duplicate<T> {
  return list.reduce<unknown[]>((acc, item) => [...acc, item, item], []) as Duplicate<T>;
}

// 리터럴 튜플을 입력으로 고정해야 머리와 꼬리가 타입 레벨에서도 실제 원소처럼 보인다.
const palette = ["red", "green"] as const;

// 대입이 통과한다는 사실이 Duplicate가 만든 정확한 리터럴 튜플에 대한 증명이다.
const duplicatedPalette: ["red", "red", "green", "green"] = duplicate(palette);

// process.argv.slice(2)의 타입은 string[]이라 길이를 모르는 배열이다.
// 길이를 모르는 배열은 [infer Head, ...infer Tail]에 맞지 않아 조건이 거짓이고,
// Duplicate<string[]>는 초기 누산기 그대로 []가 된다. 값은 복제되지만 타입은 빈 튜플이다.
const args = process.argv.slice(2);

// 이 대입이 통과하는 것은 머리와 꼬리로 쪼갤 수 있는 대상이 길이가 정해진 튜플뿐이라는 증거다.
const argsProof: [] = duplicate(args);

console.log(duplicate(args));

export {};
