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

interface InvertStage extends Stage<"invert", "RGBA8", "RGBA8"> {}
interface GrayscaleStage extends Stage<"grayscale", "RGBA8", "Gray8"> {}
interface BrightnessStage extends Stage<"brightness", "RGBA8", "RGBA8"> {
  readonly amount: number;
}
interface ContrastStage extends Stage<"contrast", "RGBA8", "RGBA8"> {
  readonly amount: number;
}

// 모든 스테이지를 하나의 판별 유니온으로 모으면 kind를 확인할 때 나머지 필드도 함께 좁혀진다.
type AnyStage = InvertStage | GrayscaleStage | BrightnessStage | ContrastStage;

// 생성자 함수는 실행 로직이 아니라, 오타 없이 스테이지 데이터 한 건을 만드는 작은 도우미다.
function invertStage(): InvertStage {
  return { kind: "invert", in: "RGBA8", out: "RGBA8" };
}

function grayscaleStage(): GrayscaleStage {
  return { kind: "grayscale", in: "RGBA8", out: "Gray8" };
}

function brightnessStage(amount: number): BrightnessStage {
  return { kind: "brightness", amount, in: "RGBA8", out: "RGBA8" };
}

function contrastStage(amount: number): ContrastStage {
  return { kind: "contrast", amount, in: "RGBA8", out: "RGBA8" };
}

// 아직 실행기가 읽기 전인데도 계획 전체를 직렬화하거나 순서를 바꿀 수 있다.
const plan: readonly AnyStage[] = [invertStage(), brightnessStage(20), grayscaleStage()];

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

function main(): void {
  // 직렬화 결과에는 data·width·height만 있고 타입 전용 팬텀 필드 __format은 어디에도 없다.
  console.log(JSON.stringify(rgba));
  console.log(`bytesPerPixel RGBA8=${rgbaSize} Gray8=${graySize}`);
  // 스테이지가 순수 데이터이므로 실행 전에 계획 자체를 그대로 관찰할 수 있다.
  console.log(`plan ${JSON.stringify(plan)}`);

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
}

main();
