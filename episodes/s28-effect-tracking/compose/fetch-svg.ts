import { Program } from "./program.ts";
import { HttpError, NetworkError } from "./errors.ts";
import type { Eq, Handlers, Remaining, RemainingErrors } from "./program.ts";
import type { SvgRequest } from "./ask-format.ts";

// 요청 크기와 형식을 결과에도 보존하여 반전과 저장에 사용한다.
export type SvgImage = SvgRequest & { data: string; flipped: boolean };

export class FetchSvgProgram extends Program<
  SvgRequest, SvgImage, HttpError | NetworkError, "network"
> {
  protected readonly body = async (
    request: SvgRequest, fx: Handlers,
  ): Promise<SvgImage> => {
    const { w, h } = request.size;
    const url = `https://placehold.co/${w}x${h}`;
    // fetch의 거부만 감싼다. 서버의 비정상 응답은 아래에서 따로 검사한다.
    const response = await fx.network(url).catch((cause: unknown) => {
      this.fail(new NetworkError(url, cause));
    });
    if (!response.ok) {
      this.fail(new HttpError(response.status, url));
    }
    return { ...request, data: await response.text(), flipped: false };
  };

  constructor() {
    super();
  }
}

const declared: Eq<
  [RemainingErrors<FetchSvgProgram>, Remaining<FetchSvgProgram>],
  [HttpError | NetworkError, "network"]
> = true;

// 다운로드는 자신의 network를 처리하고 두 선언 오류는 바깥으로 전파한다.
export const fetchSvg = new FetchSvgProgram().handle("network", fetch);

const handled: Eq<
  typeof fetchSvg, Program<SvgRequest, SvgImage, HttpError | NetworkError, never>
> = true;
