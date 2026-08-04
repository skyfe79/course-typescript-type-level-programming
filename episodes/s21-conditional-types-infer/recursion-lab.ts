// 재귀 조건부 타입의 깊이 예산이 재귀의 모양에 따라 얼마나 달라지는지 보인다.
// 실행: node episodes/s21-conditional-types-infer/recursion-lab.ts
// 검사: npx tsc -p episodes/s21-conditional-types-infer/tsconfig.recursion-lab.json
//       (일부러 한 줄이 실패하는 파일이라 저장소 전체 검사에서는 빠져 있습니다)

// 999겹짜리 배열 타입을 손으로 적을 수 없으므로 타입 계산으로 입력을 만든다.
// 재귀 호출 결과를 그대로 돌려주는 꼬리 형태라 이 도구 자체는 999겹까지 만들 수 있다.
type Nest<T, N extends number, Acc extends 0[] = []> = Acc["length"] extends N
  ? T
  : Nest<Array<T>, N, [...Acc, 0]>;

// 배열 안쪽을 하나씩 벗기면서, 돌아온 결과를 다시 튜플 안에 펼쳐 넣는다.
// 바깥 튜플을 만들려면 안쪽 결과가 먼저 끝나야 하므로 꼬리 위치가 아니다.
type CountDepthWrapped<T> = T extends Array<infer U> ? [0, ...CountDepthWrapped<U>] : [];

// 배열 안쪽을 하나씩 벗기면서, 지금까지 센 깊이를 누산기에 바로 쌓는다.
// 재귀 호출 결과를 감싸지 않고 그대로 돌려주므로 꼬리 재귀 제거를 적용할 수 있다.
type CountDepthTail<T, Acc extends 0[] = []> = T extends Array<infer U>
  ? CountDepthTail<U, [0, ...Acc]>
  : Acc;

// 검사기는 한 번 계산한 타입 결과를 기억해 두고 다시 쓸 수 있다.
// 얕은 쪽을 먼저 계산하면 깊은 쪽이 거기에 얹혀 통과하므로 걸리는 쪽을 먼저 둔다.
type Deep49 = Nest<number, 49>;

// 재귀 호출 결과를 다시 펼치는 비용 때문에 이 줄에서 깊이 제한에 걸린다.
// 48과 49의 차이를 컴파일러가 실제로 어디서 멈추는지로 보여 준다.
type WrappedOverflow = CountDepthWrapped<Deep49>["length"];
// error TS2589: Type instantiation is excessively deep and possibly infinite.
// 검사기가 세는 것은 호출 횟수가 아니라 펼친 총량이라 한 걸음이 예산을 더 많이 쓴다.

// 이 입력은 감싸는 형태가 끝까지 계산할 수 있는 가장 깊은 배열이다.
// 아래 길이가 48로 계산되면 48겹을 실제로 모두 세어 냈다는 뜻이다.
type Deep48 = Nest<number, 48>;

// CountDepthWrapped가 만든 튜플의 길이를 꺼내 계산 결과를 숫자 타입으로 확인한다.
// 바로 위에서 걸린 계산이 한 겹만 얕아지면 끝까지 간다는 뜻이기도 하다.
// 줄 끝의 48은 이 타입이 도달해야 하는 정확한 깊이를 값으로도 보여 준다.
type WrappedDepth = CountDepthWrapped<Deep48>["length"];   // 48

// 이 대입이 통과한다는 것은 타입 계산 결과가 넓은 number가 아니라 48이라는 뜻이다.
// 런타임 출력은 타입 계산이 허용한 값을 눈으로 확인하기 위한 작은 표시다.
const wrappedMax: WrappedDepth = 48;
console.log("감싸는 형태가 끝까지 세어 낸 깊이:", wrappedMax);

// 같은 입력 생성 도구로 꼬리 형태가 얼마나 더 멀리 갈 수 있는지 확인한다.
// 999겹은 통과하지만, 확인해 보면 1000겹부터는 꼬리 형태도 같은 오류가 난다.
type Deep999 = Nest<number, 999>;

// CountDepthTail은 누산기에 깊이를 쌓기 때문에 끝에서 길이만 꺼내면 된다.
// 꼬리 형태에서는 같은 일을 해도 999겹까지 정확한 숫자 타입으로 남는다.
type TailDepth = CountDepthTail<Deep999>["length"];   // 999

// 이 대입이 통과하면 TailDepth가 999로 계산되었다는 뜻이다.
// 위의 감싸는 형태와 같은 방식으로 계산 결과를 값 출력에 사용한다.
const tailMax: TailDepth = 999;
console.log("꼬리 형태가 끝까지 세어 낸 깊이:", tailMax);
console.log(`같은 일을 하는데 갈 수 있는 깊이가 ${tailMax / wrappedMax}배 넘게 차이 납니다.`);

export {};
