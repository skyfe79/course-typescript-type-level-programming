// 모듈 보강으로 병합된 CacheOptions 타입이 실제 호출에서 통과하는지 확인합니다.
// 실행 파일이 보강 파일을 직접 import하지 않아도 프로그램 전체에 적용되는지 확인합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s16-declaration-files/cache-main.ts

// codeStep 245 — 보강된 옵션 프로퍼티를 사용해 vendor 캐시를 생성합니다.

import { createCache } from "./vendor/tiny-cache.js";

// codeStep 246 — 이 호출은 한 글자도 바뀌지 않았는데 결과만 달라졌습니다.
// 245에서는 cache-augment.ts의 보강 덕분에 maxEntries가 그대로 통과했습니다. 그런데 그 파일에서
// import 한 줄이 사라지자 보강이 원래 모듈에 더는 적용되지 않아, maxEntries가 낯선 프로퍼티가 됩니다.
// 이 화의 함정이 눈에 잘 띄지 않는 이유가 여기 있습니다. 고친 곳은 다른 파일이고, 이 파일은 그대로입니다.
// @ts-expect-error - 보강이 끊겨 maxEntries가 CacheOptions의 알려진 프로퍼티가 아닙니다.
const cache = createCache({ ttlMs: 60000, maxEntries: 500 });
cache.set("user:1", { name: "Ada" });
console.log(cache.get("user:1"));

// 실측 진단(위 @ts-expect-error 한 줄만 지웠을 때 — 그 줄이 사라져 행 번호가 하나 당겨진 상태입니다):
// episodes/s16-declaration-files/cache-main.ts(14,43): error TS2353: Object literal may only specify known properties, and 'maxEntries' does not exist in type 'CacheOptions'.
// 반대로 cache-augment.ts에 import 한 줄을 다시 넣으면 보강이 다시 붙어, 두 파일의 지시문이
// 나란히 남아돌게 됩니다 — TS2578이 두 곳에서 납니다:
// episodes/s16-declaration-files/cache-augment.ts(N,1): error TS2578: Unused '@ts-expect-error' directive.
// episodes/s16-declaration-files/cache-main.ts(14,1): error TS2578: Unused '@ts-expect-error' directive.
// (augment 쪽 행 번호는 import을 어느 자리에 끼워 넣느냐에 따라 달라져 N으로 적었습니다.)
// 두 지시문이 함께 켜지고 함께 꺼지는 것이 요점입니다. 서로 다른 파일에 난 두 오류가 사실은
// 사라진 import 한 줄이라는 같은 원인에서 나왔다는 증거입니다.
//
// ⭐ 실행은 끝까지 멀쩡합니다. node로 돌리면 여전히 { name: 'Ada' }가 출력됩니다.
// 보강은 타입 층에만 있던 약속이라, 그것이 끊겨도 런타임은 아무것도 달라지지 않습니다.

// 이 파일은 cache-augment.ts를 import 하지 않습니다.
// tsconfig.json에 include가 없어 node_modules 밖 모든 .ts/.d.ts가 한 프로그램이고,
// 모듈 보강은 그 파일이 프로그램에 들어 있기만 하면 프로그램 전체에 적용됩니다.
