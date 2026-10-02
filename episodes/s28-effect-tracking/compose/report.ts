import { Program } from "./program.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";

// 보고 프로그램은 저장된 상대 이름을 받아 메시지를 만든다.
export class ReportProgram extends Program<string, void, never, "logging"> {
  protected readonly body = async (name: string, fx: Handlers): Promise<void> => {
    await fx.logging(`저장: ${name}`);
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<ReportProgram>, Remaining<ReportProgram>],
  [never, "logging"]
> = true;

// 콘솔 출력 핸들러도 출력을 수행하는 프로그램이 소유한다.
export const report = new ReportProgram().handle("logging", async (message) => {
  console.log(message);
});

const handled: Eq<
  typeof report, Program<string, void, never, never>
> = true;
