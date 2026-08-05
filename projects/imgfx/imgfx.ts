// imgfx — PNG 필터 체인 라이브러리 & CLI의 목표 API와 명령 줄 모양을 먼저 세운다.
// 실행: node projects/imgfx/imgfx.ts
// 검사: npx tsc --noEmit
//
// 이 프로젝트가 완성될 때까지 지킬 세 가지 보장:
// 1. 앞 스테이지의 출력 포맷과 뒤 스테이지의 입력 포맷이 어긋난 체인은 컴파일되지 않는다.
// 2. 각 스테이지는 입력 버퍼를 제자리에서 바꾸지 않고 항상 새 버퍼를 반환한다.
// 3. 파일 입출력은 한 계층에만 두며, 스테이지는 파일 시스템을 전혀 알지 못한다.

// codeStep 421 — 목표 API와 CLI 명령 줄 적어 보기

// 이번 화에는 구현보다 최종 API의 윤곽만 먼저 고정하므로 핵심 타입 셋을 unknown으로 비워 둔다.
// 다음 화 ep_192에서 PNG 코덱을 마련하고, ep_193에서 ImageBuffer와 팬텀 포맷 매개변수를
// 실제 타입으로 채운다. AnyStage와 Pipeline도 뒤 화에서 스테이지 체인을 구현하며 구체화한다.
type ImageBuffer<Format extends string> = unknown;
type AnyStage = unknown;
type Pipeline<Stages> = unknown;

// declare 시그니처는 앞으로 완성할 호출 모양만 약속하며, 지금은 런타임 구현을 만들지 않는다.
declare function invert(image: ImageBuffer<"RGBA8">): ImageBuffer<"RGBA8">;
declare function grayscale(image: ImageBuffer<"RGBA8">): ImageBuffer<"Gray8">;
declare function brightness(amount: number): (image: ImageBuffer<"RGBA8">) => ImageBuffer<"RGBA8">;
declare function pipeline<Stages extends readonly AnyStage[]>(...stages: Stages): Pipeline<Stages>;

// CLI 사용 예:
//   imgfx run photo.png --chain invert,grayscale,brightness:20 --out result.png
//   imgfx run photo.png --chain invert,grayscale,brightness:20 --plan
//   (두 번째 명령은 필터를 실행하지 않고 스테이지 목록만 출력한다.)

// 아직 인자를 해석하지는 않지만, 인자 없이도 목표 명령 형식을 곧바로 확인할 수 있게 한다.
function main(): void {
  console.log("imgfx run <input.png> --chain <stage1,stage2,...> --out <output.png> [--plan]");
}

main();

// ── codeStep 422 — 잘못된 순서가 컴파일되지 않는 모습 미리 보기 ──────────────

// 오늘의 목표를 미리 보여 주기 위한 임시 타입이다. 다음 화부터 진짜 ImageBuffer와
// AnyStage로 교체하며, 지금은 문자열 태그 하나만으로 스테이지 사이의 포맷을 구별한다.
type Tagged<Tag extends string> = { readonly tag: Tag };

declare function previewInvert(x: Tagged<"RGBA8">): Tagged<"RGBA8">;
declare function previewGrayscale(x: Tagged<"RGBA8">): Tagged<"Gray8">;
declare function previewBrightness(x: Tagged<"RGBA8">): Tagged<"RGBA8">;

// 첫 함수의 출력 B를 두 번째 함수의 입력 B로 함께 사용하므로, 두 포맷이 맞물려야만 한다.
function chain2<A, B, C>(first: (input: A) => B, second: (input: B) => C): (input: A) => C {
  return (input) => second(first(input));
}

// 타입 스트리핑은 타입만 지우므로, 런타임 값이 없는 declare 선언을 실제로 참조하면 그대로 터진다.
// 그래서 아래 검사는 최상위에서 실행하지 않고, 호출되지 않는 함수 안에 두어 타입 검사에만 사용한다.
function previewChainCheck(): void {
  const validChain = chain2(previewInvert, previewBrightness); // RGBA8과 RGBA8이 맞물려 통과한다.

  // @ts-expect-error — previewGrayscale의 출력은 Tagged<"Gray8">인데 previewBrightness는 Tagged<"RGBA8">를 요구한다.
  const invalidChain = chain2(previewGrayscale, previewBrightness);
  // 실제 진단은 두 번째 인자가 아니라, 뒤 함수의 입력에 맞지 않는 첫 번째 인자 previewGrayscale을 가리킨다.
}

export {};
