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
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// 이미지 스테이지가 주고받을 수 있는 픽셀 포맷을 하나의 닫힌 집합으로 고정한다.
// 각 태그는 지난 시간에 고정한 PNG colorType과 정확히 하나씩 짝지어진다: RGBA8→6, RGB8→2, Gray8→0.
type PixelFormat = "RGBA8" | "RGB8" | "Gray8";

interface ImageBuffer<Format extends PixelFormat> {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  /** 타입에만 존재하는 표시. 실제 객체엔 절대 채우지 않는다 — 그래서 팬텀(phantom)이다. */
  readonly __format?: Format;
}

function makeImageBuffer<Format extends PixelFormat>(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ImageBuffer<Format> {
  // __format이 옵셔널이라 값을 넣지 않아도 구조적으로 ImageBuffer를 만족한다.
  // 포맷 정보는 런타임 객체를 더럽히지 않고 타입 검사에만 남는다.
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

// 팬텀 필드는 런타임에 존재하지 않으므로 아래 두 호출 모두 실행 중에는 그냥 돌아간다.
// 실제로 찍히는 bytes= 값이 1과 4로 갈리는 것이 바로 타입이 막으려던 그 어긋남이다.
// @ts-expect-error — Format이 "Gray8"과 "RGBA8"로 갈려 구조적으로 더 이상 같지 않다
requiresRgba(gray);

requiresRgba(rgba); // 통과 — 둘 다 ImageBuffer<"RGBA8">

// 실행 위치가 아니라 이 모듈의 위치를 기준으로 잡아 저장소 루트에서도 같은 파일을 읽고 쓴다.
const INPUT_URL = new URL("./photo.png", import.meta.url);
const OUTPUT_URL = new URL("./copy.png", import.meta.url);
const OUT_DIR = new URL("./out/", import.meta.url);

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

// 모든 스테이지를 하나의 판별 유니온으로 모으면 kind를 확인할 때 나머지 필드도 함께 좁혀진다.
type AnyStage = InvertStage | GrayscaleStage | BrightnessStage | ContrastStage;

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
  return {
    kind: "brightness",
    amount,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", brightnessKernel(amount)),
  };
}

function contrastStage(amount: number): ContrastStage {
  return {
    kind: "contrast",
    amount,
    in: "RGBA8",
    out: "RGBA8",
    run: (buf) => mapPixels(buf, "RGBA8", contrastKernel(amount)),
  };
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
    default: {
      // 모든 case를 처리했다면 이 지점의 stage에는 가능한 값이 없어 never로 좁혀진다.
      const exhaustive: never = stage;
      throw new Error(`처리하지 않은 스테이지: ${JSON.stringify(exhaustive)}`);
    }
  }
}

interface FlipStage extends Stage<"flip", "RGBA8", "RGBA8"> {}
type AnyStageWithFlip = AnyStage | FlipStage;

function flipStage(): FlipStage {
  // codeStep 435 — FlipStage는 이번 화의 픽셀 커널 대상에서 의도적으로 제외한다.
  // 뒤집기는 주변 픽셀의 위치까지 알아야 하는 기하 변환이라 픽셀 하나만 받는 커널로 표현하지 않는다.
  // 따라서 FlipStage는 이번 화에도 실행 함수가 없는 순수 Stage로 남는다.
  return { kind: "flip", in: "RGBA8", out: "RGBA8" };
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
    case "flip":
      return "뒤집기";
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

const toGrayscale: PixelKernel<"RGBA8", "Gray8"> = ([r, g, b]) => [
  Math.round(0.299 * r + 0.587 * g + 0.114 * b),
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

function saveImage(name: string, image: ImageBuffer<"RGBA8">): void {
  mkdirSync(OUT_DIR, { recursive: true });
  writePng(new URL(`${name}.png`, OUT_DIR), image.width, image.height, image.data);
  console.log(`저장 out/${name}.png`);
}

const grayToRgba: PixelKernel<"Gray8", "RGBA8"> = ([v]) => [v, v, v, 255];

function main(): void {
  // 직렬화 결과에는 data·width·height만 있고 타입 전용 팬텀 필드 __format은 어디에도 없다.
  console.log(JSON.stringify(rgba));
  console.log(`bytesPerPixel RGBA8=${rgbaSize} Gray8=${graySize}`);
  // 스테이지가 순수 데이터이므로 실행 전에 계획 자체를 그대로 관찰할 수 있다.
  console.log(`plan ${JSON.stringify(plan)}`);
  console.log(`describe ${plan.map(describeStage).join(" · ")}`);
  console.log(
    `describe with flip ${[...plan, flipStage()].map(describeStageWithFlip).join(" · ")}`,
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

  saveImage("grayscale", mapPixels(decodedGrayscale, "RGBA8", grayToRgba));
  saveImage("invert", invertStage().run(decodedImage));
  saveImage("brightness", brightnessStage(50).run(decodedImage));
  saveImage("contrast", contrastStage(1.5).run(decodedImage));
}

main();
