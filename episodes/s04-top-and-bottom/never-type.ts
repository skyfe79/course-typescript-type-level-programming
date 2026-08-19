// never는 유니온에서 사라져 호버하면 string으로 보인다.
type WithNever = string | never;

function echo(value: WithNever): string {
  return value;
}

console.log(echo("hello"));

// 지역 변수의 빈 배열은 선언 자리에서는 any[]로 보이고, push 뒤의 참조에서는 number[]로 읽힌다.
const untyped = [];
untyped.push(1);
console.log(untyped);

// 객체 프로퍼티의 빈 배열은 never[]로 굳어 어떤 값도 넣을 수 없다.
const collected = { items: [] };
// collected.items.push(1); // error TS2345: Argument of type '1' is not assignable to parameter of type 'never'.

const results: { items: number[] } = { items: [] };
results.items.push(1);
console.log(results.items);
