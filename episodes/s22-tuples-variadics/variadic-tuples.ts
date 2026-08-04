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
