/*
 * 이 파일은 배포물이 아니라, imgfx 프로젝트가 지금까지 확인해 온 사실들을 한 번에
 * 찍어 보는 관찰 스크립트입니다. package.json의 files: ["dist"]와 tsconfig.json의
 * include: ["src"]가 배포와 빌드에서 함께 빼 주도록 src 밖에 둡니다.
 *
 * 실행 위치와 명령:
 *   cd projects/imgfx
 *   node observe.ts
 */
import { PNG } from "pngjs";
import { readFileSync } from "node:fs";
import {
  INPUT_URL,
  OUTPUT_URL,
  boxBlurSeparable,
  boxBlurStage,
  boxKernel3x3,
  boxKernel5x5,
  brightnessStage,
  clampingContrast,
  contrastStage,
  convolve,
  decodeCount,
  describeStage,
  describeStageWithFlip,
  encodeCount,
  flipHorizontalStage,
  flipStage,
  flipVerticalStage,
  gaussianBlurStage,
  graySize,
  grayscaleStage,
  inPlaceCorruptionDemo,
  invertStage,
  makeImageBuffer,
  maxChannelDifference,
  multiplyCount,
  neighborStageCount,
  observePhantomMismatch,
  pipeline,
  pixelIndex,
  plan,
  planPipeline,
  readPixel,
  readPng,
  rejectedPipelineFormatDemo,
  rejectedStageDemo,
  remapCoord,
  resetMultiplyCount,
  resetPipelineCounts,
  rgba,
  rgbaSize,
  rotate180,
  rotate270,
  rotate90,
  rotateStage,
  run,
  runPipeline,
  runStage,
  sampleEdge,
  saturateStage,
  sharpenStage,
  thresholdStage,
  writePng,
} from "./src/imgfx.ts";
import type { ConvolveStage, ExecutableStage, ImageBuffer } from "./src/imgfx.ts";

function main(): void {
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

