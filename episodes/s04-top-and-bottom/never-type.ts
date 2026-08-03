// never는 유니온에서 사라져 호버하면 string으로 보인다.
type WithNever = string | never;

function echo(value: WithNever): string {
  return value;
}

console.log(echo("hello"));
