// imgfx — PNG 코덱 계층을 만들고, 읽기와 쓰기를 colorType 6 / 비트 깊이 8로 고정한다.
// 실행: node projects/imgfx/imgfx.ts
// 검사: npx tsc --noEmit
//
// 이 프로젝트가 완성될 때까지 지킬 세 가지 보장:
// 1. 앞 스테이지의 출력 포맷과 뒤 스테이지의 입력 포맷이 어긋난 체인은 컴파일되지 않는다.
// 2. 각 스테이지는 입력 버퍼를 제자리에서 바꾸지 않고 항상 새 버퍼를 반환한다.
// 3. 파일 입출력은 한 계층에만 두며, 스테이지는 파일 시스템을 전혀 알지 못한다.

// pngjs는 선언 파일 없이 순수 JavaScript로 배포되므로 이번 스텝에서는 모듈 타입 오류를 예고한다.
// 다음 스텝에서 @types/pngjs를 설치하면 TS2578이 발생해 이 억제 주석을 지우라고 알려 준다.
// @ts-expect-error — 현재 PNG와 여기서 얻는 width, height, data는 모두 any다.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

// 실행 위치가 아니라 이 모듈의 위치를 기준으로 잡아 저장소 루트에서도 같은 파일을 읽고 쓴다.
const INPUT_URL = new URL("./photo.png", import.meta.url);
const OUTPUT_URL = new URL("./copy.png", import.meta.url);

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
  const decoded = readPng(INPUT_URL);
  writePng(OUTPUT_URL, decoded.width, decoded.height, decoded.data);

  // 방금 쓴 파일을 같은 함수로 다시 읽는다. 두 줄이 똑같이 찍히면 왕복이 성립한 것이다.
  readPng(OUTPUT_URL);
}

main();
