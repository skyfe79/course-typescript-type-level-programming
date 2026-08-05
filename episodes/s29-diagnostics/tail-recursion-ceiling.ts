// 이 파일이 재는 것은 속도가 아니라 꼬리재귀가 처리할 수 있는 깊이의 한계입니다.
// 따라서 실험의 증거는 진단 숫자가 아니라 컴파일러 오류 자체입니다.
// 아래 @ts-expect-error 지시문 줄을 지우고 npx tsc --noEmit을 실행하면 그 자리에
// error TS2589: Type instantiation is excessively deep and possibly infinite. 오류가 나타납니다.
// 지시문을 그대로 두면 그 오류가 기대된 것으로 처리되어 저장소 전체 검사가 통과합니다.
// 이 실험은 인스턴스화를 약 19,600개 얹으므로 벤치 파일에 함께 두면 bench:slow와
// bench:fast를 나란히 비교할 수 없어 별도 파일로 분리합니다.

// 저장소 규약상 화별 파일은 자기 완결이어야 하므로 ReverseFast 정의를 이 파일에도 다시 적습니다.
// 결과를 반환하기 직전에 다시 조립하지 않고, 지금까지 뒤집은 결과를 Acc에 미리 쌓습니다.
// 따라서 재귀 호출 자체가 조건부 타입의 마지막 자리에 놓이는 꼬리재귀 형태가 됩니다.
type ReverseFast<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
  ? ReverseFast<Tail, [Head, ...Acc]>
  : Acc;

// 비교를 위해 지난 화의 비꼬리 재귀를 이 파일에도 그대로 둡니다.
// 재귀 호출이 끝난 뒤 Head를 붙여야 하므로 호출 결과를 기다리는 작업이 매 단계 남습니다.
type ReverseSlow<T extends readonly unknown[]> =
  T extends readonly [infer Head, ...infer Tail]
    ? [...ReverseSlow<Tail>, Head]
    : [];

// 지정한 길이가 될 때까지 같은 원소를 누적하여 고정 길이 튜플을 만듭니다.
// 길이 120은 비꼬리 Reverse의 깊이 한계는 넘지만, 꼬리재귀 Reverse는 처리할 수 있는 입력입니다.
type Repeat<N extends number, T, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : Repeat<N, T, [...Acc, T]>;
type Long = Repeat<120, 1>;

// @ts-expect-error TS2589: 비꼬리 재귀는 길이 120을 계산하다 인스턴스화 깊이 한계에 걸립니다.
type SlowTooDeep = ReverseSlow<Long>;

// 같은 입력을 꼬리재귀 누산자로 처리하면 오류 없이 끝까지 뒤집힙니다.
type FastLong = ReverseFast<Long>;

export {};

console.log("꼬리재귀의 깊이 천장 실험 파일을 실행했습니다.");
