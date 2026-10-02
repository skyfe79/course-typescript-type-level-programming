import { Program } from "./program.ts";
import type { Eq } from "./program.ts";
import { isHttpError, isFatal } from "./errors.ts";
import type { HttpError, NetworkError, WriteError } from "./errors.ts";
import { pipe, branch, repeat, catchError } from "./operators.ts";
import { askSize } from "./ask-size.ts";
import type { Size } from "./ask-size.ts";
import { askFormat } from "./ask-format.ts";
import type { ImageRequest, SvgRequest, PngRequest } from "./ask-format.ts";
import { fetchSvg } from "./fetch-svg.ts";
import { fetchPng } from "./fetch-png.ts";
import { flipSvg } from "./flip-svg.ts";
import { saveFile } from "./save-file.ts";
import { report } from "./report.ts";
import { closeInput } from "./stdin.ts";

// 선택은 형식으로, 반복 종료는 quit으로 판별한다. 종료 검사는 repeat이 맡는다.
function isSvg(request: ImageRequest): request is SvgRequest {
  return request.format === "svg";
}

function isQuit(value: Size | "quit"): value is "quit" {
  return value === "quit";
}

// 순차, 선택, 반복은 구조적 프로그래밍의 세 제어 구조이다.
// 각 프로그램이 자신의 핸들러를 소유해도 세 선언 오류는 합성 후에 남는다.
const svgPath = pipe(fetchSvg, flipSvg, saveFile, report);
const pngPath = pipe(fetchPng, saveFile, report);
const perImage = pipe(askFormat, branch(isSvg, svgPath, pngPath));
const app = repeat(askSize, isQuit, perImage);

const svgErrors: Eq<
  typeof svgPath,
  Program<SvgRequest, void, HttpError | NetworkError | WriteError, never>
> = true;
const pngErrors: Eq<
  typeof pngPath,
  Program<PngRequest, void, HttpError | NetworkError | WriteError, never>
> = true;
const perImageErrors: Eq<
  typeof perImage, Program<Size, void, HttpError | NetworkError | WriteError, never>
> = true;
const appErrors: Eq<
  typeof app, Program<void, void, HttpError | NetworkError | WriteError, never>
> = true;

// 처리되지 않은 오류는 앱까지 전파된다. 이 함수는 정의만 하고 호출하지 않는다.
function tryUnhandled(): void {
  // @ts-expect-error - HttpError, NetworkError, WriteError가 남아 있어 Err가 never가 아니다
  app.run();
}

console.log("합성: app에 HttpError, NetworkError, WriteError가 남아 있어 run()을 호출할 수 없습니다.");

