import { Program } from "./program.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";
import type { Size } from "./ask-size.ts";
import { readInput } from "./stdin.ts";

// format을 판별자로 삼아 SVG 요청과 PNG 요청을 구별한다.
export type SvgRequest = { format: "svg"; size: Size };
export type PngRequest = { format: "png"; size: Size };
export type ImageRequest = SvgRequest | PngRequest;

export class AskFormatProgram extends Program<Size, ImageRequest, never, "input"> {
  protected readonly body = async (
    size: Size, fx: Handlers,
  ): Promise<ImageRequest> => {
    const answer = await fx.input("형식(svg/png)> ");
    // png 이외의 입력은 기본 형식인 svg로 처리한다.
    return { format: answer === "png" ? "png" : "svg", size };
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<AskFormatProgram>, Remaining<AskFormatProgram>],
  [never, "input"]
> = true;

// 같은 줄 읽기 함수를 사용해도 핸들러는 각 프로그램에 따로 붙인다.
export const askFormat = new AskFormatProgram().handle("input", readInput);

const handled: Eq<
  typeof askFormat, Program<Size, ImageRequest, never, never>
> = true;
