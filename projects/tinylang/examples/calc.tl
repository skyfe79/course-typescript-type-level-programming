let a: number = toNumber(input("첫 번째 숫자: "));
let b: number = toNumber(input("두 번째 숫자: "));
let op: string = input("연산자(+ - * /): ");

if (op == "+") {
  print(a + b);
} else if (op == "-") {
  print(a - b);
} else if (op == "*") {
  print(a * b);
} else if (op == "/") {
  if (b == 0) {
    print("0으로 나눌 수 없습니다");
  } else {
    print(a / b);
  }
} else {
  print("알 수 없는 연산자입니다");
}
