const commandNames = ["add", "remove", "list"];

// 원소 타입이 string으로 넓어져서 목록에 없는 이름도 통과한다.
const widenedName: typeof commandNames[number] = "adnd";

const commandHandlers = {
  add: (arg: string) => `added ${arg}`,
  remove: (arg: string) => `removed ${arg}`,
  list: () => "listing all items",
};

// 이름 타입이 string인 한 오타를 걸러낼 방법이 아직 없다.
function describeRequestedCommand(name: string) {
  return `requested: ${name}`;
}

console.log(describeRequestedCommand("adnd"));

export {};
