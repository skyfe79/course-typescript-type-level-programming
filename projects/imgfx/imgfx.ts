// imgfx — 파이프라인이 주고받을 핵심 데이터 타입 ImageBuffer<Format>을 정의하고,
// 포맷을 값이 아니라 팬텀 타입 매개변수로 들고 다니게 만든다.
// 실행: node projects/imgfx/imgfx.ts
// 검사: npx tsc --noEmit
//
// 이 프로젝트가 완성될 때까지 지킬 세 가지 보장:
// 1. 앞 스테이지의 출력 포맷과 뒤 스테이지의 입력 포맷이 어긋난 체인은 컴파일되지 않는다.
// 2. 각 스테이지는 입력 버퍼를 제자리에서 바꾸지 않고 항상 새 버퍼를 반환한다.
// 3. 파일 입출력은 한 계층에만 두며, 스테이지는 파일 시스템을 전혀 알지 못한다.

// pngjs는 여전히 선언 파일 없이 순수 JavaScript로 배포되며, 타입은 빌드·검사에만 필요한
// devDependencies의 @types/pngjs가 제공한다. 이제 png.width는 number, png.data는 Buffer로 잡히고,
// colorType: 6도 0 | 2 | 4 | 6 중 하나로 검사된다.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

// 이미지 스테이지가 주고받을 수 있는 픽셀 포맷을 하나의 닫힌 집합으로 고정한다.
// 각 태그는 지난 시간에 고정한 PNG colorType과 정확히 하나씩 짝지어진다: RGBA8→6, RGB8→2, Gray8→0.
type PixelFormat = "RGBA8" | "RGB8" | "Gray8";

// codeStep 447 — 픽셀 포맷뿐 아니라 너비와 높이도 타입 매개변수로 들고 다닌다.
// 기본값을 number로 두었으므로 기존의 ImageBuffer<"RGBA8"> 표기는 그대로 쓸 수 있고,
// 필요한 자리에서만 ImageBuffer<"RGBA8", 100, 60>처럼 정확한 크기를 표현할 수 있다.
interface ImageBuffer<
  Format extends PixelFormat,
  W extends number = number,
  H extends number = number,
> {
  readonly data: Uint8ClampedArray;
  readonly width: W;
  readonly height: H;
  /** 타입에만 존재하는 표시. 실제 객체엔 절대 채우지 않는다 — 그래서 팬텀(phantom)이다. */
  readonly __format?: Format;
}

function makeImageBuffer<
  Format extends PixelFormat,
  W extends number = number,
  H extends number = number,
>(
  data: Uint8ClampedArray,
  width: W,
  height: H,
): ImageBuffer<Format, W, H> {
  // __format이 옵셔널이라 값을 넣지 않아도 구조적으로 ImageBuffer를 만족한다.
  // 포맷 정보는 런타임 객체를 더럽히지 않고 타입 검사에만 남는다.
  // 숫자 리터럴을 넘기면 W와 H도 그 리터럴로 추론된다. 이렇게 얻은 ImageBuffer<F, 3, 2>는
  // 너비·높이를 number로 받는 기존 ImageBuffer<F>에도 그대로 대입되므로 이전 호출부는 깨지지 않는다.
  return { data, width, height };
}

const rgba: ImageBuffer<"RGBA8"> = makeImageBuffer(new Uint8ClampedArray(4), 1, 1);

// 픽셀당 바이트 수는 호출자가 손으로 적지 않고 포맷 태그 하나에서만 유도한다.
const BYTES_PER_PIXEL = { RGBA8: 4, RGB8: 3, Gray8: 1 } as const;

// 인덱스 접근 타입으로 태그에 대응하는 값 타입을 그대로 꺼낸다.
// 그래서 반환 타입이 뭉뚱그린 number가 아니라 RGBA8이면 4, Gray8이면 1로 좁혀진다.
type BytesPerPixelOf<Format extends PixelFormat> = (typeof BYTES_PER_PIXEL)[Format];

function bytesPerPixel<Format extends PixelFormat>(format: Format): BytesPerPixelOf<Format> {
  return BYTES_PER_PIXEL[format];
}

const rgbaSize = bytesPerPixel("RGBA8"); // 타입은 number가 아니라 리터럴 4다.
const graySize = bytesPerPixel("Gray8"); // 타입은 number가 아니라 리터럴 1이다.

function requiresRgba(image: ImageBuffer<"RGBA8">): void {
  console.log(`requiresRgba ${image.width}x${image.height} bytes=${image.data.length}`);
}

const gray: ImageBuffer<"Gray8"> = makeImageBuffer(new Uint8ClampedArray(1), 1, 1);

// codeStep 452 — 두 호출은 원래 모듈 맨 위에서 곧바로 실행됐다. 이번 화에서 이 파일이 CLI가
// 되면서 그럴 수 없게 됐다: 모듈을 불러오기만 해도 찍히므로 `imgfx.ts apply …`의 출력 앞에
// 관계없는 두 줄이 섞인다. CLI는 자기 표준 출력을 온전히 가져야 하므로 관찰을 함수로 감싸
// main()이 부르게 바꾼다. 인자 없이 실행할 때의 출력은 순서까지 그대로다.
function observePhantomMismatch(): void {
  // 팬텀 필드는 런타임에 존재하지 않으므로 아래 두 호출 모두 실행 중에는 그냥 돌아간다.
  // 실제로 찍히는 bytes= 값이 1과 4로 갈리는 것이 바로 타입이 막으려던 그 어긋남이다.
  // @ts-expect-error — Format이 "Gray8"과 "RGBA8"로 갈려 구조적으로 더 이상 같지 않다
  requiresRgba(gray);

  requiresRgba(rgba); // 통과 — 둘 다 ImageBuffer<"RGBA8">
}

// 실행 위치가 아니라 이 모듈의 위치를 기준으로 잡아 저장소 루트에서도 같은 파일을 읽고 쓴다.
const INPUT_URL = new URL("./photo.png", import.meta.url);
const OUTPUT_URL = new URL("./copy.png", import.meta.url);

// codeStep 440 — 컨볼루션 커널의 전체 길이는 중심이 하나뿐인 홀수 정사각형이어야 한다.
// 이번 프로젝트에서 다룰 최대 한 변은 7이므로, 허용되는 전체 길이를 닫힌 유니온으로 적는다.
type OddSquareLength = 1 | 9 | 25 | 49;

// 조건을 통과한 커널 값은 가중치 튜플과 한 변의 길이, 정규화에 쓸 나눗수를 함께 보관한다.
// 가중치를 미리 나눈 number[]로 만들지 않고 정수 리터럴 튜플로 남겨야 길이 검사가 유지된다.
interface KernelShape<W extends readonly number[]> {
  readonly weights: W;
  readonly side: number;
  /** 가중치 합으로 나눈다. 박스는 3×3이면 9·5×5면 25, 가우시안은 16, 샤픈은 1이다. */
  readonly divisor: number;
}

// 잘못된 길이를 never로 지우지 않고 이름 있는 인터페이스로 전달한다.
// 호버에는 오류 이름과 Actual 타입 인자가 그대로 남아 무엇이 잘못됐는지 읽을 수 있다.
interface KernelLengthMismatch<Actual extends number> {
  readonly error: "KERNEL_LENGTH_NOT_ODD_SQUARE";
  readonly allowed: OddSquareLength;
  readonly actualLength: Actual;
}

type Kernel<W extends readonly number[]> =
  W["length"] extends OddSquareLength
    ? KernelShape<W>
    : KernelLengthMismatch<W["length"] & number>;

// 3×3의 아홉 가중치는 허용 유니온의 9에 해당하므로 정상 커널 모양을 만족한다.
const boxKernel3x3: Kernel<readonly [1, 1, 1, 1, 1, 1, 1, 1, 1]> = {
  weights: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  side: 3,
  divisor: 9,
};

// 잘못된 예제는 호출하지 않는 함수에 두어 런타임 출력은 늘리지 않고 타입 검사 증거만 남긴다.
function brokenKernelDemo(): void {
  const brokenKernel: Kernel<readonly [1, 2, 3, 4, 5, 6, 7, 8]> = {
    // @ts-expect-error — TS2353: 길이 8은 KernelLengthMismatch<8>이므로 weights 필드가 없다.
    weights: [1, 2, 3, 4, 5, 6, 7, 8],
    side: 3,
    divisor: 8,
  };

  void brokenKernel;
}

// codeStep 428 — 파이프라인의 각 단계를 함수가 아니라 평범한 데이터로 표현한다.
// 함수로만 보관하면 실제로 호출해 보기 전에는 무슨 작업인지 알 수 없어서,
// 목록 출력·재정렬·사전 검사를 실제 이미지 처리와 분리하기 어렵다.
interface Stage<Kind extends string, In extends PixelFormat, Out extends PixelFormat> {
  // kind는 유니온의 정확한 멤버를 가려 내는 판별자(discriminant)다.
  readonly kind: Kind;
  // in과 out은 나중에 앞 스테이지의 출력과 뒤 스테이지의 입력을 맞물리게 할 포맷 태그다.
  readonly in: In;
  readonly out: Out;
}

// codeStep 434 — 그레이스케일부터 Stage 대신 PixelStage를 확장해 실행 함수를 갖게 한다.
// PixelStage와 mapPixels의 정의는 파이프라인 타입 설명이 끝난 이 파일 아래쪽에 있다. 인터페이스
// 이름은 선언 위치보다 앞에서도 참조할 수 있으므로, 여기서는 "무엇을 하는 스테이지인가"를 먼저 읽고
// "어떻게 도는가"는 뒤에서 읽게 된다.
interface GrayscaleStage extends PixelStage<"grayscale", "RGBA8", "Gray8"> {}

// codeStep 435 — 출력 포맷이 그대로인 나머지 세 효과도 같은 실행 계약으로 옮긴다.
interface InvertStage extends PixelStage<"invert", "RGBA8", "RGBA8"> {}
interface BrightnessStage extends PixelStage<"brightness", "RGBA8", "RGBA8"> {
  readonly amount: number;
}
interface ContrastStage extends PixelStage<"contrast", "RGBA8", "RGBA8"> {
  readonly amount: number;
}

// codeStep 437 — 임계값 효과도 RGBA8 한 픽셀을 RGBA8 한 픽셀로 바꾸지만,
// 어느 쪽으로 가를지는 스테이지 데이터에 보관한 level이 결정한다.
interface ThresholdStage extends PixelStage<"threshold", "RGBA8", "RGBA8"> {
  readonly level: number;
}

// codeStep 438 — 채도 효과의 세기는 factor에 남겨 실행 전에도 계획을 설명할 수 있게 한다.
interface SaturateStage extends PixelStage<"saturate", "RGBA8", "RGBA8"> {
  readonly factor: number;
}

// codeStep 443 — 컨볼루션 셋은 모두 이웃을 읽으므로 실행기 관점에서는 kind 하나로 묶는다.
// 실제 효과는 effect가 가르고, side와 edge만 보면 실행 전에 필요한 작업 범위도 설명할 수 있다.
// 이 계열만 스크래치 버퍼가 필요하다는 판정도 kind === "convolve" 하나로 끝난다.
interface ConvolveStage extends PixelStage<"convolve", "RGBA8", "RGBA8"> {
  readonly effect: "box" | "gaussian" | "sharpen";
  readonly side: number;
  readonly edge: EdgePolicy;
}

// 모든 스테이지를 하나의 판별 유니온으로 모으면 kind를 확인할 때 나머지 필드도 함께 좁혀진다.
type AnyStage =
  | InvertStage
  | GrayscaleStage
  | BrightnessStage
  | ContrastStage
  | ThresholdStage
  | SaturateStage
  | ConvolveStage;

// 생성자 함수는 실행 로직이 아니라, 오타 없이 스테이지 데이터 한 건을 만드는 작은 도우미다.
function invertStage(): InvertStage {
  return {
    kind: "invert",
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", invertPixel),
  };
}

// codeStep 434 — 그레이스케일 스테이지에 공유 순회로 이어지는 실행 함수를 얹는다.
function grayscaleStage(): GrayscaleStage {
  return {
    kind: "grayscale",
    in: "RGBA8",
    out: "Gray8",
    run: (buf) => mapPixels(buf, "Gray8", toGrayscale),
  };
}

// codeStep 435 — 세 생성자도 각자의 커널을 공유 순회에 건네는 실행 함수를 돌려준다.
function brightnessStage(amount: number): BrightnessStage {
  // codeStep 452 — CLI가 먼저 검사하더라도 생성자는 CLI 밖의 코드에서도 직접 호출될 수 있다.
  // 스테이지가 품을 값의 불변식은 가장 안쪽 경계인 생성자도 스스로 지켜야 한다.
  if (!Number.isFinite(amount)) {
    throw new Error(`brightness amount는 유한한 숫자여야 합니다: ${amount}`);
  }

  return {
    kind: "brightness",
    amount,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", brightnessKernel(amount)),
  };
}

function contrastStage(amount: number): ContrastStage {
  // codeStep 452 — 호출 경로가 CLI인지와 상관없이 잘못된 스테이지가 만들어지지 않게 한다.
  // 바깥 입력 검사는 친절한 오류를, 생성자 검사는 라이브러리 자체의 불변식을 책임진다.
  if (!Number.isFinite(amount)) {
    throw new Error(`contrast amount는 유한한 숫자여야 합니다: ${amount}`);
  }

  return {
    kind: "contrast",
    amount,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", contrastKernel(amount)),
  };
}

// codeStep 437 — 임계값 스테이지도 커널을 공유 순회에 건네기만 한다.
function thresholdStage(level: number): ThresholdStage {
  // codeStep 439 — 잘못된 level은 스테이지 객체를 만들기 전에 거부한다.
  // 그러면 유효하지 않은 스테이지가 파이프라인 계획에 들어갈 틈이 없다.
  // NaN은 어떤 크기 비교에도 false를 돌려주므로 범위 검사만으로는 빠져나간다.
  // 숫자인지부터 확인해야 "이 뒤로는 유효한 값뿐"이라는 약속이 실제로 성립한다.
  if (!Number.isFinite(level) || level < 0 || level > 255) {
    throw new Error(`threshold level은 0에서 255 사이의 숫자여야 합니다: ${level}`);
  }

  return {
    kind: "threshold",
    level,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", thresholdKernel(level)),
  };
}

// codeStep 438 — 채도 스테이지는 factor를 품고 같은 mapPixels를 재사용한다.
function saturateStage(factor: number): SaturateStage {
  // codeStep 439 — factor도 객체 생성 시점에 한 번 검사해 잘못된 계획을 일찍 막는다.
  // 여기서도 NaN을 먼저 걸러야 아래 커널이 값을 믿고 계산만 할 수 있다.
  if (!Number.isFinite(factor) || factor < 0) {
    throw new Error(`saturate factor는 0 이상의 숫자여야 합니다: ${factor}`);
  }

  return {
    kind: "saturate",
    factor,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", saturateKernel(factor)),
  };
}

// codeStep 443 — 박스 블러의 크기는 스테이지를 만드는 순간 검사해 잘못된 계획 생성을 막는다.
function boxBlurStage(size: number, edge: EdgePolicy = "clamp"): ConvolveStage {
  // NaN과 Infinity는 정수·홀수 검사만 믿지 않고 Number.isFinite에서 먼저 거른다.
  if (!Number.isFinite(size) || !Number.isInteger(size) || size < 1 || size % 2 === 0) {
    throw new Error(`box blur size는 1 이상의 유한한 홀수 정수여야 합니다: ${size}`);
  }

  return {
    kind: "convolve",
    effect: "box",
    side: size,
    edge,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => boxBlurSeparable(buf, size, edge),
  };
}

// codeStep 443 — 이름이 gaussianKernel ↔ gaussianBlurStage로 짝지어져 값과 스테이지를 구분한다.
function gaussianBlurStage(edge: EdgePolicy = "clamp"): ConvolveStage {
  return {
    kind: "convolve",
    effect: "gaussian",
    side: gaussianKernel.side,
    edge,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => convolve(buf, gaussianKernel, edge),
  };
}

// codeStep 443 — 샤픈도 같은 일반 순회를 쓰고 커널 값만 바꾸는 스테이지다.
function sharpenStage(edge: EdgePolicy = "clamp"): ConvolveStage {
  return {
    kind: "convolve",
    effect: "sharpen",
    side: sharpenKernel.side,
    edge,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => convolve(buf, sharpenKernel, edge),
  };
}

// codeStep 439 — 두 생성자가 실행보다 먼저 실패한다는 사실을 한 줄의 실행 결과로 관찰한다.
function rejectedStageDemo(): string {
  const messages: string[] = [];

  try {
    thresholdStage(300);
  } catch (error) {
    messages.push(error instanceof Error ? error.message : String(error));
  }

  try {
    saturateStage(-1);
  } catch (error) {
    messages.push(error instanceof Error ? error.message : String(error));
  }

  try {
    // 명령줄 인자를 Number로 바꾸다 실패하면 예외가 아니라 NaN이 돌아온다.
    // 크기 비교만으로 걸렀다면 이 값이 그대로 커널까지 흘러 들어갔을 자리다.
    thresholdStage(Number("128px"));
  } catch (error) {
    messages.push(error instanceof Error ? error.message : String(error));
  }

  // codeStep 443 — 컨볼루션 스테이지도 같은 규약을 따른다. 커널 크기는 홀수여야 중심이
  // 하나로 정해지므로, 짝수 4는 이미지를 한 번도 읽기 전에 여기서 거부된다.
  try {
    boxBlurStage(4);
  } catch (error) {
    messages.push(error instanceof Error ? error.message : String(error));
  }

  return messages.join(" / ");
}

// 아직 실행기가 읽기 전인데도 계획 전체를 직렬화하거나 순서를 바꿀 수 있다.
const plan: readonly AnyStage[] = [invertStage(), brightnessStage(20), grayscaleStage()];

// codeStep 429 — 실행기는 kind를 기준으로 분기하고, never로 모든 종류를 처리했는지 검사한다.
function describeStage(stage: AnyStage): string {
  switch (stage.kind) {
    case "invert":
      return "반전";
    case "grayscale":
      return "그레이스케일";
    case "brightness":
      return `밝기 ${stage.amount}`;
    case "contrast":
      return `대비 ${stage.amount}`;
    // codeStep 437 — AnyStage에 넣은 새 종류도 처리해 소진 검사를 다시 만족시킨다.
    case "threshold":
      return `임계값 ${stage.level}`;
    // codeStep 438 — 채도도 factor까지 읽어 계획을 설명한다.
    case "saturate":
      return `채도 ${stage.factor}`;
    // codeStep 443 — 실행기에게는 컨볼루션 하나이고, 효과와 크기는 스테이지 데이터가 설명한다.
    case "convolve":
      return `컨볼루션 ${stage.effect} ${stage.side}x${stage.side}`;
    default: {
      // 모든 case를 처리했다면 이 지점의 stage에는 가능한 값이 없어 never로 좁혀진다.
      const exhaustive: never = stage;
      throw new Error(`처리하지 않은 스테이지: ${JSON.stringify(exhaustive)}`);
    }
  }
}

// codeStep 445 — 플립은 포맷과 크기를 보존하지만, 이제 버퍼 전체를 실행하는 run을 가진다.
interface FlipStage extends PixelStage<"flip", "RGBA8", "RGBA8"> {
  readonly direction: Direction;
}
type AnyStageWithFlip = AnyStage | FlipStage;

function flipStage(direction: Direction): FlipStage {
  return {
    kind: "flip",
    direction,
    in: "RGBA8",
    out: "RGBA8",
    run: (source) => {
      // 입력을 제자리에서 바꾸지 않는 저장소의 보장을 지키려고 결과 버퍼를 새로 만든다.
      const out = new Uint8ClampedArray(source.data.length);

      // 대상 좌표를 차례로 돌며, 그 자리에 들어올 원본 좌표만 방향에 따라 재배치한다.
      for (let y = 0; y < source.height; y += 1) {
        for (let x = 0; x < source.width; x += 1) {
          const [sourceX, sourceY] = remapCoord(
            x,
            y,
            source.width,
            source.height,
            direction,
          );
          copyPixel(source, sourceX, sourceY, out, source.width, x, y);
        }
      }

      return makeImageBuffer(out, source.width, source.height);
    },
  };
}

// 두 방향 생성자는 같은 flipStage 하나에 direction만 다르게 넘긴 결과다.
function flipHorizontalStage(): FlipStage {
  return flipStage("horizontal");
}

function flipVerticalStage(): FlipStage {
  return flipStage("vertical");
}

// 새 스테이지를 유니온에 넣고도 실행기의 case를 추가하지 않은 순간을 컴파일되는 예제로 남긴다.
function describeStageMissingFlip(stage: AnyStageWithFlip): string {
  switch (stage.kind) {
    case "invert":
      return "반전";
    case "grayscale":
      return "그레이스케일";
    case "brightness":
      return `밝기 ${stage.amount}`;
    case "contrast":
      return `대비 ${stage.amount}`;
    // codeStep 437 — 여기서 빠뜨리는 종류는 계속 flip 하나뿐이어야 한다.
    case "threshold":
      return `임계값 ${stage.level}`;
    // codeStep 438 — saturate까지 처리해야 default에 FlipStage만 남는다.
    case "saturate":
      return `채도 ${stage.factor}`;
    // codeStep 443 — 여기까지 처리하면 의도대로 default에는 계속 FlipStage 하나만 남는다.
    case "convolve":
      return `컨볼루션 ${stage.effect} ${stage.side}x${stage.side}`;
    default: {
      // flip을 처리하지 않았으므로 여기의 stage는 FlipStage로 남아 never에 대입할 수 없다.
      // @ts-expect-error — flip을 처리하지 않아 stage가 FlipStage로 남는다
      const exhaustive: never = stage;
      throw new Error(`처리하지 않은 스테이지: ${JSON.stringify(exhaustive)}`);
    }
  }
}

// flip case까지 추가하면 default에 남는 값이 다시 없어져 억제 주석 없이 검사를 통과한다.
function describeStageWithFlip(stage: AnyStageWithFlip): string {
  switch (stage.kind) {
    case "invert":
      return "반전";
    case "grayscale":
      return "그레이스케일";
    case "brightness":
      return `밝기 ${stage.amount}`;
    case "contrast":
      return `대비 ${stage.amount}`;
    // codeStep 437 — flip을 포함한 실행기도 임계값 스테이지를 빠짐없이 설명한다.
    case "threshold":
      return `임계값 ${stage.level}`;
    // codeStep 438 — 모든 종류를 처리해야 default가 다시 never로 좁혀진다.
    case "saturate":
      return `채도 ${stage.factor}`;
    // codeStep 443 — flip을 아는 실행기도 새 컨볼루션 종류를 빠뜨리지 않는다.
    case "convolve":
      return `컨볼루션 ${stage.effect} ${stage.side}x${stage.side}`;
    case "flip":
      return `뒤집기 ${stage.direction}`;
    default: {
      // 스테이지 종류를 늘리면 실행기가 컴파일 단계에서 먼저 깨진다.
      // 이것이 닫힌 판별 유니온 하나로 스테이지 목록을 모아 둔 핵심 이유다.
      const exhaustive: never = stage;
      throw new Error(`처리하지 않은 스테이지: ${JSON.stringify(exhaustive)}`);
    }
  }
}

// codeStep 430 — pipeline의 인자를 최소 한 개 이상의 스테이지를 담는 가변 인자 튜플로 받는다.
// 배열 타입으로 뭉개지지 않으므로 Stages는 [InvertStage, GrayscaleStage]처럼
// 호출 위치마다 각 원소의 타입과 순서를 그대로 보존해 추론된다.
function pipeline<Stages extends readonly [AnyStage, ...AnyStage[]]>(
  ...stages: Stages
): PipelineResult<Stages> {
  const first = stages[0];
  const last = stages[stages.length - 1];
  // 런타임에서는 첫 입력과 마지막 출력이 분명하지만, 컴파일러는 이 객체가 재귀 조건부 타입의
  // 성공 분기를 만족한다는 사실까지 구조적으로 증명할 수 없다. 구현 경계에서 그 간극만 단언한다.
  return { in: first.in, out: last.out } as PipelineResult<Stages>;
}

// Stages는 [InvertStage, GrayscaleStage] 튜플로 추론된다.
const previewPipeline = pipeline(invertStage(), grayscaleStage());

// plan은 readonly AnyStage[]라서 원소별 위치 정보와 "최소 한 개"라는 보장을 잃었다.
// 호출하지 않는 데모 안에 두어 런타임에는 영향을 주지 않되, 배열 spread의 실패는 계속 검사한다.
function spreadPlanArrayDemo(): void {
  // @ts-expect-error — TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
  pipeline(...plan);
}

// codeStep 432 — 불일치를 never로 지우지 않고, 기대 포맷과 실패한 스테이지의 이름을 타입에 남긴다.
// 바로 아래 CheckAdjacent가 이 타입을 돌려주므로, 읽는 순서를 위해 codeStep 431보다 앞에 두었다.
// never는 "무언가 잘못됐다"는 것만 말하고 무엇이 잘못됐는지는 지워 버린다.
interface PipelineMismatch<Expected extends PixelFormat, Failing extends AnyStage> {
  readonly error: "PIPELINE_FORMAT_MISMATCH";
  readonly expectedFormat: Expected;
  readonly failingStage: Failing["kind"];
}

// codeStep 431 — 튜플의 머리와 꼬리를 분리하며 인접한 스테이지의 포맷을 차례로 검사한다.
// Head의 입력이 지금까지 누적한 포맷 Acc와 맞으면, Head의 출력을 새 Acc로 삼아 Tail을 계속 훑는다.
// 튜플이 비면 더 검사할 인접 쌍이 없으므로 그 시점의 Acc가 곧 파이프라인 전체의 출력 포맷이다.
type CheckAdjacent<Stages extends readonly AnyStage[], Acc extends PixelFormat> =
  Stages extends readonly [infer Head extends AnyStage, ...infer Tail extends AnyStage[]]
    ? Head["in"] extends Acc
      ? CheckAdjacent<Tail, Head["out"]>
      : PipelineMismatch<Acc, Head>
    : Acc;

// GoodResult는 모든 인접 관계를 통과한 뒤 마지막 출력인 "Gray8"이 된다.
type GoodResult = CheckAdjacent<[InvertStage, GrayscaleStage], "RGBA8">;

// BadResult의 호버는 인터페이스 이름을 보존해 PipelineMismatch<"Gray8", BrightnessStage>로 표시된다.
// 구조를 펼친 객체 모양이 아니라 이름과 타입 인자가 그대로 남는다는 것이 이 타입의 값이다 —
// 기대한 포맷("Gray8")과 그것을 받지 못한 스테이지(BrightnessStage)가 진단에 그대로 실린다.
type BadResult = CheckAdjacent<[GrayscaleStage, BrightnessStage], "RGBA8">;

// codeStep 433 — 첫 입력에서 검사를 시작해 성공하면 전체 입출력을, 실패하면 오류 타입을 돌려준다.
type PipelineResult<Stages extends readonly [AnyStage, ...AnyStage[]]> =
  CheckAdjacent<Stages, Stages[0]["in"]> extends PixelFormat
    ? {
        readonly in: Stages[0]["in"];
        readonly out: CheckAdjacent<Stages, Stages[0]["in"]>;
      }
    : CheckAdjacent<Stages, Stages[0]["in"]>;

interface RunnablePipeline<In extends PixelFormat, Out extends PixelFormat> {
  readonly in: In;
  readonly out: Out;
}

// run은 구체적인 스테이지 목록을 알 필요 없이, 검사를 통과해 in과 out을 가진 결과만 받는다.
function run<In extends PixelFormat, Out extends PixelFormat>(
  p: RunnablePipeline<In, Out>,
): void {
  console.log(`파이프라인: ${p.in} -> ${p.out}`);
}

// 잘못 연결한 체인의 진단도 컴파일되는 교육용 증거로 남기되, 호출하지 않아 출력은 더럽히지 않는다.
function brokenPipelineDemo(): void {
  // TS2739: Type 'PipelineMismatch<"Gray8", BrightnessStage>' is missing the following properties from type 'RunnablePipeline<PixelFormat, PixelFormat>': in, out
  // @ts-expect-error — 포맷이 어긋난 결과에는 RunnablePipeline이 요구하는 in과 out이 없다.
  run(pipeline(grayscaleStage(), brightnessStage(20)));
}

// codeStep 434 — 네 효과가 함께 쓸 픽셀 순회와 그레이스케일 커널을 만든다.
// 포맷마다 픽셀 하나가 몇 자리인지를 타입으로 고정한다.
interface PixelTupleOf {
  RGBA8: readonly [number, number, number, number];
  RGB8: readonly [number, number, number];
  Gray8: readonly [number];
}

type Pixel<Format extends PixelFormat> = PixelTupleOf[Format];

// 커널은 입력 픽셀 하나를 받아 출력 픽셀 하나를 돌려주는 함수 그 자체다.
type PixelKernel<In extends PixelFormat, Out extends PixelFormat> = (
  pixel: Pixel<In>,
) => Pixel<Out>;

function mapPixels<In extends PixelFormat, Out extends PixelFormat>(
  source: ImageBuffer<In>,
  outFormat: Out,
  kernel: PixelKernel<In, Out>,
): ImageBuffer<Out> {
  // codeStep 439 — 효과 매개변수는 스테이지 생성자가 이미 한 번 검사했다.
  // 모든 픽셀이 지나는 공유 순회에서는 같은 범위 검사를 반복하지 않는다.
  const pixelCount = source.width * source.height;

  // In은 런타임에 지워지는 팬텀 타입이라 bytesPerPixel에 넘길 포맷 값이 없다.
  // 그래서 입력 한 픽셀의 바이트 수는 버퍼 전체 길이를 픽셀 수로 나누어 되찾는다.
  // 출력 포맷은 실제 인자로 받았으므로 기존 bytesPerPixel을 그대로 사용할 수 있다.
  const inBytes = source.data.length / pixelCount;
  const outBytes = bytesPerPixel(outFormat);
  const out = new Uint8ClampedArray(pixelCount * outBytes);

  for (let i = 0; i < pixelCount; i += 1) {
    const start = i * inBytes;
    // In이 아직 미해결인 제네릭이라 Pixel<In>의 후보 튜플 길이가 충돌해 never로 줄어든다.
    // 이 구현 경계에서만 unknown을 거치는 이중 단언으로, 실제 버퍼에서 자른 한 픽셀임을 알려 준다.
    const pixel = Array.from(source.data.slice(start, start + inBytes)) as unknown as Pixel<In>;
    // readonly 튜플도 ArrayLike<number>를 만족하므로 set에는 별도 단언이 필요 없다.
    // Uint8ClampedArray에 쓰는 순간 범위를 벗어난 채널 값도 자동으로 0~255에 맞춰진다.
    out.set(kernel(pixel), i * outBytes);
  }

  // 픽셀 포맷과 데이터 길이는 달라져도 이미지의 공간 크기는 그대로 보존한다.
  return makeImageBuffer<Out>(out, source.width, source.height);
}

// codeStep 437 — 그레이스케일과 임계값이 같은 밝기 정의를 공유하도록 계산을 한곳에 모은다.
function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const toGrayscale: PixelKernel<"RGBA8", "Gray8"> = ([r, g, b]) => [
  // Gray8 채널 하나로 저장하는 그레이스케일만 여기서 밝기를 정수로 반올림한다.
  Math.round(luma(r, g, b)),
];

// Stage는 여전히 "무엇을 할지"만 말하는 데이터이고, PixelStage는 거기에 "어떻게 할지"를 더한다.
interface PixelStage<Kind extends string, In extends PixelFormat, Out extends PixelFormat>
  extends Stage<Kind, In, Out> {
  readonly run: (source: ImageBuffer<In>) => ImageBuffer<Out>;
}

// run을 얹어도 describeStage의 소진 검사와 CheckAdjacent/pipeline의 포맷 검사는 그대로 동작한다.
// 그 타입들은 스테이지의 kind·in·out만 읽고, 새 함수 프로퍼티의 구체적인 내용에는 의존하지 않는다.
// 또한 JSON.stringify는 함수 값 프로퍼티를 생략하므로 기존 plan 출력도 한 글자도 달라지지 않는다.

// codeStep 435 — 출력 포맷은 그대로 두고 채널 값만 바꾸는 세 커널을 더한다.
// 그레이스케일만 출력 포맷이 Gray8로 바뀌므로 변환을 드러내는 toGrayscale이라는 이름을 쓴다.
// 나머지는 커널과 스테이지 생성자를 눈으로 구분할 수 있게 Pixel/Kernel 접미사를 붙인다.
const invertPixel: PixelKernel<"RGBA8", "RGBA8"> = ([r, g, b, a]) => [
  255 - r,
  255 - g,
  255 - b,
  a,
];

// 밝기와 대비는 스테이지의 amount마다 다른 커널을 만들어야 하므로 커널 팩토리로 표현한다.
const brightnessKernel = (delta: number): PixelKernel<"RGBA8", "RGBA8"> =>
  ([r, g, b, a]) => [r + delta, g + delta, b + delta, a];

const contrastKernel = (factor: number): PixelKernel<"RGBA8", "RGBA8"> =>
  ([r, g, b, a]) => [
    (r - 128) * factor + 128,
    (g - 128) * factor + 128,
    (b - 128) * factor + 128,
    a,
  ];

// codeStep 437 — 밝기가 level 이상이면 흰색, 미만이면 검은색으로 가르되 알파는 보존한다.
// codeStep 439 — level은 thresholdStage가 이미 검사하므로 커널은 픽셀마다 다시 검사하지 않는다.
const thresholdKernel = (level: number): PixelKernel<"RGBA8", "RGBA8"> =>
  ([r, g, b, a]) => {
    const channel = luma(r, g, b) >= level ? 255 : 0;
    return [channel, channel, channel, a];
  };

// codeStep 438 — 원래 채널과 회색 사이의 거리를 factor만큼 벌려 채도를 조절한다.
// factor 0은 그레이스케일, 1은 원본, 1보다 크면 색 차이가 더 벌어져 색이 진해진다.
// codeStep 439 — factor 역시 saturateStage가 한 번 검사했으므로 커널에서는 계산만 한다.
const saturateKernel = (factor: number): PixelKernel<"RGBA8", "RGBA8"> =>
  ([r, g, b, a]) => {
    const gray = luma(r, g, b);
    return [
      gray + (r - gray) * factor,
      gray + (g - gray) * factor,
      gray + (b - gray) * factor,
      a,
    ];
  };

// codeStep 441 — 컨볼루션의 중간 결과만큼은 8비트 이미지 버퍼와 다른 표현이 필요하다.
// 스크래치 버퍼는 중간 결과를 8비트로 반올림하지 않고 그대로 들고 있어야 한다.
interface ScratchBuffer {
  readonly data: Float64Array;
  readonly width: number;
  readonly height: number;
}

// 박스 커널은 가로 한 번, 세로 한 번으로 나눌 수 있다. 축 유니온은 두 순회의 방향을 제한한다.
type ConvolveAxis = "row" | "column";

// codeStep 442 — 이미지 밖 이웃을 안으로 되돌리는 방법은 참·거짓이 아니라 세 정책 중 하나다.
type EdgePolicy = "clamp" | "wrap" | "mirror";

// codeStep 444 — 플립 방향을 유니온으로 닫아 좌표 재배치가 모든 방향을 처리하게 한다.
type Direction = "horizontal" | "vertical";

// codeStep 448 — 회전은 90·180·270도라는 닫힌 각도 집합에서 하나를 고른다.
// 90도와 270도는 너비와 높이까지 맞바꾸므로, 크기를 보존하는 플립의 Direction에 섞지 않는다.
// 별도 유니온으로 두어 remapCoord의 "같은 크기 안에서 재배치한다"는 계약을 그대로 지킨다.
type Rotation = "90" | "180" | "270";

// codeStep 449 — 회전도 실행기가 받을 수 있도록 포맷 관점의 스테이지로 편입한다.
interface RotateStage extends PixelStage<"rotate", "RGBA8", "RGBA8"> {
  readonly rotation: Rotation;
}

// AnyStage와 AnyStageWithFlip은 이전 화의 소진 검사 스냅샷이므로 그대로 두고,
// 회전까지 실행할 새 유니온을 별도로 만든다.
type ExecutableStage = AnyStageWithFlip | RotateStage;

// Stage<Kind, In, Out>은 픽셀 포맷만 표현하고 크기 W·H는 표현하지 못한다. 따라서 유니온에
// 들어온 회전 결과는 ImageBuffer<"RGBA8">, 즉 W = H = number로 뭉개져 크기 교환 정보가 사라진다.
// 크기를 타입에 남기려면 rotate90·rotate180·rotate270을 직접 부르고, 실행기 체인에 넣을 때는
// 그 정보를 포기한다. 정밀한 크기 API와 공통 실행기 API가 함께 존재하는 이유가 이 차이다.

// codeStep 451 — ep_445의 describeStageWithFlip은 AnyStageWithFlip용 소진 검사 스냅샷으로
// 얼어붙어 있고 유니온도 다르므로 재사용하지 않고, 회전까지 아는 새 설명기를 만든다.
function describeExecutableStage(stage: ExecutableStage): string {
  switch (stage.kind) {
    case "invert":
      return "반전";
    case "grayscale":
      return "그레이스케일";
    case "brightness":
      return `밝기 ${stage.amount}`;
    case "contrast":
      return `대비 ${stage.amount}`;
    case "threshold":
      return `임계값 ${stage.level}`;
    case "saturate":
      return `채도 ${stage.factor}`;
    case "convolve":
      return `컨볼루션 ${stage.effect} ${stage.side}x${stage.side}`;
    case "flip":
      return `뒤집기 ${stage.direction}`;
    case "rotate":
      return `회전 ${stage.rotation}도`;
  }
  // runStage와 이 함수는 같은 ExecutableStage 유니온 위에 서 있고 둘 다 default가 없다.
  // 종류를 하나 더하면 두 함수가 함께 TS2366을 내므로, 설명 목록과 실행 목록이 갈라지지 않게
  // 하는 것은 개발자의 규율이 아니라 반환 경로를 소진하는 타입 검사다.
}

// 이미 만들어진 스테이지 데이터만 읽으므로 디코딩·인코딩·픽셀 연산도, 실행 카운터 변경도 없다.
function planPipeline(stages: readonly ExecutableStage[]): string[] {
  return stages.map((stage, index) => `${index + 1}. ${describeExecutableStage(stage)}`);
}

function resolveAxisCoord(v: number, limit: number, policy: EdgePolicy): number {
  switch (policy) {
    case "clamp":
      return Math.max(0, Math.min(limit - 1, v));
    case "wrap":
      // 나머지를 한 번 더 보정하면 음수나 폭보다 훨씬 큰 좌표도 항상 0 이상으로 돌아온다.
      return ((v % limit) + limit) % limit;
    case "mirror": {
      // 길이가 1이면 대칭시킬 안쪽 픽셀이 없으므로 유일한 좌표 0만 돌려준다.
      if (limit === 1) {
        return 0;
      }

      // 가장자리 픽셀을 겹쳐 쓰지 않는 mirror의 한 주기는 0…끝…0까지인 2×(limit-1)이다.
      // 주기 안으로 먼저 접은 뒤 후반부를 다시 뒤집으므로 아무리 먼 좌표도 반복 대칭된다.
      const period = 2 * (limit - 1);
      const folded = ((v % period) + period) % period;
      return folded < limit ? folded : period - folded;
    }
    default: {
      // 유니온에 네 번째 정책을 더하면 여기서 컴파일이 먼저 깨진다. 값만 늘리고 처리를
      // 빠뜨리는 일을 타입 검사기가 막아 주므로, 정책이 늘어도 이 함수는 조용히 틀리지 않는다.
      const exhaustive: never = policy;
      throw new Error(`처리하지 않은 가장자리 정책: ${String(exhaustive)}`);
    }
  }
}

function clampCoord(
  x: number,
  y: number,
  width: number,
  height: number,
  policy: EdgePolicy,
): readonly [number, number] {
  return [resolveAxisCoord(x, width, policy), resolveAxisCoord(y, height, policy)];
}

function remapCoord(
  x: number,
  y: number,
  width: number,
  height: number,
  direction: Direction,
): readonly [number, number] {
  switch (direction) {
    case "horizontal":
      return [width - 1 - x, y];
    case "vertical":
      return [x, height - 1 - y];
    default: {
      // 방향을 추가하고 좌표 계산을 빠뜨리면 이 소진 검사에서 컴파일이 먼저 깨진다.
      const exhaustive: never = direction;
      throw new Error(`처리하지 않은 플립 방향: ${String(exhaustive)}`);
    }
  }
}

// 결과의 (ox, oy)가 값을 가져올 원본 좌표를 반환한다. 정방향으로 픽셀을 밀지 않고
// 역좌표를 구하면 결과 배열을 빈틈이나 중복 없이 행 우선 순서로 한 번만 채울 수 있다.
function rotateCoord(
  ox: number,
  oy: number,
  sourceWidth: number,
  sourceHeight: number,
  rotation: Rotation,
): readonly [number, number] {
  switch (rotation) {
    case "90":
      return [oy, sourceHeight - 1 - ox];
    case "180":
      return [sourceWidth - 1 - ox, sourceHeight - 1 - oy];
    case "270":
      return [sourceWidth - 1 - oy, ox];
    default: {
      // 각도를 추가하고 역좌표 계산을 빠뜨리면 이 소진 검사에서 컴파일이 먼저 깨진다.
      const exhaustive: never = rotation;
      throw new Error(`처리하지 않은 회전 각도: ${String(exhaustive)}`);
    }
  }
}

// codeStep 444 — 2차원 좌표를 평탄한 배열의 바이트 오프셋으로 바꾸는 유일한 자리다.
// 지금까지 이 식은 readPixel과 두 컨볼루션 순회에 따로따로 적혀 있었다. 픽셀을 옮기는 일이
// 곧 이 오프셋을 다시 계산하는 일이므로, 자리를 옮기기 전에 계산식부터 한곳으로 모은다.
// RGBA8 경로에서만 쓰이므로 픽셀당 바이트 수는 4로 고정이다.
function pixelIndex(width: number, x: number, y: number): number {
  return (y * width + x) * 4;
}

function readPixel(
  buf: ImageBuffer<"RGBA8">,
  x: number,
  y: number,
): Pixel<"RGBA8"> {
  const index = pixelIndex(buf.width, x, y);
  return [buf.data[index], buf.data[index + 1], buf.data[index + 2], buf.data[index + 3]];
}

function copyPixel(
  source: ImageBuffer<"RGBA8">,
  sourceX: number,
  sourceY: number,
  target: Uint8ClampedArray,
  targetWidth: number,
  targetX: number,
  targetY: number,
): void {
  const pixel = readPixel(source, sourceX, sourceY);
  // 읽을 때와 쓸 때 모두 같은 pixelIndex를 지난다. 두 자리에서 오프셋 계산이 어긋날 수 없다.
  // 회전은 원본의 높이가 대상의 너비가 되므로, 쓰기 오프셋은 원본 너비에 기대지 않고
  // 호출자가 넘긴 대상 너비로 계산한다. 플립은 두 너비가 같아 기존 동작을 그대로 유지한다.
  target.set(pixel, pixelIndex(targetWidth, targetX, targetY));
}

// codeStep 448 — 세 각도의 실제 픽셀 순회는 이 코어 하나만 맡는다. 180도만 크기를 유지하고
// 90·270도는 너비와 높이를 맞바꾸지만, 어느 경우든 결과 좌표에서 원본 좌표를 찾는 흐름은 같다.
// pixelIndex가 픽셀당 4바이트를 전제로 하므로 포맷은 제네릭으로 열지 않고 RGBA8로 고정한다.
// Gray8 같은 포맷까지 허용하면 타입은 통과해도 좌표별 바이트 오프셋이 조용히 틀어질 수 있다.
function rotatePixels(
  buf: ImageBuffer<"RGBA8">,
  rotation: Rotation,
): Uint8ClampedArray {
  const swapsDimensions = rotation !== "180";
  const outWidth = swapsDimensions ? buf.height : buf.width;
  const outHeight = swapsDimensions ? buf.width : buf.height;
  const out = new Uint8ClampedArray(buf.data.length);

  // 결과 좌표를 차례로 돌며 그 자리에 들어올 원본 좌표를 역으로 찾는다. 각도별 공식은
  // rotateCoord 한곳에만 있어, 세 공개 함수가 같은 이중 루프를 복사하지 않는다.
  for (let oy = 0; oy < outHeight; oy += 1) {
    for (let ox = 0; ox < outWidth; ox += 1) {
      const [sourceX, sourceY] = rotateCoord(
        ox,
        oy,
        buf.width,
        buf.height,
        rotation,
      );
      copyPixel(buf, sourceX, sourceY, out, outWidth, ox, oy);
    }
  }

  return out;
}

// codeStep 446 — 90도 회전은 픽셀 포맷과 바이트 수를 보존하지만 너비와 높이를 맞바꾼다.
// 스테이지 유니온에는 넣지 않고 평범한 함수로 두어, 크기를 보존하는 플립과 역할을 구분한다.
// codeStep 447 — 입력의 W·H를 결과의 H·W로 놓아 런타임의 크기 교환을 타입에도 그대로 기록한다.
function rotate90<W extends number, H extends number>(
  buf: ImageBuffer<"RGBA8", W, H>,
): ImageBuffer<"RGBA8", H, W> {
  // buf.height는 H, buf.width는 W이므로 이 순서로 makeImageBuffer에 넘기면 반환 타입도
  // ImageBuffer<"RGBA8", H, W>로 추론된다.
  return makeImageBuffer(rotatePixels(buf, "90"), buf.height, buf.width);
}

// codeStep 448 — 270도도 직사각형의 두 축을 맞바꾸므로 90도와 같은 H·W 반환 타입을 가진다.
function rotate270<W extends number, H extends number>(
  buf: ImageBuffer<"RGBA8", W, H>,
): ImageBuffer<"RGBA8", H, W> {
  return makeImageBuffer(rotatePixels(buf, "270"), buf.height, buf.width);
}

// 180도는 두 축을 뒤집어도 각 축의 길이는 그대로다. 반환 타입에서도 W·H의 자리를 보존한다.
function rotate180<W extends number, H extends number>(
  buf: ImageBuffer<"RGBA8", W, H>,
): ImageBuffer<"RGBA8", W, H> {
  return makeImageBuffer(rotatePixels(buf, "180"), buf.width, buf.height);
}

// codeStep 449 — 실행기용 회전은 각도를 데이터로 들고 다니며, 실행할 때도 기존 회전 코어를 쓴다.
function rotateStage(rotation: Rotation): RotateStage {
  return {
    kind: "rotate",
    rotation,
    in: "RGBA8",
    out: "RGBA8",
    run: (source) => {
      const swapsDimensions = rotation !== "180";
      return makeImageBuffer(
        rotatePixels(source, rotation),
        swapsDimensions ? source.height : source.width,
        swapsDimensions ? source.width : source.height,
      );
    },
  };
}

interface StageRun {
  readonly image: ImageBuffer<PixelFormat>;
  /** 이웃 픽셀을 읽어 제자리에서 계산할 수 없는 스테이지인가. */
  readonly readsNeighbors: boolean;
}

// 스테이지가 run을 들고 있어 어떤 함수를 부를지는 데이터가 이미 정해 두었다. 그래도 kind로
// 가르는 까닭은 실행 전에 알아야 하는 것이 run 바깥에 있기 때문이다 — 이 스테이지가 이웃을
// 읽어서 제자리 계산이 불가능한가. 픽셀 단위·이웃 읽기·좌표 재배치라는 세 묶음은 실행 준비가
// 달라지는 이유를 그대로 드러낸다.
function runStage(source: ImageBuffer<"RGBA8">, stage: ExecutableStage): StageRun {
  switch (stage.kind) {
    // 픽셀 하나만 읽어 픽셀 하나를 쓰는 커널 계열은 자기 자리만 보므로 이웃을 읽지 않는다.
    case "invert":
    case "grayscale":
    case "brightness":
    case "contrast":
    case "threshold":
    case "saturate":
      return { image: stage.run(source), readsNeighbors: false };
    // 컨볼루션만 이웃을 읽는다. 그래서 제자리에서 고치면 아직 읽지 않은 이웃이 오염된다
    // (codeStep 443의 inPlaceCorruptionDemo가 그 오염을 5×1 버퍼로 보여 주었다). 그중 분리
    // 순회로 도는 박스 블러는 중간값을 반올림하지 않으려고 Float64Array 스크래치까지 두 개 잡고,
    // 가우시안·샤픈은 일반 순회라 출력 배열 하나만 만든다 — 이 분류는 거기까지 가르지 않는다.
    case "convolve":
      return { image: stage.run(source), readsNeighbors: true };
    // 값은 그대로 두고 자리만 옮기는 좌표 재배치 계열이다.
    case "flip":
    case "rotate":
      return { image: stage.run(source), readsNeighbors: false };
  }
  // default를 두지 않은 것이 곧 소진 검사다. StageRun에는 undefined가 없으므로 유니온에 종류를
  // 더하고 case를 빠뜨리면 반환하지 않는 경로가 생겨 TS2366으로 컴파일이 먼저 깨진다.
  // default의 never로 검사하는 describeStage와 결과는 같지만, 여기서는 억제 주석 없이 스위치
  // 자체가 닫혀 있어야 한다. case 하나를 지우고 npx tsc --noEmit을 실행하면 차이를 볼 수 있다.
  // 반환 이미지를 PixelFormat으로 넓히는 이유는 grayscale만 Gray8을 내놓기 때문이다. 그래서 이
  // 함수는 다음 스테이지가 그 포맷을 받을 수 있는지까지는 말해 주지 않는다 — 앞뒤를 맞물리게 하는
  // 일은 목록을 만드는 쪽의 몫으로 남는다.
}

// codeStep 450 — 코덱 호출을 파이프라인의 바이트 경계 한곳에 모아 PNG는 시작과 끝에서만 만진다.
// 모든 스테이지가 새 이미지 배열을 반환하므로 실행 중에는 입력과 출력이 함께 있다가, 다음
// 단계로 넘어가면 앞 버퍼가 쓰레기가 된다. 이웃을 읽는 컨볼루션은 그 위에 중간 버퍼를 더 잡는다
// (분리 순회로 도는 박스 블러는 Float64Array 스크래치를 가로·세로 두 개).
// runStage가 돌려준 메타데이터를 세어 그런 스테이지가 체인에 몇 개였는지 실행 결과로 남긴다.
let decodeCount = 0;
let encodeCount = 0;
let neighborStageCount = 0;

function resetPipelineCounts(): void {
  decodeCount = 0;
  encodeCount = 0;
  neighborStageCount = 0;
}

function runPipeline(pngBytes: Buffer, stages: readonly ExecutableStage[]): Buffer {
  decodeCount += 1;
  const decoded = PNG.sync.read(pngBytes);
  let current: ImageBuffer<"RGBA8"> = makeImageBuffer(
    new Uint8ClampedArray(decoded.data),
    decoded.width,
    decoded.height,
  );
  let currentFormat: PixelFormat = "RGBA8";

  // codeStep 454 — 튜플로 받는 pipeline()은 CheckAdjacent로 인접 포맷을 컴파일 시점에 막는다.
  // 반면 이 실행기가 받는 배열은 명령줄 문자열에서 동적으로 만들어져 원소 순서를 컴파일 시점에
  // 알 수 없다. 그래서 같은 규칙을 실행 시점에 검사한다. 이 목록이 문자열에서 만들어지는 한
  // 검사를 컴파일 시점으로 되돌릴 수 없으며, 아래 단언은 바로 앞의 포맷 검사로 뒷받침된다.
  for (const [index, stage] of stages.entries()) {
    if (currentFormat !== stage.in) {
      throw new Error(
        `체인의 ${index + 1}번째 스테이지(${stage.kind})에서 실패했습니다: ` +
          `앞 단계가 ${currentFormat} 이미지를 넘겼는데 ${stage.in} 이미지를 기대합니다`,
      );
    }

    let result: StageRun;
    try {
      result = runStage(current, stage);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `체인의 ${index + 1}번째 스테이지(${stage.kind})에서 실패했습니다: ${message}`,
      );
    }

    if (result.readsNeighbors) {
      neighborStageCount += 1;
    }

    current = result.image as ImageBuffer<"RGBA8">;
    currentFormat = stage.out;
  }

  // colorType 6은 픽셀마다 네 바이트를 읽는다. Gray8의 한 바이트 배열을 그대로 건네면
  // 손상된 PNG가 생기므로, 인접성이 모두 맞아도 마지막 출력 포맷은 별도로 확인해야 한다.
  if (currentFormat !== "RGBA8") {
    throw new Error(
      `체인의 마지막 출력이 ${currentFormat}입니다. PNG로 인코딩하려면 RGBA8로 끝나야 합니다`,
    );
  }

  // 회전은 두 축을 맞바꾸므로 원본이 아니라 마지막 버퍼의 크기로 PNG를 만들어야 한다.
  const png = new PNG({ width: current.width, height: current.height, colorType: 6 });
  png.data.set(current.data);
  encodeCount += 1;
  return PNG.sync.write(png, { colorType: 6 });
}

// codeStep 454 — 실행 시점 포맷 검사가 실패 위치와 마지막 출력 문제를 각각 설명하는지
// 실제 PNG 바이트로 확인한다. 예외 자체를 흘리지 않고 메시지만 모아 관찰 출력 한 줄에 보탠다.
function rejectedPipelineFormatDemo(pngBytes: Buffer): string {
  const messages: string[] = [];
  const chains: readonly (readonly ExecutableStage[])[] = [
    [grayscaleStage(), invertStage()],
    [grayscaleStage()],
  ];

  for (const stages of chains) {
    try {
      runPipeline(pngBytes, stages);
    } catch (error) {
      messages.push(error instanceof Error ? error.message : String(error));
    }
  }

  return messages.join(" / ");
}

// convolve 하나를 빠뜨리면 반환 경로 검사가 실제로 실패한다는 컴파일되는 증거다.
function runStageMissingConvolve(
  source: ImageBuffer<"RGBA8">,
  stage: ExecutableStage,
  // @ts-expect-error — convolve를 처리하지 않아 값을 반환하지 않는 경로가 남는다 (TS2366)
): StageRun {
  switch (stage.kind) {
    case "invert":
    case "grayscale":
    case "brightness":
    case "contrast":
    case "threshold":
    case "saturate":
      return { image: stage.run(source), readsNeighbors: false };
    case "flip":
    case "rotate":
      return { image: stage.run(source), readsNeighbors: false };
  }
}

function sampleEdge(
  buf: ImageBuffer<"RGBA8">,
  x: number,
  y: number,
  policy: EdgePolicy,
): Pixel<"RGBA8"> {
  const [sampleX, sampleY] = clampCoord(x, y, buf.width, buf.height, policy);
  return readPixel(buf, sampleX, sampleY);
}

// 직접 순회와 분리 순회가 실제로 가중치 곱셈을 몇 번 수행했는지 같은 카운터로 비교한다.
let multiplyCount = 0;

function resetMultiplyCount(): void {
  multiplyCount = 0;
}

function convolve1D(
  source: ImageBuffer<"RGBA8"> | ScratchBuffer,
  size: number,
  axis: ConvolveAxis,
  edge: EdgePolicy = "clamp",
): ScratchBuffer {
  const out = new Float64Array(source.data.length);
  const radius = Math.floor(size / 2);
  // 박스 블러의 1차원 커널은 모든 자리의 무게가 같다. 평균을 뒤로 미루지 않고 가중치 자체에
  // 담아 두면 아래 곱셈 한 번이 곧 가중치 곱셈 한 번이라, 세는 횟수가 실제 연산과 일치한다.
  const weights = new Array<number>(size).fill(1 / size);

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let sum = 0;

        for (let tap = 0; tap < size; tap += 1) {
          const offset = tap - radius;
          const rawX = axis === "row" ? x + offset : x;
          const rawY = axis === "column" ? y + offset : y;
          // 정책 유니온이 한 축의 좌표를 결정하므로 같은 순회가 clamp·wrap·mirror를 모두 쓴다.
          const sampleX = resolveAxisCoord(rawX, source.width, edge);
          const sampleY = resolveAxisCoord(rawY, source.height, edge);
          const sampleIndex = pixelIndex(source.width, sampleX, sampleY) + channel;

          sum += source.data[sampleIndex] * weights[tap];
          multiplyCount += 1;
        }

        out[pixelIndex(source.width, x, y) + channel] = sum;
      }
    }
  }

  return { data: out, width: source.width, height: source.height };
}

function scratchToImage(scratch: ScratchBuffer): ImageBuffer<"RGBA8"> {
  // Float64Array를 최종 배열 생성자에 건네는 이 지점에서 처음이자 마지막 반올림·클램핑이 일어난다.
  return makeImageBuffer(
    new Uint8ClampedArray(scratch.data),
    scratch.width,
    scratch.height,
  );
}

// codeStep 441 — 5×5 박스 커널의 스물다섯 자리도 홀수의 제곱이라 Kernel 검사를 그대로 통과한다.
// 가중치가 모두 1이고 divisor가 25이므로, 이 커널을 한 번에 적용하는 것이 곧 5×5 평균이다.
const boxKernel5x5: Kernel<
  readonly [
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
  ]
> = {
  weights: [
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
  ],
  side: 5,
  divisor: 25,
};

// codeStep 441 — 검사를 통과한 정사각 커널을 각 픽셀 중앙에 놓고 한 번에 적용하는 일반 순회다.
// 분리 경로와 곱셈 횟수를 대조하려고 여기서 먼저 만들고, 뒤에서 가우시안·샤픈이 그대로 재사용한다.
function convolve(
  source: ImageBuffer<"RGBA8">,
  kernel: KernelShape<readonly number[]>,
  edge: EdgePolicy = "clamp",
): ImageBuffer<"RGBA8"> {
  const out = new Uint8ClampedArray(source.data.length);
  const radius = Math.floor(kernel.side / 2);

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let sum = 0;

        for (let kernelY = 0; kernelY < kernel.side; kernelY += 1) {
          for (let kernelX = 0; kernelX < kernel.side; kernelX += 1) {
            const sampleX = resolveAxisCoord(x + kernelX - radius, source.width, edge);
            const sampleY = resolveAxisCoord(y + kernelY - radius, source.height, edge);
            const sampleIndex = pixelIndex(source.width, sampleX, sampleY) + channel;
            const weightIndex = kernelY * kernel.side + kernelX;

            sum += source.data[sampleIndex] * kernel.weights[weightIndex];
            multiplyCount += 1;
          }
        }

        // 실수 누적값을 모두 구한 뒤 Uint8ClampedArray에 쓰는 이 순간 한 번만 반올림·클램핑한다.
        out[pixelIndex(source.width, x, y) + channel] = sum / kernel.divisor;
      }
    }
  }

  return makeImageBuffer(out, source.width, source.height);
}

function boxBlurSeparable(
  buf: ImageBuffer<"RGBA8">,
  size: number,
  edge: EdgePolicy = "clamp",
): ImageBuffer<"RGBA8"> {
  const rows = convolve1D(buf, size, "row", edge);
  const columns = convolve1D(rows, size, "column", edge);
  return scratchToImage(columns);
}

function maxChannelDifference(
  a: ImageBuffer<"RGBA8">,
  b: ImageBuffer<"RGBA8">,
): number {
  let maxDifference = 0;

  for (let i = 0; i < a.data.length; i += 1) {
    maxDifference = Math.max(maxDifference, Math.abs(a.data[i] - b.data[i]));
  }

  return maxDifference;
}

// codeStep 443 — 정수 리터럴 가중치를 그대로 두어 Kernel의 튜플 길이 검사를 보존한다.
// 1+2+1+2+4+2+1+2+1은 16이므로 마지막에 divisor 16으로 나누면 밝기 총량이 유지된다.
const gaussianKernel: Kernel<readonly [1, 2, 1, 2, 4, 2, 1, 2, 1]> = {
  weights: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  side: 3,
  divisor: 16,
};

// codeStep 443 — 샤픈 가중치 합은 1이라 이웃과의 차이를 키워도 전체 밝기 총량은 보존된다.
const sharpenKernel: Kernel<readonly [0, -1, 0, -1, 5, -1, 0, -1, 0]> = {
  weights: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  side: 3,
  divisor: 1,
};

// codeStep 443 — 아직 읽지 않은 이웃을 덮어쓰면 순회 뒤쪽 결과가 오염됨을 5×1 버퍼로 보인다.
function inPlaceCorruptionDemo(): string {
  const data = new Uint8ClampedArray(5 * 4);

  for (let x = 0; x < 5; x += 1) {
    data[x * 4 + 3] = 255;
  }
  data[2 * 4] = 255;

  const source: ImageBuffer<"RGBA8"> = makeImageBuffer(data, 5, 1);
  const correct = boxBlurSeparable(source, 3);
  const correctRed = Array.from({ length: 5 }, (_, x) => correct.data[x * 4]);

  // 잘못된 경로는 별도 출력 배열 없이 왼쪽부터 원본 빨강 채널 자리에 평균을 즉시 쓴다.
  // x=2부터는 왼쪽 이웃의 원래 0 대신 앞 순회가 써 버린 85를 읽어 113,38,13으로 번진다.
  const corrupted = new Uint8ClampedArray(source.data);
  for (let x = 0; x < 5; x += 1) {
    let sum = 0;
    for (let offset = -1; offset <= 1; offset += 1) {
      const sampleX = resolveAxisCoord(x + offset, 5, "clamp");
      sum += corrupted[sampleX * 4];
    }
    corrupted[x * 4] = sum / 3;
  }
  const corruptedRed = Array.from({ length: 5 }, (_, x) => corrupted[x * 4]);

  return `정상 ${correctRed.join(",")} / 오염 ${corruptedRed.join(",")}`;
}

// codeStep 436 — 같은 범위 밖 값을 두 정수 배열에 써서 클램핑과 래핑의 차이를 대조한다.
function clampingContrast(): string {
  const clamped = new Uint8ClampedArray(2);
  const wrapped = new Uint8Array(2);

  // Clamped 배열은 이미지 채널에 알맞게 0~255로 자르고, 일반 Uint8 배열은 256을 기준으로 감싼다.
  clamped[0] = 280;
  clamped[1] = -20;
  wrapped[0] = 280;
  wrapped[1] = -20;

  return (
    `Uint8ClampedArray 280→${clamped[0]}, -20→${clamped[1]} / ` +
    `Uint8Array 280→${wrapped[0]}, -20→${wrapped[1]}`
  );
}

function readPng(path: string | URL) {
  const png = PNG.sync.read(readFileSync(path));

  // colorType 6, 비트 깊이 8의 RGBA 레이아웃이므로 바이트 수는 정확히 폭 × 높이 × 4다.
  console.log(`width=${png.width} height=${png.height} bytes=${png.data.length}`);
  return png;
}

function writePng(
  path: string | URL,
  width: number,
  height: number,
  data: Uint8Array | Uint8ClampedArray,
): void {
  // 읽어서 얻은 RGBA 버퍼와 쓰는 PNG를 모두 colorType 6으로 맞춰 픽셀당 네 바이트를 유지한다.
  const png = new PNG({ width, height, colorType: 6 });
  png.data.set(data);
  writeFileSync(path, PNG.sync.write(png, { colorType: 6 }));
}

// -----------------------------------------------------------------------------
// codeStep 452 — 명령줄 플래그를 실행 가능한 스테이지로 바꾸는 CLI 경계
// -----------------------------------------------------------------------------

// codeStep 452 — 각 플래그는 뒤에서 소비할 인자 수와 스테이지 생성법을 한곳에 묶는다.
// 테이블을 읽는 쪽은 개별 플래그의 사정을 알 필요 없이 arity만큼 이동하면 된다.
interface FlagSpec {
  readonly arity: number;
  readonly build: (args: readonly string[]) => ExecutableStage;
}

// codeStep 452 — 명령줄의 숫자는 Number가 NaN이나 Infinity를 돌려줄 수 있으므로,
// 스테이지를 만들기 전에 어느 플래그의 어느 원문 값이 잘못됐는지 경계에서 밝혀 준다.
function parseNumericArg(raw: string, flag: string): number {
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`${flag}의 값은 유한한 숫자여야 합니다: ${raw}`);
  }

  return value;
}

// codeStep 452 — 사람이 짧게 쓰는 h와 v도 받아 내부의 닫힌 Direction 유니온으로 바꾼다.
function parseDirection(raw: string): Direction {
  if (raw === "horizontal" || raw === "h") {
    return "horizontal";
  }
  if (raw === "vertical" || raw === "v") {
    return "vertical";
  }

  throw new Error(`flip 방향은 horizontal, vertical, h, v 중 하나여야 합니다: ${raw}`);
}

// codeStep 452 — rotateStage는 Rotation 유니온만 받으므로 코드 안의 잘못된 각도는 타입이 막는다.
// 하지만 명령줄에서 들어온 값은 그냥 string이라 그 보호가 끝난다. 이 경계에서 사람이 다시
// 검사하고 좁혀야만 런타임 문자열도 타입이 약속한 "90" | "180" | "270"이 된다.
function parseRotation(raw: string): Rotation {
  if (raw === "90" || raw === "180" || raw === "270") {
    return raw;
  }

  throw new Error(`회전 각도는 90, 180, 270 중 하나여야 합니다: ${raw}`);
}

// codeStep 452 — as const로 키와 arity 리터럴을 보존하고, satisfies로 모든 항목이
// FlagSpec 모양인지 검사한다. 둘을 함께 써야 "얼리기"와 "모양 검사"를 모두 얻는다.
const FLAG_SPEC = {
  "--invert": {
    arity: 0,
    build: () => invertStage(),
  },
  "--grayscale": {
    arity: 0,
    build: () => grayscaleStage(),
  },
  "--brightness": {
    arity: 1,
    build: (args) => brightnessStage(parseNumericArg(args[0], "--brightness")),
  },
  "--contrast": {
    arity: 1,
    build: (args) => contrastStage(parseNumericArg(args[0], "--contrast")),
  },
  "--threshold": {
    arity: 1,
    build: (args) => thresholdStage(parseNumericArg(args[0], "--threshold")),
  },
  "--saturate": {
    arity: 1,
    build: (args) => saturateStage(parseNumericArg(args[0], "--saturate")),
  },
  "--blur": {
    arity: 1,
    build: (args) => boxBlurStage(parseNumericArg(args[0], "--blur")),
  },
  "--gaussian": {
    arity: 0,
    build: () => gaussianBlurStage(),
  },
  "--sharpen": {
    arity: 0,
    build: () => sharpenStage(),
  },
  "--flip": {
    arity: 1,
    build: (args) => flipStage(parseDirection(args[0])),
  },
  "--rotate": {
    arity: 1,
    build: (args) => rotateStage(parseRotation(args[0])),
  },
} as const satisfies Record<string, FlagSpec>;

// codeStep 453 — 실행 스테이지를 만드는 플래그와 CLI 자체의 선택을 나타내는 옵션은
// 서로 다른 표에 둔다. 옵션은 스테이지를 만들지 않으므로 소비할 인자 수만 알면 된다.
interface OptionSpec {
  readonly arity: number;
}

const OPTION_SPEC = {
  "--save": { arity: 1 },
  "--chain": { arity: 1 },
  "-o": { arity: 1 },
  "--plan": { arity: 0 },
} as const satisfies Record<string, OptionSpec>;

interface CliOptions {
  readonly save?: string;
  readonly chain?: string;
  readonly output?: string;
  readonly plan?: boolean;
}

// codeStep 452 — 런타임 문자열이 실제 테이블 키인지 확인한 사실을 타입 검사기에도 전달한다.
function isKnownFlag(flag: string): flag is keyof typeof FLAG_SPEC {
  // Object.prototype에서 물려받은 이름까지 플래그로 오해하지 않도록 자체 키만 검사한다.
  return Object.hasOwn(FLAG_SPEC, flag);
}

// codeStep 453 — 옵션 표도 런타임 문자열을 자신의 키 유니온으로 좁힌다.
function isKnownOption(flag: string): flag is keyof typeof OPTION_SPEC {
  return Object.hasOwn(OPTION_SPEC, flag);
}

// codeStep 453 — 한 줄에 섞인 CLI 옵션은 따로 모으고, 스테이지 파서가 읽을 나머지는
// 원래 순서대로 남겨 둔다. 같은 옵션을 두 번 쓰면 어느 경로가 최종 값인지 모호해지므로 거부한다.
function splitCliArgs(
  argv: readonly string[],
): { options: CliOptions; stageArgs: string[] } {
  const stageArgs: string[] = [];
  let save: string | undefined;
  let chain: string | undefined;
  let output: string | undefined;
  let plan: boolean | undefined;
  let index = 0;

  while (index < argv.length) {
    const token = argv[index];

    if (isKnownOption(token)) {
      const spec = OPTION_SPEC[token];
      const args = argv.slice(index + 1, index + 1 + spec.arity);
      if (args.length < spec.arity) {
        throw new Error(`${token}는 인자 ${spec.arity}개가 필요합니다`);
      }

      if (token === "--save") {
        if (save !== undefined) {
          throw new Error("--save는 한 번만 사용할 수 있습니다");
        }
        save = args[0];
      } else if (token === "--chain") {
        if (chain !== undefined) {
          throw new Error("--chain은 한 번만 사용할 수 있습니다");
        }
        chain = args[0];
      } else if (token === "-o") {
        if (output !== undefined) {
          throw new Error("-o는 한 번만 사용할 수 있습니다");
        }
        output = args[0];
      } else {
        if (plan !== undefined) {
          throw new Error("--plan은 한 번만 사용할 수 있습니다");
        }
        plan = true;
      }

      index += 1 + spec.arity;
      continue;
    }

    if (isKnownFlag(token)) {
      const spec = FLAG_SPEC[token];
      // 두 표가 같은 문자열 열을 나눠 읽는다. 스테이지 플래그와 그 인자를 통째로
      // 건너뛰어야 `--blur --save`의 --save를 별도 옵션으로 오해하지 않는다.
      stageArgs.push(...argv.slice(index, index + 1 + spec.arity));
      index += 1 + spec.arity;
      continue;
    }

    // 모르는 토큰은 스테이지 파서에 남겨, 기존처럼 알 수 없는 플래그 오류를 내게 한다.
    stageArgs.push(token);
    index += 1;
  }

  const options: CliOptions = {
    ...(save === undefined ? {} : { save }),
    ...(chain === undefined ? {} : { chain }),
    ...(output === undefined ? {} : { output }),
    ...(plan === undefined ? {} : { plan }),
  };
  return { options, stageArgs };
}

// codeStep 452 — 스펙의 arity만큼 인자를 소비하고 같은 순서로 스테이지를 쌓는다.
// 지금은 오류를 잡거나 process.exit를 부르지 않는다. codeStep 454에서 위치를 담은 사람이 읽기
// 좋은 메시지와 종료 코드로 바꿀 예정이므로, 이번 단계에서는 잡히지 않은 예외가 정상이다.
function parseFlags(argv: readonly string[]): ExecutableStage[] {
  const stages: ExecutableStage[] = [];
  let index = 0;

  while (index < argv.length) {
    const flag = argv[index];
    if (!isKnownFlag(flag)) {
      throw new Error(`알 수 없는 플래그: ${flag}`);
    }

    const spec = FLAG_SPEC[flag];
    const args = argv.slice(index + 1, index + 1 + spec.arity);
    if (args.length < spec.arity) {
      throw new Error(`${flag}는 인자 ${spec.arity}개가 필요합니다`);
    }

    stages.push(spec.build(args));
    index += 1 + spec.arity;
  }

  return stages;
}

// codeStep 453 — 실행 계획을 사람이 읽고 다시 건네줄 수 있는 JSON 파일로 보존한다.
function saveChain(stages: readonly ExecutableStage[], path: string): void {
  // JSON.stringify는 kind·in·out과 각 스테이지의 매개변수만 남기고 run 함수는 지운다.
  // JSON은 함수도 타입도 들고 다닐 수 없으므로 이 파일 하나만으로는 아무것도 실행할 수 없다.
  // 다시 읽는 경계에서 각 종류의 생성자를 불러 손실된 실행 함수를 채워야 한다.
  writeFileSync(path, JSON.stringify(stages, null, 2));
}

// codeStep 453 — JSON.parse의 unknown 값에서 필드를 읽을 수 있는 최소한 객체 경계다.
// 배열과 null도 typeof 결과가 object이므로 명시적으로 제외한다.
function asStageRecord(value: unknown, index: number): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`체인 파일 ${index + 1}번째 항목은 객체여야 합니다`);
  }

  return value as Record<string, unknown>;
}

function readNumberField(
  record: Record<string, unknown>,
  field: string,
  index: number,
): number {
  const value = record[field];
  if (typeof value !== "number") {
    throw new Error(`체인 파일 ${index + 1}번째 항목의 ${field}는 숫자여야 합니다`);
  }
  return value;
}

function readEdgePolicy(value: unknown, index: number): EdgePolicy {
  if (value === "clamp" || value === "wrap" || value === "mirror") {
    return value;
  }

  throw new Error(
    `체인 파일 ${index + 1}번째 항목의 edge는 clamp, wrap, mirror 중 하나여야 합니다`,
  );
}

// 생성자가 범위·정수·홀수 같은 불변식을 거부하면 파일의 몇 번째 값인지를 덧붙인다.
function rebuildStage(
  index: number,
  build: () => ExecutableStage,
): ExecutableStage {
  try {
    return build();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`체인 파일 ${index + 1}번째 항목: ${message}`);
  }
}

// codeStep 453 — 저장된 객체를 ExecutableStage로 단언하지 않고 kind로 갈래를 나눈 뒤
// 해당 생성자를 다시 부른다. 단언은 JSON.stringify가 지운 run을 만들어 내지 못해,
// run이 undefined인 객체가 실행기에 들어간 뒤 실행 순간에야 터지게 한다. 생성자 재호출만이
// 실행 함수를 되살리는 동시에 파일에서 온 값을 CLI에서 온 값과 같은 규칙으로 검사한다.
// 따라서 `--blur 4`가 명령줄에서 거부되듯 side: 4도 파일을 읽는 순간 거부된다.
// 입구가 둘이어도 검증을 생성자에 두었기 때문에 규칙은 하나로 유지된다.
function validateStage(value: unknown, index: number): ExecutableStage {
  const record = asStageRecord(value, index);
  const kind = record.kind;

  if (typeof kind !== "string") {
    throw new Error(`체인 파일 ${index + 1}번째 항목의 kind는 문자열이어야 합니다`);
  }

  switch (kind) {
    case "invert":
      return invertStage();
    case "grayscale":
      return grayscaleStage();
    case "brightness": {
      const amount = readNumberField(record, "amount", index);
      return rebuildStage(index, () => brightnessStage(amount));
    }
    case "contrast": {
      const amount = readNumberField(record, "amount", index);
      return rebuildStage(index, () => contrastStage(amount));
    }
    case "threshold": {
      const level = readNumberField(record, "level", index);
      return rebuildStage(index, () => thresholdStage(level));
    }
    case "saturate": {
      const factor = readNumberField(record, "factor", index);
      return rebuildStage(index, () => saturateStage(factor));
    }
    case "convolve": {
      const effect = record.effect;
      if (typeof effect !== "string") {
        throw new Error(`체인 파일 ${index + 1}번째 항목의 effect는 문자열이어야 합니다`);
      }

      const edge = readEdgePolicy(record.edge, index);
      switch (effect) {
        case "box": {
          const side = readNumberField(record, "side", index);
          return rebuildStage(index, () => boxBlurStage(side, edge));
        }
        case "gaussian":
          return gaussianBlurStage(edge);
        case "sharpen":
          return sharpenStage(edge);
        default:
          throw new Error(
            `체인 파일 ${index + 1}번째 항목의 convolve effect를 알 수 없습니다: ${effect}`,
          );
      }
    }
    case "flip": {
      const direction = record.direction;
      if (direction !== "horizontal" && direction !== "vertical") {
        throw new Error(
          `체인 파일 ${index + 1}번째 항목의 direction은 horizontal 또는 vertical이어야 합니다`,
        );
      }
      return flipStage(direction);
    }
    case "rotate": {
      const rotation = record.rotation;
      if (rotation !== "90" && rotation !== "180" && rotation !== "270") {
        throw new Error(
          `체인 파일 ${index + 1}번째 항목의 rotation은 90, 180, 270 중 하나여야 합니다`,
        );
      }
      return rotateStage(rotation);
    }
    default:
      throw new Error(`체인 파일 ${index + 1}번째 항목의 kind를 알 수 없습니다: ${kind}`);
  }
}

// codeStep 453 — JSON.parse의 반환값을 unknown으로 받아, 배열이라는 것을 확인한 뒤에만
// 각 항목을 검증 및 재구성 경계로 보낸다.
function loadChain(path: string): ExecutableStage[] {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("체인 파일의 최상위 값은 배열이어야 합니다");
  }

  const values: readonly unknown[] = parsed;
  return values.map((value, index) => validateStage(value, index));
}

// codeStep 452 — 문법 오류가 어느 경로에서 나도 같은 한 줄 사용법을 보여 준다.
const CLI_USAGE =
  "사용법: imgfx apply <입력파일> [스테이지 플래그…] [--save <파일>] [--chain <파일>] [-o <경로>] [--plan]";

// codeStep 454 — 명령줄과 체인 파일 중 하나에서 만든 배열을 실행기에 연결한다. --plan은
// 코덱을 전혀 부르지 않는 계획 전용 경로이고, -o가 없으면 기존처럼 계획과 JSON만 보는 드라이런이다.
function runCli(argv: readonly string[]): void {
  const command = argv[0];
  if (command !== "apply") {
    throw new Error(`지원하지 않는 명령: ${command ?? "(없음)"}\n${CLI_USAGE}`);
  }

  const inputPath = argv[1];
  if (inputPath === undefined) {
    throw new Error(`입력 파일이 필요합니다\n${CLI_USAGE}`);
  }

  const { options, stageArgs } = splitCliArgs(argv.slice(2));
  if (options.chain !== undefined && stageArgs.length > 0) {
    throw new Error("--chain과 스테이지 플래그는 함께 쓸 수 없습니다");
  }

  const stages = options.chain === undefined
    ? parseFlags(stageArgs)
    : loadChain(options.chain);
  const source = options.chain === undefined ? "명령줄" : `체인파일 ${options.chain}`;

  console.log(`CLI 입력 ${inputPath} / 출처 ${source} / 스테이지 ${stages.length}개`);

  if (options.plan === true) {
    // 계획만 보여 달라는 요청과 파일을 만들어 달라는 요청은 서로 어긋난다. 하나를 조용히
    // 무시하면 사용자는 만들어졌다고 믿은 파일이 없는 것을 나중에야 알게 되므로 여기서 막는다.
    if (options.output !== undefined || options.save !== undefined) {
      throw new Error("--plan은 -o·--save와 함께 쓸 수 없습니다");
    }

    resetPipelineCounts();
    console.log(`CLI 계획 ${planPipeline(stages).join(" / ")}`);
    console.log(`CLI 계획 실행 뒤 디코딩 ${decodeCount} / 인코딩 ${encodeCount}`);
    return;
  }

  console.log(`CLI 계획 ${planPipeline(stages).join(" / ")}`);
  // JSON.stringify는 run 함수 프로퍼티를 생략하며, loadChain이 생성자로 그 손실을 메운다.
  console.log(`CLI JSON ${JSON.stringify(stages)}`);

  if (options.save !== undefined) {
    saveChain(stages, options.save);
    console.log(`CLI 저장 ${options.save} / 스테이지 ${stages.length}개`);
  }

  if (options.output !== undefined) {
    resetPipelineCounts();
    const inputBytes = readFileSync(inputPath);
    const inputPng = PNG.sync.read(inputBytes);
    const outputBytes = runPipeline(inputBytes, stages);
    writeFileSync(options.output, outputBytes);

    // 반환값만 믿지 않고 방금 쓴 파일을 다시 열어, 디스크의 결과가 실제 PNG인지와 크기를 확인한다.
    const writtenBytes = readFileSync(options.output);
    const outputPng = PNG.sync.read(writtenBytes);
    console.log(
      `CLI 실행 ${options.output} / 디코딩 ${decodeCount} / 인코딩 ${encodeCount} / ` +
        `크기 ${inputPng.width}x${inputPng.height} -> ${outputPng.width}x${outputPng.height} / ` +
        `바이트 ${writtenBytes.length}`,
    );
  }
}

function main(): void {
  // codeStep 454 — 셸 스크립트와 CI는 종료 코드 0과 1로 성공과 실패를 가른다. 성공 경로는
  // Node의 기본값 0을 그대로 두고, 실패만 사람이 읽는 한 줄을 stderr로 보낸 뒤 1로 표시한다.
  const argv = process.argv.slice(2);
  if (argv.length > 0) {
    try {
      runCli(argv);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      // process.exit(1)은 아직 flush되지 않은 stdout·stderr를 자를 수 있다. exitCode만 세우면
      // Node가 남은 출력을 정상적으로 비운 뒤 같은 종료 코드를 셸에 돌려준다.
      process.exitCode = 1;
    }
    return;
  }

  // 모듈 맨 위에 있던 팬텀 관찰을 이 자리에서 부른다 — 출력 순서는 예전과 같다.
  observePhantomMismatch();

  // 직렬화 결과에는 data·width·height만 있고 타입 전용 팬텀 필드 __format은 어디에도 없다.
  console.log(JSON.stringify(rgba));
  console.log(`bytesPerPixel RGBA8=${rgbaSize} Gray8=${graySize}`);
  // 스테이지가 순수 데이터이므로 실행 전에 계획 자체를 그대로 관찰할 수 있다.
  console.log(`plan ${JSON.stringify(plan)}`);
  console.log(`describe ${plan.map(describeStage).join(" · ")}`);
  console.log(
    `describe with flip ${[...plan, flipStage("horizontal")]
      .map(describeStageWithFlip)
      .join(" · ")}`,
  );
  run(pipeline(invertStage(), grayscaleStage()));

  const decoded = readPng(INPUT_URL);

  // pngjs가 돌려주는 Buffer도 Uint8Array 계열이지만 ImageBuffer는 픽셀 연산에 쓸
  // Uint8ClampedArray를 요구하므로, 코덱과 파이프라인 경계에서 한 번만 복사해 표현을 맞춘다.
  const decodedImage: ImageBuffer<"RGBA8"> = makeImageBuffer(
    new Uint8ClampedArray(decoded.data),
    decoded.width,
    decoded.height,
  );
  console.log(
    `ImageBuffer RGBA8 ${decodedImage.width}x${decodedImage.height} bytes=${decodedImage.data.length}`,
  );

  writePng(OUTPUT_URL, decoded.width, decoded.height, decoded.data);

  // 방금 쓴 파일을 같은 함수로 다시 읽는다. 두 줄이 똑같이 찍히면 왕복이 성립한 것이다.
  readPng(OUTPUT_URL);

  // codeStep 434 — 1×1 버퍼로 공유 순회가 그레이스케일 커널 하나를 실행하는 모습을 확인한다.
  // 네 채널 모두 계산 결과가 0~255 안에 머무는 중간 톤 픽셀을 골라, 여기서는 커널의 계산만 보이게 한다.
  const samplePixel: ImageBuffer<"RGBA8"> = makeImageBuffer(
    new Uint8ClampedArray([200, 140, 90, 255]),
    1,
    1,
  );
  console.log(`그레이스케일 픽셀 ${Array.from(grayscaleStage().run(samplePixel).data)}`);
  // codeStep 435 — 나머지 세 효과도 같은 mapPixels를 지나며 건네는 커널만 달라진다.
  console.log(`반전 픽셀 ${Array.from(invertStage().run(samplePixel).data)}`);
  console.log(`밝기 50 픽셀 ${Array.from(brightnessStage(50).run(samplePixel).data)}`);
  console.log(`대비 1.5 픽셀 ${Array.from(contrastStage(1.5).run(samplePixel).data)}`);

  // codeStep 437 — 밝기가 약 152인 같은 픽셀이 기준 128에서는 흰색, 200에서는 검은색이 된다.
  console.log(`임계값 128 픽셀 ${Array.from(thresholdStage(128).run(samplePixel).data)}`);
  console.log(`임계값 200 픽셀 ${Array.from(thresholdStage(200).run(samplePixel).data)}`);

  // codeStep 438 — 채도 0의 세 채널은 위 그레이스케일 픽셀의 채널 값과 같아진다.
  console.log(`채도 0 픽셀 ${Array.from(saturateStage(0).run(samplePixel).data)}`);
  console.log(`채도 1 픽셀 ${Array.from(saturateStage(1).run(samplePixel).data)}`);
  console.log(`채도 1.8 픽셀 ${Array.from(saturateStage(1.8).run(samplePixel).data)}`);

  // codeStep 439 — 실패 둘은 try/catch로 모으고, 정상 level은 바로 실행되는 대조를 같은 줄에 둔다.
  console.log(
    `잘못된 매개변수 ${rejectedStageDemo()} / ` +
      `정상 임계값 128 픽셀 ${Array.from(thresholdStage(128).run(samplePixel).data)}`,
  );

  // codeStep 436 — 커널에 별도 Math.min/Math.max가 없어도 출력 배열이 범위를 보정함을 확인한다.
  // 빨강이 이미 230인 픽셀에 밝기 50을 더하면 280이 되어 그 채널 하나만 범위를 넘는다.
  // 나머지 두 채널은 그대로 더해지므로, 잘린 자리가 어디인지 출력에서 바로 가려진다.
  const brightPixel: ImageBuffer<"RGBA8"> = makeImageBuffer(
    new Uint8ClampedArray([230, 10, 40, 255]),
    1,
    1,
  );
  console.log(`밝기 50 넘침 픽셀 ${Array.from(brightnessStage(50).run(brightPixel).data)}`);
  console.log(`클램핑 대조 ${clampingContrast()}`);

  const decodedGrayscale = grayscaleStage().run(decodedImage);
  console.log(
    `실제 PNG 그레이스케일 크기 ${decodedImage.width}x${decodedImage.height} -> ` +
      `${decodedGrayscale.width}x${decodedGrayscale.height} bytes=${decodedImage.data.length} -> ` +
      `${decodedGrayscale.data.length}`,
  );

  // codeStep 440 — 리터럴 튜플의 길이 9가 3×3 커널의 런타임 값에도 그대로 대응한다.
  console.log(
    `커널 3x3 길이=${boxKernel3x3.weights.length} side=${boxKernel3x3.side} ` +
      `divisor=${boxKernel3x3.divisor}`,
  );

  // codeStep 441 — 검사된 5×5 커널을 한 번에 적용하는 순회와 1×5·5×1 분리 순회를
  // 같은 실제 PNG로 비교한다. 결과는 같고 곱셈 횟수만 달라야 한다.
  resetMultiplyCount();
  const directBoxBlur = convolve(decodedImage, boxKernel5x5);
  const directMultiplyCount = multiplyCount;
  resetMultiplyCount();
  const separableBoxBlur = boxBlurSeparable(decodedImage, 5);
  const separableMultiplyCount = multiplyCount;
  console.log(
    `박스 블러 5x5 곱셈 직접 ${directMultiplyCount} (픽셀·채널당 25) / ` +
      `분리 ${separableMultiplyCount} (10) / ` +
      `최대 채널 차이 ${maxChannelDifference(directBoxBlur, separableBoxBlur)}`,
  );

  // codeStep 442 — x=-1은 clamp면 첫 픽셀, wrap이면 마지막, mirror면 두 번째 픽셀이 된다.
  console.log(
    `가장자리 샘플 clamp ${Array.from(sampleEdge(decodedImage, -1, 0, "clamp"))} / ` +
      `wrap ${Array.from(sampleEdge(decodedImage, -1, 0, "wrap"))} / ` +
      `mirror ${Array.from(sampleEdge(decodedImage, -1, 0, "mirror"))}`,
  );
  const clampBoxBlur = boxBlurSeparable(decodedImage, 5, "clamp");
  const wrapBoxBlur = boxBlurSeparable(decodedImage, 5, "wrap");
  console.log(
    `가장자리 정책 차이 clamp vs wrap 최대 채널 차이 ` +
      `${maxChannelDifference(clampBoxBlur, wrapBoxBlur)}`,
  );

  // codeStep 443 — 1×1은 모든 이웃이 자기 자신이라 효과 차이가 사라지므로 3×3을 사용한다.
  // 중앙만 [200,120,40]이고 나머지는 검정이다. 가우시안 중앙 가중치 4를 divisor 16으로
  // 나누면 [50,30,10], 샤픈은 중앙을 5배 해 [1000,600,200]이 8비트에서 [255,255,200]이 된다.
  const impulseData = new Uint8ClampedArray(3 * 3 * 4);
  for (let pixel = 0; pixel < 9; pixel += 1) {
    impulseData[pixel * 4 + 3] = 255;
  }
  // codeStep 444 — 가운데 픽셀 (1, 1)의 자리도 손으로 적지 않고 pixelIndex로 구한다.
  impulseData.set([200, 120, 40, 255], pixelIndex(3, 1, 1));
  const impulseImage: ImageBuffer<"RGBA8"> = makeImageBuffer(impulseData, 3, 3);
  const gaussianImage = gaussianBlurStage().run(impulseImage);
  const sharpenedImage = sharpenStage().run(impulseImage);
  console.log(`가우시안 픽셀 ${Array.from(readPixel(gaussianImage, 1, 1))}`);
  console.log(`샤픈 픽셀 ${Array.from(readPixel(sharpenedImage, 1, 1))}`);

  // plan 배열에는 넣지 않고 이번 화의 세 스테이지만 별도 목록으로 만들어 기존 출력을 보존한다.
  const convolutionPlan: readonly ConvolveStage[] = [
    boxBlurStage(5),
    gaussianBlurStage(),
    sharpenStage(),
  ];
  console.log(`컨볼루션 계획 ${convolutionPlan.map(describeStage).join(" · ")}`);

  // 정상 경로와 제자리 덮어쓰기 경로의 두 줄을 한 데모 문자열로 받아 오염의 진행을 나란히 본다.
  console.log(`스크래치 버퍼 ${inPlaceCorruptionDemo()}`);

  // codeStep 444 — 10×20 격자의 (0,5)는 수평이면 오른쪽 끝 열 9로, 수직이면 아래쪽 행 14로 간다.
  // 두 결과 모두 같은 함수 하나가 direction만 보고 계산한 것이다.
  console.log(
    `좌표 재배치 10x20 (0,5) horizontal ` +
      `${JSON.stringify(remapCoord(0, 5, 10, 20, "horizontal"))} / ` +
      `vertical ${JSON.stringify(remapCoord(0, 5, 10, 20, "vertical"))}`,
  );

  // codeStep 445 — 빨강 채널만 뽑아 보면 픽셀이 어느 자리로 옮겨 갔는지가 숫자로 드러난다.
  const redChannels = (image: ImageBuffer<"RGBA8">): number[] =>
    Array.from({ length: image.width * image.height }, (_, pixel) => image.data[pixel * 4]);

  // 앞서 쓴 3×3 임펄스 버퍼는 중앙 대칭이라 뒤집어도 그대로다. 서로 다른 빨강 값 여섯 개를 가진
  // 3×2 비대칭 버퍼라야 두 방향이 실제로 무엇을 옮겼는지 눈에 보인다.
  const asymmetricData = new Uint8ClampedArray([
    10, 0, 0, 255, 20, 0, 0, 255, 30, 0, 0, 255,
    40, 0, 0, 255, 50, 0, 0, 255, 60, 0, 0, 255,
  ]);
  const asymmetricImage: ImageBuffer<"RGBA8"> = makeImageBuffer(asymmetricData, 3, 2);
  console.log(
    `플립 3x2 빨강 원본 ${redChannels(asymmetricImage)} / ` +
      `수평 ${redChannels(flipHorizontalStage().run(asymmetricImage))} / ` +
      `수직 ${redChannels(flipVerticalStage().run(asymmetricImage))}`,
  );

  // 같은 방향으로 두 번 뒤집으면 모든 픽셀이 제자리로 돌아온다. 실제 PNG에서 최대 채널 차이가
  // 0으로 나오는 것이 remapCoord의 좌표 계산이 맞다는 실행 시점 증거다.
  const horizontalFlipped = flipHorizontalStage().run(decodedImage);
  const verticalFlipped = flipVerticalStage().run(decodedImage);
  console.log(
    `두 번 뒤집기 원본과의 최대 채널 차이 ` +
      `수평 ${maxChannelDifference(decodedImage, flipHorizontalStage().run(horizontalFlipped))} / ` +
      `수직 ${maxChannelDifference(decodedImage, flipVerticalStage().run(verticalFlipped))}`,
  );

  // 이 화의 payoff — 자리만 바뀌고 너비·높이·바이트 수는 그대로다. 그래서 Stage의 in과 out이
  // 둘 다 "RGBA8"로 같고, 타입 안에서는 아무것도 달라지지 않는다.
  console.log(
    `플립 크기 ${decodedImage.width}x${decodedImage.height} -> ` +
      `${horizontalFlipped.width}x${horizontalFlipped.height} ` +
      `bytes=${decodedImage.data.length} -> ${horizontalFlipped.data.length}`,
  );

  // codeStep 446 — 3×2 비대칭 버퍼를 시계 방향으로 돌리면 왼쪽 아래의 40부터 새 첫 행이 된다.
  // 빨강 채널 여섯 개를 한 줄에 놓아 좌표 공식과 2×3 결과를 손으로 바로 대조할 수 있게 한다.
  const rotatedAsymmetric = rotate90(asymmetricImage);
  console.log(
    `회전 3x2 빨강 원본 ${redChannels(asymmetricImage)} / ` +
      `90도 ${redChannels(rotatedAsymmetric)}`,
  );

  // 실제 PNG도 같은 함수를 지나면 너비와 높이만 맞바뀌고 전체 픽셀 바이트 수는 그대로다.
  const rotatedDecoded = rotate90(decodedImage);
  console.log(
    `회전 크기 ${decodedImage.width}x${decodedImage.height} -> ` +
      `${rotatedDecoded.width}x${rotatedDecoded.height} ` +
      `bytes=${decodedImage.data.length} -> ${rotatedDecoded.data.length}`,
  );

  // codeStep 447 — 100×60 버퍼는 값뿐 아니라 타입에서도 두 리터럴을 정확히 들고 있다.
  const wide = makeImageBuffer<"RGBA8", 100, 60>(
    new Uint8ClampedArray(100 * 60 * 4),
    100,
    60,
  );

  // 회전 결과를 60×100 타입에 그대로 받을 수 있다 — 타입 인자가 자리를 바꿨다는 증거다.
  const tall: ImageBuffer<"RGBA8", 60, 100> = rotate90(wide);

  // @ts-expect-error — 회전 결과는 100×60이 아니라 60×100이라 대입이 막힌다
  const wrongSize: ImageBuffer<"RGBA8", 100, 60> = rotate90(wide);

  // codeStep 448 — 270도는 90도처럼 두 타입 인자의 자리를 바꾸고, 180도만 그대로 둔다.
  // 세 대입을 한자리에 놓으면 같은 100×60 입력에서 각도에 따른 타입 차이가 바로 드러난다.
  const rotated270Wide: ImageBuffer<"RGBA8", 60, 100> = rotate270(wide);
  const rotated180Wide: ImageBuffer<"RGBA8", 100, 60> = rotate180(wide);

  // @ts-expect-error — 180도 결과는 60×100이 아니라 원본과 같은 100×60이다
  const wrong180Size: ImageBuffer<"RGBA8", 60, 100> = rotate180(wide);

  // 타입에서 자리를 바꾼 두 숫자가 실행 중의 width·height와도 정확히 같은지 마지막 줄에서 확인한다.
  console.log(`회전 타입 크기 ${wide.width}x${wide.height} -> ${tall.width}x${tall.height}`);

  // 세 각도를 같은 비대칭 버퍼에 적용한다. 배열을 JSON으로 적어 행 경계와 각 결과 크기를
  // 한 줄에서 함께 읽으면 90·180·270도의 좌표 공식이 서로 어떻게 다른지 손으로 검산할 수 있다.
  const rotatedAsymmetric180 = rotate180(asymmetricImage);
  const rotatedAsymmetric270 = rotate270(asymmetricImage);
  console.log(
    `회전 대조 90 ${rotatedAsymmetric.width}x${rotatedAsymmetric.height} ` +
      `${JSON.stringify(redChannels(rotatedAsymmetric))} / ` +
      `180 ${rotatedAsymmetric180.width}x${rotatedAsymmetric180.height} ` +
      `${JSON.stringify(redChannels(rotatedAsymmetric180))} / ` +
      `270 ${rotatedAsymmetric270.width}x${rotatedAsymmetric270.height} ` +
      `${JSON.stringify(redChannels(rotatedAsymmetric270))}`,
  );

  // 실제 PNG를 한 바퀴가 되는 네 번의 90도와 제자리가 되는 두 번의 180도로 돌린다.
  // 두 비교는 모두 너비와 높이가 원본으로 돌아온 뒤라 maxChannelDifference의 크기 가정도 지킨다.
  const rotated90FourTimes = rotate90(rotate90(rotate90(rotate90(decodedImage))));
  const rotated180Twice = rotate180(rotate180(decodedImage));
  console.log(
    `회전 회귀 원본과의 최대 채널 차이 ` +
      `90도 네 번 ${maxChannelDifference(decodedImage, rotated90FourTimes)} / ` +
      `180도 두 번 ${maxChannelDifference(decodedImage, rotated180Twice)}`,
  );

  // codeStep 449 — 실행기에서는 크기 타입이 number로 넓어지지만, 실제 픽셀과 크기는 직접 호출과 같다.
  const executorRotation = runStage(decodedImage, rotateStage("90"));
  const executorRotated = executorRotation.image as ImageBuffer<"RGBA8">;
  console.log(
    `실행기 회전 직접 호출과 최대 채널 차이 ` +
      `${maxChannelDifference(rotatedDecoded, executorRotated)} / ` +
      `크기 ${decodedImage.width}x${decodedImage.height} -> ` +
      `${executorRotated.width}x${executorRotated.height}`,
  );

  // 분류 문자열을 손으로 적지 않고 각 스테이지를 실제로 실행한 결과의 메타데이터를 읽는다.
  const invertRun = runStage(asymmetricImage, invertStage());
  const convolveRun = runStage(asymmetricImage, gaussianBlurStage());
  const flipRun = runStage(asymmetricImage, flipHorizontalStage());
  console.log(
    `실행기 이웃 읽기 invert=${invertRun.readsNeighbors} ` +
      `convolve=${convolveRun.readsNeighbors} flip=${flipRun.readsNeighbors} ` +
      `rotate=${executorRotation.readsNeighbors}`,
  );

  // codeStep 450 — 다섯 단계가 파일 시스템을 모른 채 바이트 경계 안에서 한 번씩만 디코딩·인코딩된다.
  // Gray8은 RGBA8의 1/4 바이트라 colorType 6으로 바로 인코딩할 수 없으므로 이 체인에는 넣지 않는다.
  const pipelineStages: readonly ExecutableStage[] = [
    invertStage(),
    brightnessStage(20),
    boxBlurStage(3),
    flipHorizontalStage(),
    rotateStage("90"),
  ];
  resetPipelineCounts();
  const pipelineBytes = runPipeline(readFileSync(INPUT_URL), pipelineStages);
  const verifiedPipelinePng = PNG.sync.read(pipelineBytes);
  console.log(
    `바이트 파이프라인 디코딩 ${decodeCount} / 인코딩 ${encodeCount} / ` +
      `스테이지 ${pipelineStages.length} / 이웃 읽기 ${neighborStageCount} / ` +
      `크기 ${decoded.width}x${decoded.height} -> ` +
      `${verifiedPipelinePng.width}x${verifiedPipelinePng.height} / ` +
      `반환 바이트 ${pipelineBytes.length}`,
  );
  console.log(
    `반환 PNG 검증 ${verifiedPipelinePng.width}x${verifiedPipelinePng.height} ` +
      `bytes=${verifiedPipelinePng.data.length}`,
  );

  // codeStep 451 — 실행 때 쓴 같은 다섯 스테이지를 계획기에 넘겨 두 경로의 카탈로그를 일치시킨다.
  resetPipelineCounts();
  const pipelinePlan = planPipeline(pipelineStages);
  console.log(`실행 계획 ${pipelinePlan.join(" / ")}`);
  // runPipeline은 애초에 파일을 쓰지 않고 바이트를 돌려주므로 ls로는 두 경로를 구분할 수 없다.
  // 계획 호출 뒤에도 코덱 횟수가 0인 것이 디코딩·인코딩을 전혀 하지 않았다는 실행 시점 증거다.
  console.log(`계획 실행 뒤 디코딩 ${decodeCount} / 인코딩 ${encodeCount}`);

  // codeStep 454 — 배열 실행기의 두 런타임 포맷 검사를 기존 관찰 본문의 마지막 한 줄에 모은다.
  console.log(`실행기 포맷 거부 ${rejectedPipelineFormatDemo(readFileSync(INPUT_URL))}`);
}

main();
