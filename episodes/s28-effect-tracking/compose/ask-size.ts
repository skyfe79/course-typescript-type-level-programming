import { Program } from "./program.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";
import { readInput } from "./stdin.ts";

// 크기는 문자열로 보존한다. 잘못된 크기의 실패는 다운로드에서 확인한다.
export type Size = { w: string; h: string };

export class AskSizeProgram extends Program<void, Size | "quit", never, "input"> {
  protected readonly body = async (
    _: void, fx: Handlers,
  ): Promise<Size | "quit"> => {
    const w = await fx.input("너비> ");
    if (w === "q") return "quit";
    const h = await fx.input("높이> ");
    if (h === "q") return "quit";
    return { w, h };
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<AskSizeProgram>, Remaining<AskSizeProgram>],
  [never, "input"]
> = true;

// 입력을 수행하는 프로그램이 자신의 input 핸들러를 소유한다.
export const askSize = new AskSizeProgram().handle("input", readInput);

const handled: Eq<
  typeof askSize, Program<void, Size | "quit", never, never>
> = true;
