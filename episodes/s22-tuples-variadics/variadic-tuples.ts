// 가변 인자 튜플은 "튜플 타입 안에서 다른 튜플 타입을 펼치는" 문법이다.
// 실행: node episodes/s22-tuples-variadics/variadic-tuples.ts
// 검사: npx tsc --noEmit

// T가 어떤 길이와 어떤 원소 타입을 가진 튜플인지 아직 몰라도, ...T로 그 자리를
// 그대로 펼칠 수 있다. 그래서 새 원소를 앞이나 뒤에 붙이면서도 기존 자리 정보는 잃지 않는다.
type Prepend<T extends readonly unknown[], E> = [E, ...T];
type Append<T extends readonly unknown[], E> = [...T, E];

type Row = [number, boolean];
type WithLabel = Prepend<Row, string>;
type WithFlag = Append<Row, string>;

const labeledRow: WithLabel = ["user-145", 12, true];
const flaggedRow: WithFlag = [12, true, "confirmed"];

// WithLabel은 string을 앞에 붙인 뒤 Row의 number, boolean 자리가 이어진다.
// 각 자리에서 자기 타입의 메서드를 실제로 부르면 순서와 타입이 함께 검증된다.
const labelUpper = labeledRow[0].toUpperCase();
const labeledNumberText = labeledRow[1].toFixed(1);
const labeledBooleanValue = labeledRow[2].valueOf();
const labeledLength: 3 = labeledRow.length;

// WithFlag는 Row의 두 자리를 그대로 둔 다음 string을 뒤에 붙인다.
const flaggedNumberText = flaggedRow[0].toFixed(2);
const flaggedBooleanValue = flaggedRow[1].valueOf();
const flagUpper = flaggedRow[2].toUpperCase();
const flaggedLength: 3 = flaggedRow.length;

// 새 원소가 붙었다고 해서 Row의 내부 순서가 바뀌지는 않는다.
// 아래 값은 number 자리와 boolean 자리를 바꿔 넣었으므로 타입 검사에서 막힌다.
// @ts-expect-error - WithLabel의 1번 자리는 number, 2번 자리는 boolean이어야 한다.
const mislabeledRow: WithLabel = ["bad-order", true, 12];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/variadic-tuples.ts(33,48): error TS2322: Type 'boolean' is not assignable to type 'number'.
// episodes/s22-tuples-variadics/variadic-tuples.ts(33,54): error TS2322: Type 'number' is not assignable to type 'boolean'.

// 뒤에 붙이는 경우도 기존 Row의 순서는 고정되어 있다.
// @ts-expect-error - WithFlag의 0번 자리는 number, 1번 자리는 boolean이어야 한다.
const misflaggedRow: WithFlag = [true, 12, "bad-order"];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/variadic-tuples.ts(40,34): error TS2322: Type 'boolean' is not assignable to type 'number'.
// episodes/s22-tuples-variadics/variadic-tuples.ts(40,40): error TS2322: Type 'number' is not assignable to type 'boolean'.

console.log("앞에 붙인 튜플:", labeledRow);
console.log(
  `WithLabel 검증: ${labelUpper}, ${labeledNumberText}, ${labeledBooleanValue}, 길이 ${labeledLength}`,
);
console.log("뒤에 붙인 튜플:", flaggedRow);
console.log(
  `WithFlag 검증: ${flaggedNumberText}, ${flaggedBooleanValue}, ${flagUpper}, 길이 ${flaggedLength}`,
);

// 한 튜플 안에서 앞뒤를 동시에 조합할 수도 있다. "start"와 "end"는 그냥 string이 아니라
// 정확히 그 문자열 리터럴 타입이므로, 다른 문자열을 넣으면 컴파일러가 잡아낸다.
type Wrap<T extends readonly unknown[]> = ["start", ...T, "end"];
type WrappedRow = Wrap<Row>;

const wrappedRow: WrappedRow = ["start", 12, true, "end"];

const wrappedStart: "start" = wrappedRow[0];
const wrappedNumberText = wrappedRow[1].toFixed(0);
const wrappedBooleanValue = wrappedRow[2].valueOf();
const wrappedEnd: "end" = wrappedRow[3];
const wrappedLength: 4 = wrappedRow.length;

// @ts-expect-error - 마지막 자리는 아무 문자열이 아니라 정확히 "end"여야 한다.
const wrongWrappedEnd: WrappedRow = ["start", 12, true, "finish"];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/variadic-tuples.ts(68,57): error TS2322: Type '"finish"' is not assignable to type '"end"'.

console.log("앞뒤로 감싼 튜플:", wrappedRow);
console.log(
  `Wrap 검증: ${wrappedStart}, ${wrappedNumberText}, ${wrappedBooleanValue}, ${wrappedEnd}, 길이 ${wrappedLength}`,
);

// 펼침을 두 번 쓰는 것 자체는 가능하다. 고정 길이 튜플끼리 이어 붙이면 모든 자리가 살아남는다.
type Concat<A extends readonly unknown[], B extends readonly unknown[]> = [...A, ...B];

type FixedConcat = Concat<[number, boolean], [string]>;
const fixedConcat: FixedConcat = [12, true, "done"];

const fixedConcatNumberText = fixedConcat[0].toFixed(1);
const fixedConcatBooleanValue = fixedConcat[1].valueOf();
const fixedConcatStringUpper = fixedConcat[2].toUpperCase();
const fixedConcatLength: 3 = fixedConcat.length;

console.log("고정 튜플끼리 이어 붙인 값:", fixedConcat);
console.log(
  `Concat 검증: ${fixedConcatNumberText}, ${fixedConcatBooleanValue}, ${fixedConcatStringUpper}, 길이 ${fixedConcatLength}`,
);

// 열린 배열은 길이를 모르는 배열이다. 제네릭 Concat에 열린 배열 두 개를 넘기면 오류가
// 나지는 않지만, 어느 경계부터 string인지 기억하지 못해 (number | string)[]로 평탄화된다.
type FlattenedOpenArrays = Concat<number[], string[]>;
const flattenedOpenArrays: FlattenedOpenArrays = [1, 2, "tail"];
const flattenedLength: number = flattenedOpenArrays.length;

// 0번 자리도 더 이상 number라고 장담할 수 없다. number와 string이 섞인 배열의 한 원소일 뿐이다.
// @ts-expect-error - 경계가 사라져 flattenedOpenArrays[0]은 number | string이다.
const flattenedFirstNumber: number = flattenedOpenArrays[0];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/variadic-tuples.ts(101,7): error TS2322: Type 'string | number' is not assignable to type 'number'.
//   Type 'string' is not assignable to type 'number'.

// 제네릭을 거치면 위처럼 평탄화로 끝나지만, 리터럴 타입 안에 열린 배열 두 개를 직접 나란히
// 쓰는 것은 아예 금지된다. 어디까지가 앞 배열인지 정할 방법이 없기 때문이다.
// 여기서는 타입 별칭만 만들기 때문에 실행되는 코드는 없다.
// @ts-expect-error - 열린 배열 rest 뒤에 또 다른 열린 배열 rest를 직접 둘 수 없다.
type Bad = [...number[], ...string[]];
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/variadic-tuples.ts(110,26): error TS1265: A rest element cannot follow another rest element.

console.log("열린 배열 두 개를 제네릭으로 이어 붙인 값:", flattenedOpenArrays);
console.log(`평탄화된 배열의 길이는 리터럴이 아니라 number로 남습니다: ${flattenedLength}`);
console.log("결론: 펼침은 자리를 늘려 주지만, 길이를 모르는 열린 배열은 한 튜플 안에 하나만 안전하게 놓을 수 있습니다.");

export {};
