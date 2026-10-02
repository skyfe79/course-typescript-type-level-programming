import { Program } from "./program.ts";
import type { Eq, Remaining, RemainingErrors } from "./program.ts";
import type { SvgImage } from "./fetch-svg.ts";

// 루트 svg를 보존하고 내부를 이동과 좌우 반전 그룹으로 감싼다.
export class FlipSvgProgram extends Program<SvgImage, SvgImage, never, never> {
  protected readonly body = async (image: SvgImage): Promise<SvgImage> => {
    const group = `<g transform="translate(${image.size.w} 0) scale(-1 1)">`;
    const data = image.data.replace(
      /(<svg\b[^>]*>)([\s\S]*)(<\/svg>)/,
      (_, root, inner, end) => `${root}${group}${inner}</g>${end}`,
    );
    return { ...image, data, flipped: true };
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<FlipSvgProgram>, Remaining<FlipSvgProgram>],
  [never, never]
> = true;

// 문자열 계산만 수행하므로 처음부터 처리할 이펙트가 없다.
export const flipSvg: Program<SvgImage, SvgImage, never, never> = new FlipSvgProgram();

const handled: Eq<
  typeof flipSvg, Program<SvgImage, SvgImage, never, never>
> = true;
