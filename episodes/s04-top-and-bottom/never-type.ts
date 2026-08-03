// never는 유니온에서 사라져 호버하면 string으로 보인다.
type WithNever = string | never;

function echo(value: WithNever): string {
  return value;
}

console.log(echo("hello"));

// 값을 추가하지 않은 빈 배열은 호버하면 never[]로 보인다.
const untyped = [];

const collected = { items: [] };
// collected.items.push(1); // error TS2345: Argument of type '1' is not assignable to parameter of type 'never'.

const results: { items: number[] } = { items: [] };
results.items.push(1);
console.log(results.items);
