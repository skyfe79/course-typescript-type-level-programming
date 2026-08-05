// 런타임 값에는 나타나지 않는 팬텀 타입 매개변수로 숫자의 단위를 구별한다.
// 실행: node episodes/s27-invariants/phantom-parameter.ts
// 검사: npx tsc --noEmit

// codeStep 385 — 팬텀 매개변수로 사실 하나 표현하기

// Eq는 두 타입이 정확히 같은지 판별해, 편집기 호버 대신 기대한 타입 관계를 컴파일러에 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 고치기 전 타입은 Unit이라는 이름을 받지만, 실제 구조 어디에도 Unit을 사용하지 않는다.
// 타입 매개변수를 지워도 결과가 똑같으므로 Unit은 죽은 무게처럼 아무 구별도 만들지 못한다.
type NaiveMeasurement<Unit> = number;

const naiveMeters: NaiveMeasurement<"meters"> = 5;

// 구조적 타이핑은 두 타입을 모두 number로 보므로 미터 값을 피트 변수에 그대로 대입한다.
const naiveFeet: NaiveMeasurement<"feet"> = naiveMeters;

// 서로 다른 타입 인수를 넣었어도 두 결과가 정확히 같다는 사실까지 컴파일러로 확인한다.
const naiveUnitsWereErased: Eq<NaiveMeasurement<"meters">, NaiveMeasurement<"feet">> = true;

// 태그 인터페이스는 단위의 이름만 타입 수준에서 보관한다.
// 팬텀 필드와 이름이 겹치지 않도록 태그 내부의 판별 필드는 __tag라고 부른다.
interface Meters {
  readonly __tag: "meters";
}

interface Feet {
  readonly __tag: "feet";
}

// __unit은 타입을 구별하기 위한 자리일 뿐, 실행 중인 숫자 객체에 실제로 추가되는 필드가 아니다.
// Unit이 이 필드에 등장하면서 Measurement<Meters>와 Measurement<Feet>의 구조가 달라진다.
type Measurement<Unit> = number & { readonly __unit?: Unit };

// 단위가 붙은 값은 생성 함수를 통하게 해, 호출부에서 숫자의 의미를 한눈에 확인한다.
// 단언은 런타임 값을 바꾸지 않는다. 두 함수 모두 받은 숫자를 그대로 돌려준다.
function meters(value: number): Measurement<Meters> {
  return value as Measurement<Meters>;
}

function feet(value: number): Measurement<Feet> {
  return value as Measurement<Feet>;
}

const m = meters(5);

// 생성 함수의 결과에는 Meters가 남지만, 숫자 연산 결과에는 단위가 전파되지 않고 number만 남는다.
const metersResultIsTagged: Eq<typeof m, Measurement<Meters>> = true;
const sum = m + m;
const arithmeticReturnsNumber: Eq<typeof sum, number> = true;

function tryToUseFeetAsMeters(): void {
  // 팬텀 필드의 Unit이 다르므로, 겉으로 같은 숫자여도 서로 다른 단위의 대입은 거부된다.
  // @ts-expect-error - Measurement<Feet>는 Measurement<Meters>에 대입할 수 없다
  const bad: Measurement<Meters> = feet(5);
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/phantom-parameter.ts(55,9): error TS2322: Type 'Measurement<Feet>' is not assignable to type 'Measurement<Meters>'.
  //   Type 'Measurement<Feet>' is not assignable to type '{ readonly __unit?: Meters | undefined; }'.
  //     Types of property '__unit' are incompatible.
  //       Type 'Feet | undefined' is not assignable to type 'Meters | undefined'.
  //         Type 'Feet' is not assignable to type 'Meters'.
  //           Types of property '__tag' are incompatible.
  //             Type '"feet"' is not assignable to type '"meters"'.
}

// 변성 어노테이션(in/out)으로 타입 매개변수의 사용 방향을 명시하는 방법도 있다.
// 이 화에서는 값의 구조에 구별 근거를 직접 남기는 옵셔널 팬텀 필드 방식을 구현한다.

// 단언 전과 후가 같은 숫자인지 실제 실행으로 확인한다. 출력에는 __unit도 __tag도 없고 5만 남는다.
console.log(m);

export {};
