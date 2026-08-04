// 내가 소유하지 않은 모듈의 타입을 다시 열어 멤버를 더하는 파일입니다.
// 선언 파일로 타입을 붙였던 vendor 자리에서 이번에는 모듈 보강을 확인합니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: 이 파일은 타입 보강만 만들고 런타임에서 호출할 코드가 없습니다.

// codeStep 245 — declare module로 vendor 모듈의 인터페이스를 보강합니다.

// codeStep 246 — 위의 import 한 줄을 지워 보강이 조용히 끊기는 것을 확인합니다.
// 245에서는 여기에 import "./vendor/tiny-cache.js"; 한 줄이 있었습니다. 그 한 줄이
// 이 파일을 모듈로 만들고, 아래 declare module이 어느 모듈을 다시 열지 가리켰습니다.
// 그 줄이 사라지자 이 파일에는 최상위 import·export가 하나도 없어 전역 스크립트가 되고,
// 아래 블록은 "기존 모듈의 보강"이 아니라 "새 앰비언트 모듈 선언"으로 해석됩니다.

// @ts-expect-error - 전역 스크립트가 된 파일이라 상대 경로로 앰비언트 모듈을 선언할 수 없습니다.
declare module "./vendor/tiny-cache.js" {
  // 같은 interface CacheOptions를 다시 적는 것은 덮어쓰기가 아니라 선언 병합입니다.
  // 그래서 원래 있던 ttlMs는 그대로 남고, 여기서는 maxEntries만 추가됩니다.
  interface CacheOptions {
    maxEntries?: number;
  }
}
// 실측 진단(위 @ts-expect-error 한 줄만 지웠을 때 — 그 줄이 사라져 행 번호가 하나 당겨진 상태입니다):
// episodes/s16-declaration-files/cache-augment.ts(14,16): error TS2436: Ambient module declaration cannot specify relative module name.
// 이 오류 이름이 방금 일어난 일을 그대로 말해 줍니다. 보강이 아니라 앰비언트 모듈 선언이 된 것입니다.
//
// 실측 진단(245 상태, 즉 맨 위 import이 남아 있던 상태에서 vendor/tiny-cache.d.ts만 치웠을 때):
// episodes/s16-declaration-files/cache-augment.ts(12,16): error TS2665: Invalid module name in augmentation. Module './vendor/tiny-cache.js' resolves to an untyped module at '.../vendor/tiny-cache.js', which cannot be augmented.
// episodes/s16-declaration-files/cache-main.ts(8,29): error TS7016: Could not find a declaration file for module './vendor/tiny-cache.js'. '.../vendor/tiny-cache.js' implicitly has an 'any' type.
// 이 두 값은 import이 있던 245 시점의 파일에서 잰 것이라 행 번호도 그때 기준입니다.
// 첫 번째 오류가 보강의 전제를 알려 줍니다. 보강은 이미 타입이 있는 모듈만 다시 열 수 있습니다.
// ep_106이 선언 파일로 타입을 붙여 둔 덕분에 이 화의 보강이 가능했던 것입니다.
