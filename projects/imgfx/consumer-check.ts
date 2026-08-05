/*
 * 이 파일은 imgfx 패키지를 만드는 쪽이 아니라, 패키지를 가져다 쓰는 쪽
 * 곧 컨슈머 자리에 서서 방금 배포 모양을 갖춘 imgfx를 확인하는 작은 파일입니다.
 *
 * 배포물 자체가 아니라 검증용 파일이므로 src 밖에 둡니다. projects/imgfx의
 * package.json이 files: ["dist"]로 배포 대상을 dist로만 제한하기 때문에, 이 파일은
 * 패키지를 설치하는 사람에게 함께 담기지 않습니다.
 *
 * 실행 위치와 명령:
 *   cd projects/imgfx
 *   node consumer-check.ts
 *
 * 아래 import가 상대 경로가 아니라 패키지 이름 "imgfx"를 쓰는 점이 핵심입니다.
 * 그래야 타입 검사는 package.json의 types 필드를 지나 dist/index.d.ts를 읽고,
 * 실행은 main 필드를 지나 dist/index.js를 읽습니다.
 */
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import {
  boxBlurStage,
  grayscaleStage,
  invertStage,
  pipeline,
  rotateStage,
  run,
  runPipeline,
  saturateStage,
  sharpenStage,
} from "imgfx";

// 가변 인자 튜플이 각 스테이지의 순서를 보존하므로 정상 체인은 공개 타입 검사를 통과합니다.
const checkedPipeline = pipeline(
  saturateStage(0),
  boxBlurStage(3),
  sharpenStage(),
);

// 성공 분기에서만 in과 out이 남으므로, 이 한 줄이 찍힌다는 것 자체가 컨슈머 쪽 검사를 통과했다는 뜻입니다.
run(checkedPipeline);

function rejectedConsumerPipeline(): void {
  /*
   * grayscale은 Gray8을 내지만 invert는 RGBA8을 요구합니다. 검사 로직만 건너오는 것이 아니라
   * PipelineMismatch라는 검사 결과 타입이 .d.ts를 타고 컨슈머에게 건너오므로 실행 전에 막힙니다.
   */
  // @ts-expect-error — PipelineMismatch에는 run이 요구하는 in과 out이 없습니다.
  run(pipeline(grayscaleStage(), invertStage()));
}

const stages = [saturateStage(0), boxBlurStage(3), rotateStage("90")] as const;
const inputBytes = readFileSync(new URL("./photo.png", import.meta.url));
const outputBytes = runPipeline(inputBytes, stages);
const outputPng = PNG.sync.read(outputBytes);

console.log(
  `컨슈머 결과 PNG ${outputPng.width}x${outputPng.height} / 바이트 ${outputBytes.length}`,
);
