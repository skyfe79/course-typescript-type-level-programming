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

function runCommand(shouldFail: boolean): CommandResult {
  if (shouldFail) {
    return { status: "err", message: "file not found", exitCode: 1 };
  }
  return { status: "ok", output: "done" };
}

console.log(reportResult(runCommand(false)));
console.log(reportResult(runCommand(true)));

export {};
