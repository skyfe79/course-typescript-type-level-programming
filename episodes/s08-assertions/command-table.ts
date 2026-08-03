const commandNames = ["add", "remove", "list"] as const;

type CommandName = typeof commandNames[number];

const validName: CommandName = "add";

// as const를 붙이기 전에는 통과하던 줄이다.
// const invalidName: CommandName = "adnd";
// error TS2820: Type '"adnd"' is not assignable to type '"add" | "list" | "remove"'. Did you mean '"add"'?

const commandHandlers: Record<CommandName, (arg: string) => string> = {
  add: (arg) => `added ${arg}`,
  remove: (arg) => `removed ${arg}`,
  list: () => "listing all items",
};

function runCommand(name: CommandName, arg: string) {
  return commandHandlers[name](arg);
}

// 오타난 이름은 호출 자체가 막힌다.
// runCommand("adnd", "item");
// error TS2345: Argument of type '"adnd"' is not assignable to parameter of type '"add" | "list" | "remove"'.

// 이름을 string으로 받는 초안은 여전히 오타를 그대로 통과시킨다.
function describeRequestedCommand(name: string) {
  return `requested: ${name}`;
}

console.log(describeRequestedCommand("adnd"));
console.log(runCommand("add", "item"));

export {};
