// 팬텀 타입으로 미터와 피트를 구별해, 단위가 다른 덧셈은 막고 의도한 변환만 허용한다.
// 실행: node episodes/s27-invariants/meters-and-feet.ts
// 검사: npx tsc --noEmit

// codeStep 387 — 재료 정의

// 표식 없는 number끼리의 계산은 단위가 달라도 멈추지 않는다.
const naiveMeters = 100;
const naiveFeet = 100;
const naiveSum = naiveMeters + naiveFeet;

// 200은 출력되지만 미터도 피트도 아닌, 서로 다른 단위가 섞인 틀린 숫자다.
console.log(naiveSum);

// Eq는 두 타입이 정확히 같은지 판별해, 편집기 호버 대신 기대한 타입 관계를 컴파일러에 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 태그 인터페이스는 단위의 이름만 타입 수준에서 보관한다.
interface Meters {
  readonly __tag: "meters";
}

interface Feet {
  readonly __tag: "feet";
}

// __unit은 단위를 구별하기 위한 팬텀 필드이며 실행 중인 숫자에는 나타나지 않는다.
type Measurement<Unit> = number & { readonly __unit?: Unit };

// 생성 함수는 런타임 숫자를 바꾸지 않고 타입 수준의 단위만 붙인다.
function meters(value: number): Measurement<Meters> {
  return value as Measurement<Meters>;
}

function feet(value: number): Measurement<Feet> {
  return value as Measurement<Feet>;
}

// 표식을 붙여도 맨 +는 두 값을 그냥 더해 단위가 없는 number를 돌려준다.
// 그래서 단위를 지키려면 덧셈 자체를 함수로 감싸야 하고, 그 함수가 아래의 add다.
const bareSum = meters(100) + feet(100);
const bareSumLosesUnits: Eq<typeof bareSum, number> = true;

// add는 두 입력의 단위를 하나로 묶고 그 단위를 결과에도 보존한다.
function add<Unit>(a: Measurement<Unit>, b: Measurement<Unit>): Measurement<Unit> {
  return (a + b) as Measurement<Unit>;
}

// 두 생성 함수는 실행 결과로 똑같이 숫자를 돌려주지만, 반환 타입에 붙은 팬텀 표식이 서로 다르다.
const metersAndFeetAreDistinct: Eq<Measurement<Meters>, Measurement<Feet>> = false;

const preservedMeters = add(meters(3), meters(4));

// 맨 +의 결과가 number로 떨어지는 것과 달리 add의 결과에는 Measurement<Meters>가 그대로 남는다.
const addPreservesMeters: Eq<typeof preservedMeters, Measurement<Meters>> = true;

export {};
