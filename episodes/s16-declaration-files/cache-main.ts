// 모듈 보강으로 병합된 CacheOptions 타입이 실제 호출에서 통과하는지 확인합니다.
// 실행 파일이 보강 파일을 직접 import하지 않아도 프로그램 전체에 적용되는지 확인합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/cache-main.ts

// codeStep 245 — 보강된 옵션 프로퍼티를 사용해 vendor 캐시를 생성합니다.

import { createCache } from "./vendor/tiny-cache.js";

// maxEntries는 원래 CacheOptions에 없던 프로퍼티지만 cache-augment.ts의 보강 덕분에 통과합니다.
// 실측 진단(cache-augment.ts를 통째로 치웠을 때):
// episodes/s16-declaration-files/cache-main.ts(15,43): error TS2353: Object literal may only specify known properties, and 'maxEntries' does not exist in type 'CacheOptions'.
// 오류가 이 한 줄뿐인 것이 요점입니다. 보강이 손대는 것은 CacheOptions의 프로퍼티 한 자리이지
// vendor 모듈 전체가 아니므로, 보강이 사라져도 createCache 자체는 그대로 남습니다.
const cache = createCache({ ttlMs: 60000, maxEntries: 500 });
cache.set("user:1", { name: "Ada" });
console.log(cache.get("user:1"));

// 이 파일은 cache-augment.ts를 import 하지 않습니다.
// tsconfig.json에 include가 없어 node_modules 밖 모든 .ts/.d.ts가 한 프로그램이고,
// 모듈 보강은 그 파일이 프로그램에 들어 있기만 하면 프로그램 전체에 적용됩니다.
