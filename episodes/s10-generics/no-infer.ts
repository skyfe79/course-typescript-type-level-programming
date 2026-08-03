// defaultColor는 colors에 맞는지 검사만 받으면 되는 자리다. 그런데 타입이 그냥 C라서,
// 이 자리도 C의 후보를 함께 던진다.
function createStreetLight<C extends string>(
  colors: C[],
  defaultColor?: C,
): C[] {
  return colors;
}

// "blue"는 colors 어디에도 없다. 그런데 빨간 밑줄이 하나도 없다.
// 오타가 아니라 구조적인 결과다 — defaultColor가 던진 "blue"도 후보로 잡혀 C가 그만큼 넓어졌다.
const light = createStreetLight(["red", "yellow", "green"], "blue");

// 넓어졌다는 증거다. 실제 색 셋만 받는 배열 자리에 넣어 보면 거절당하고,
// 오류 메시지가 C에 무엇이 들어갔는지 그대로 출력한다.
// const actualColors: ("red" | "yellow" | "green")[] = light;
// error TS2322: Type '("blue" | "green" | "red" | "yellow")[]' is not assignable to type '("green" | "red" | "yellow")[]'.

console.log(light);

export {};
