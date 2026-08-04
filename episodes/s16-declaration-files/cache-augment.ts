// 내가 소유하지 않은 모듈의 타입을 다시 열어 멤버를 더하는 파일입니다.
// 선언 파일로 타입을 붙였던 vendor 자리에서 이번에는 모듈 보강을 확인합니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: 이 파일은 타입 보강만 만들고 런타임에서 호출할 코드가 없습니다.

// codeStep 245 — declare module로 vendor 모듈의 인터페이스를 보강합니다.

import "./vendor/tiny-cache.js";

// 위 import는 두 가지 일을 동시에 합니다. 이 파일을 모듈로 만들고,
// 아래 declare module이 어느 모듈을 다시 열지 컴파일러에게 가리킵니다.
declare module "./vendor/tiny-cache.js" {
  // 같은 interface CacheOptions를 다시 적는 것은 덮어쓰기가 아니라 선언 병합입니다.
  // 그래서 원래 있던 ttlMs는 그대로 남고, 여기서는 maxEntries만 추가됩니다.
  interface CacheOptions {
    maxEntries?: number;
  }
}
// 실측 진단(vendor/tiny-cache.d.ts만 치웠을 때) — 오류가 두 개 납니다:
// episodes/s16-declaration-files/cache-augment.ts(12,16): error TS2665: Invalid module name in augmentation. Module './vendor/tiny-cache.js' resolves to an untyped module at '.../vendor/tiny-cache.js', which cannot be augmented.
// episodes/s16-declaration-files/cache-main.ts(8,29): error TS7016: Could not find a declaration file for module './vendor/tiny-cache.js'. '.../vendor/tiny-cache.js' implicitly has an 'any' type.
// 첫 번째 오류가 보강의 전제를 알려 줍니다. 보강은 이미 타입이 있는 모듈만 다시 열 수 있습니다.
// ep_106이 선언 파일로 타입을 붙여 둔 덕분에 이 화의 보강이 가능한 것입니다.
