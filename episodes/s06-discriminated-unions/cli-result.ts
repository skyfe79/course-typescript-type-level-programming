interface CommandOk {
  status: "ok";
  output: string;
}

interface CommandErr {
  status: "err";
  message: string;
  exitCode: number;
}

type CommandResult = CommandOk | CommandErr;

export {};
