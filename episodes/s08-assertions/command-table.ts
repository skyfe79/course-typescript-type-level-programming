const commandNames = ["add", "remove", "list"] as const;

type CommandName = typeof commandNames[number];

const validName: CommandName = "add";

// as const를 붙이기 전에는 통과하던 줄이다.
// const invalidName: CommandName = "adnd";
// error TS2820: Type '"adnd"' is not assignable to type '"add" | "list" | "remove"'. Did you mean '"add"'?

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
