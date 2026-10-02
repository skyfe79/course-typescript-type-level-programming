import { Program } from "./program.ts";
import { HttpError, NetworkError } from "./errors.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";
import type { PngRequest } from "./ask-format.ts";

// PNG는 압축된 비트맵이다. 픽셀 반전에는 디코더가 필요하므로 그대로 저장한다.
export type PngImage = PngRequest & { data: Uint8Array };

export class FetchPngProgram extends Program<
  PngRequest, PngImage, HttpError | NetworkError, "network"
> {
  protected readonly body = async (
    request: PngRequest, fx: Handlers,
  ): Promise<PngImage> => {
    const { w, h } = request.size;
    const url = `https://placehold.co/${w}x${h}/png`;
    // fetch의 거부만 감싼다. 서버의 비정상 응답은 아래에서 따로 검사한다.
    const response = await fx.network(url).catch((cause: unknown) => {
      this.fail(new NetworkError(url, cause));
    });
    if (!response.ok) {
      this.fail(new HttpError(response.status, url));
    }
    const data = new Uint8Array(await response.arrayBuffer());
    return { ...request, data };
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<FetchPngProgram>, Remaining<FetchPngProgram>],
  [HttpError | NetworkError, "network"]
> = true;

// network 핸들러를 붙여도 두 선언 오류는 합성 프로그램으로 전파한다.
export const fetchPng = new FetchPngProgram().handle("network", fetch);

const handled: Eq<
  typeof fetchPng, Program<PngRequest, PngImage, HttpError | NetworkError, never>
> = true;
