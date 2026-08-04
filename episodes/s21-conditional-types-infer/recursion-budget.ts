// DeepReadonly와 Flatten이 같은 깊이 입력에서 서로 다른 재귀 예산을 쓰는 이유를 비교한다.
// 실행: node episodes/s21-conditional-types-infer/recursion-budget.ts
// 검사: npx tsc --noEmit

import type { DeepReadonly } from "./deep-readonly.ts";
import type { Flatten } from "./flatten.ts";

// 깊은 배열 타입을 만들기 위한 생성기다.
// 재귀 호출이 마지막 결과이므로 생성기 자체도 꼬리 형태지만, 이 도구 역시 1000겹 천장이 있다.
type NestArr<T, N extends number, Acc extends 0[] = []> = Acc["length"] extends N
  ? T
  : NestArr<Array<T>, N, [...Acc, 0]>;

// 깊은 객체 타입을 만들기 위한 생성기다.
// { a: T }를 한 단계씩 추가하고, 목표 길이에 도달하면 지금까지 만든 타입을 반환한다.
type NestObj<T, N extends number, Acc extends 0[] = []> = Acc["length"] extends N
  ? T
  : NestObj<{ a: T }, N, [...Acc, 0]>;

// 생성기 한 번으로 1200겹을 만들 수 없어서 600겹 결과를 다시 600겹 감싼다.
// 아래 두 입력은 모두 1200겹이다.
type Arr1200 = NestArr<NestArr<number, 600>, 600>;
type Obj1200 = NestObj<NestObj<number, 600>, 600>;

// 걸리는 쪽을 먼저 둔다.
// Flatten은 쓰는 순간 배열을 끝까지 벗겨야 하므로 하나의 긴 계산이 된다.
// 1200겹은 꼬리 자리 조건부 타입의 천장인 1000을 넘어서 이 별칭 선언 줄에서 TS2589가 난다.
// @ts-expect-error
type Flat1200 = Flatten<Arr1200>;

// 쓰이지 않는 별칭은 아예 계산되지 않는다. 그러면 위 @ts-expect-error가 흡수할 오류도 없어져
// 이번에는 "쓰이지 않은 지시문"(TS2578) 오류가 난다. 그래서 값 자리에서 한 번 받아 계산을 시킨다.
// 계산이 막힌 타입이라 값 자체에는 의미가 없고, 출력에도 쓰지 않는다.
declare const overflowFlat: Flat1200;

// 정확한 통과 지점도 같은 파일에서 확인한다.
// 1000겹은 두 번에 나누어 만들면 생성기 천장을 넘지 않고, Flatten도 끝까지 계산한다.
type Arr1000 = NestArr<NestArr<number, 500>, 500>;
type Flat1000 = Flatten<Arr1000>;
const boundaryFlat: Flat1000 = [10, 20, 30];

// 같은 1200겹이라도 DeepReadonly는 매핑된 타입의 프로퍼티 값 자리에서 다음 계산을 미룬다.
// 그래서 긴 계산 하나가 아니라, 속성을 실제로 볼 때 이어지는 짧은 계산 여러 개가 된다.
type ReadonlyObj1200 = DeepReadonly<Obj1200>;

// 1200겹짜리 값은 손으로 만들 수 없으므로 이 함수는 호출하지 않는다.
// 검사기는 호출 여부와 상관없이 본문의 타입을 확인하므로, 이 함수가 통과한다는 사실만으로
// DeepReadonly가 1200겹 입력에서도 막히지 않는다는 것이 확인된다.
function readAFewLevels(value: ReadonlyObj1200): void {
  // 프로퍼티 접근을 몇 겹 이어 가도 필요한 단계만 계산한다.
  const threeLevelsIn = value.a.a.a;
  console.log(typeof threeLevelsIn);
}

console.log("같은 1200겹을 넣었을 때 두 타입의 결과는 이렇게 갈립니다.");
console.log("  Flatten: 한 번에 끝까지 계산하려다 1000겹 천장을 넘어 막힙니다.");
console.log("  DeepReadonly: 프로퍼티 계산을 미루므로 막히지 않습니다.");
console.log(`Flatten이 끝까지 계산해 낸 가장 깊은 입력은 1000겹입니다: ${boundaryFlat.join(", ")}`);
