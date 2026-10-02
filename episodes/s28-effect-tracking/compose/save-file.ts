import { mkdir, writeFile } from "node:fs/promises";
import { Program } from "./program.ts";
import { WriteError } from "./errors.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";
import type { SvgImage } from "./fetch-svg.ts";
import type { PngImage } from "./fetch-png.ts";

// 저장 프로그램은 형식과 반전 여부로 파일 이름을 정한다.
export class SaveFileProgram extends Program<
  SvgImage | PngImage, string, WriteError, "fileIO"
> {
  protected readonly body = async (
    image: SvgImage | PngImage, fx: Handlers,
  ): Promise<string> => {
    const { w, h } = image.size;
    const suffix = image.format === "svg" && image.flipped ? "-flipped" : "";
    const name = `placeholder-${w}x${h}${suffix}.${image.format}`;
    try {
      return await fx.fileIO(name, image.data);
    } catch (cause) {
      this.fail(new WriteError(`out/${name}`, cause));
    }
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<SaveFileProgram>, Remaining<SaveFileProgram>],
  [WriteError, "fileIO"]
> = true;

// 작업 디렉터리와 관계없이 이 모듈 옆의 out에 저장하고 상대 이름을 리턴한다.
const dir = new URL("./out/", import.meta.url);

export const saveFile = new SaveFileProgram().handle("fileIO", async (name, data) => {
  await mkdir(dir, { recursive: true });
  await writeFile(new URL(name, dir), data);
  return `out/${name}`;
});

const handled: Eq<
  typeof saveFile, Program<SvgImage | PngImage, string, WriteError, never>
> = true;
