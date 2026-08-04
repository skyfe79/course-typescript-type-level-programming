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

// 감싸는 형태와 나란히 놓기 위해 같은 Duplicate 규칙에서 누산기만 제거한다.
// 재귀 호출 결과를 튜플 안에 펼쳐 넣으므로, 안쪽 계산이 끝나기 전에는 바깥 결과를 만들 수 없다.
type NaiveDuplicate<T extends readonly unknown[]> =
  T extends readonly [infer Head, ...infer Tail]
    ? [Head, Head, ...NaiveDuplicate<Tail extends readonly unknown[] ? Tail : never>]
    : [];

// 큰 입력 튜플은 손으로 적지 않고 타입 계산으로 만든다.
// 이 헬퍼 자체는 Acc를 그대로 돌려주는 꼬리 형태라 깊이 비교의 병목이 되지 않는다.
type Repeat<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : Repeat<N, [...Acc, unknown]>;

// 누산기 버전은 120개 입력에서도 길이 240짜리 결과를 정확히 계산한다.
type AccAt120 = Duplicate<Repeat<120>>;

// 숫자 리터럴 대입이 통과하면 결과 길이가 넓은 number가 아니라 정확히 240이라는 뜻이다.
const accLength: AccAt120["length"] = 240;

// 검사기는 한 번 계산한 타입 결과를 기억해 두고 다시 쓴다. 얕은 쪽을 먼저 계산하면 깊은 쪽이
// 거기에 얹혀 통과해 버리므로, 아래 세 줄은 반드시 걸리는 쪽부터 순서대로 두어야 한다.
// @ts-expect-error - 감싸는 형태라 같은 크기에서 인스턴스화 깊이 한계에 걸린다 (TS2589)
type NaiveAt120 = NaiveDuplicate<Repeat<120>>;

// 49개는 감싸는 형태가 처음으로 막히는 크기다. 오류를 보여 주려고 둔 별칭이라 값을 만들지 않는다.
// @ts-expect-error - 바로 아래 48개에서 원소를 하나만 더 늘려도 같은 한계에 걸린다 (TS2589)
type NaiveAt49 = NaiveDuplicate<Repeat<49>>;

// 48개는 감싸는 형태가 마지막으로 끝까지 계산할 수 있는 입력 크기다.
// recursion-lab.ts가 감싸는 형태의 상한을 48로 실측한 것과 정확히 같은 경계다.
type NaiveAt48 = NaiveDuplicate<Repeat<48>>;

// 이 대입이 통과하면 NaiveDuplicate<Repeat<48>>의 길이가 정확히 96으로 계산되었다는 뜻이다.
const naiveLength: NaiveAt48["length"] = 96;

console.log(`누산기 버전은 120개에서 ${accLength}개를 만들고, 감싸는 형태는 48개가 한계입니다.`);
console.log(`감싸는 형태가 통과한 마지막 결과 길이: ${naiveLength}`);

export {};
