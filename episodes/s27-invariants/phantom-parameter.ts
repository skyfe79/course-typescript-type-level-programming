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

// codeStep 386 — 1부 브랜드 타입과 비교하기

// 브랜드 방식은 단위마다 교차 타입을 하나씩 새로 선언하고, 필수 __brand로 서로를 구별한다.
type MetersBrand = number & { readonly __brand: "meters" };
type FeetBrand = number & { readonly __brand: "feet" };

// 예를 들어 세 번째 단위를 추가하면 브랜드 쪽에는 완성된 교차 타입을 하나 더 만들어야 한다.
type KilometersBrand = number & { readonly __brand: "kilometers" };

// 팬텀 매개변수 쪽은 새 태그만 정의하고 이미 만든 Measurement<Unit>에 끼워 넣어 재사용한다.
interface Kilometers {
  readonly __tag: "kilometers";
}

type KilometersMeasurement = Measurement<Kilometers>;

// 선언 형태는 다르지만, 두 방식 모두 실제 값에는 없는 표식을 타입 구조에 심어 잘못된 대입을 막는다.
function compareRejectedAssignments(): void {
  // @ts-expect-error - 팬텀 매개변수 방식은 Feet를 Meters로 사용할 수 없다
  const phantomMistake: Measurement<Meters> = feet(1);
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/phantom-parameter.ts(91,9): error TS2322: Type 'Measurement<Feet>' is not assignable to type 'Measurement<Meters>'.
  //   Type 'Measurement<Feet>' is not assignable to type '{ readonly __unit?: Meters | undefined; }'.
  //     Types of property '__unit' are incompatible.
  //       Type 'Feet | undefined' is not assignable to type 'Meters | undefined'.
  //         Type 'Feet' is not assignable to type 'Meters'.
  //           Types of property '__tag' are incompatible.
  //             Type '"feet"' is not assignable to type '"meters"'.

  const brandedFeet = 1 as FeetBrand;
  // @ts-expect-error - 브랜드 방식도 FeetBrand를 MetersBrand로 사용할 수 없다
  const brandMistake: MetersBrand = brandedFeet;
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/phantom-parameter.ts(103,9): error TS2322: Type 'FeetBrand' is not assignable to type 'MetersBrand'.
  //   Type 'FeetBrand' is not assignable to type '{ readonly __brand: "meters"; }'.
  //     Types of property '__brand' are incompatible.
  //       Type '"feet"' is not assignable to type '"meters"'.
}

// 여기에는 두 방식의 실제 차이가 하나 있다.
// Measurement의 __unit은 옵셔널이라 숫자를 직접 넣을 수 있지만, 예제에서는 의미를 보존하려고 생성 함수를 쓴다.
const directNumberAllowed: Measurement<Meters> = 5;

function compareOptionalAndRequiredMarkers(): void {
  // 브랜드의 __brand는 필수이므로 표식 없는 숫자를 직접 넣는 순간 오류가 난다.
  // @ts-expect-error - number에는 필수 __brand가 없다
  const directNumberRejected: MetersBrand = 5;
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/phantom-parameter.ts(118,9): error TS2322: Type 'number' is not assignable to type 'MetersBrand'.
  //   Type 'number' is not assignable to type '{ readonly __brand: "meters"; }'.
}

// 새로 늘린 세 번째 단위도 양쪽 모두에서 기존 단위와 구별된다는 사실을 컴파일러가 확인한다.
// 브랜드 쪽은 교차 타입을 새로 적어야 했고, 팬텀 쪽은 태그 하나만 더해 제네릭을 다시 썼다.
const kilometersBrandIsDistinct: Eq<KilometersBrand, MetersBrand> = false;
const kilometersMeasurementIsDistinct: Eq<KilometersMeasurement, Measurement<Meters>> = false;

export {};
