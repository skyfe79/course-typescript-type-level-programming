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

function reportResult(result: CommandResult): string {
  switch (result.status) {
    case "ok":
      return `OK: ${result.output}`;
    case "err":
      return `ERR(${result.exitCode}): ${result.message}`;
  }
}

export {};
