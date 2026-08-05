/*
 * imgfx는 지금까지 소스 파일 하나를 직접 실행하는 프로젝트였습니다. 이제는 같은 이미지
 * 파이프라인을 다른 코드가 import 해서 쓸 수 있는 패키지 표면과, 명령행에서 실행하는
 * CLI 표면을 분리합니다.
 *
 * declaration: true로 만든 .d.ts에는 판별 유니온과 조건부 타입이 값 코드 없이 남습니다.
 * package.json의 types가 dist/index.d.ts를 가리키므로, 패키지를 가져다 쓰는 쪽도
 * CheckAdjacent가 표현한 파이프라인 검사 결과를 그대로 받습니다.
 *
 * main은 import 진입점인 dist/index.js를, bin은 명령행 진입점인 dist/cli.js를 가리킵니다.
 * package.json에서 private: true를 뺀 것은 패키지로 다루는 모양을 보여 주기 위해서이고,
 * files: ["dist"]는 배포물에 빌드 결과만 담겠다는 뜻입니다.
 */
/*
 * 이 배럴 파일은 패키지 밖에서 의존해도 되는 이미지 파이프라인 표면만 모읍니다.
 * 스테이지 생성자와 실행·계획 함수, 그리고 그 계약을 설명하는 타입은 다른 코드가
 * 가져다 써도 안정적인 공개 표면입니다.
 */
export { makeImageBuffer, bytesPerPixel, invertStage, grayscaleStage, brightnessStage, contrastStage, thresholdStage, saturateStage, boxBlurStage, gaussianBlurStage, sharpenStage, flipStage, flipHorizontalStage, flipVerticalStage, rotateStage, pipeline, run, runPipeline, planPipeline, describeExecutableStage, } from "./imgfx.js";
/*
 * brokenKernelDemo, rejectedStageDemo, inPlaceCorruptionDemo 같은 관찰용 데모 함수는
 * 한계를 보여 주려고 일부러 실패하는 코드라 라이브러리 계약으로 내보내지 않습니다.
 *
 * decodeCount, encodeCount, neighborStageCount, multiplyCount와 resetPipelineCounts,
 * resetMultiplyCount도 관찰용 계측이지 패키지 사용자가 의존할 계약이 아닙니다.
 *
 * pixelIndex, readPixel, copyPixel, sampleEdge, convolve1D, scratchToImage, rotateCoord 같은
 * 픽셀 좌표 헬퍼와 readPng, writePng는 내부 배선이라 내보내지 않습니다. 파일 입출력은
 * CLI가 맡고, 라이브러리는 바이트만 주고받는 runPipeline을 공개 통로로 둡니다.
 *
 * describeStage, describeStageWithFlip, describeStageMissingFlip은 카탈로그가 자라는 과정을
 * 보여 준 중간 단계입니다. 완성된 공개 계약은 describeExecutableStage 하나입니다.
 *
 * cli.ts의 파서와 runCli도 내보내지 않습니다. CLI는 package.json의 bin으로 실행하는
 * 명령행 표면이지, 라이브러리 사용자가 의존할 import 표면이 아닙니다.
 */
