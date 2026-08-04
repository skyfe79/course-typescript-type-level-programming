// tiny-cache.js와 짝을 이루는 vendor 선언 파일입니다.
// 패키지가 함께 배포한 타입이라고 가정하므로 우리가 고치지 않는 대상입니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: .d.ts는 런타임 코드가 아니라 타입 검사 전용 선언입니다.

// codeStep 245 — vendor 패키지가 원래 제공한 CacheOptions 타입을 확인합니다.

export interface CacheOptions {
  ttlMs: number;
}
export declare function createCache(
  options: CacheOptions,
): { get(key: string): unknown; set(key: string, value: unknown): void };
