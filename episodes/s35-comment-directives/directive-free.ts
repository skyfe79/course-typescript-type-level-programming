// 주석 지시어가 하던 일을 지시어를 제거한 쌍둥이 코드의 진단과 비교합니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/directive-free.ts
// 실행 코드는 directive-families.ts와 같지만, @ts-ignore와 트리플 슬래시 참조가 없습니다.
// 일부러 실패하는 파일이라 저장소 전체 검사에서는 빠져 있습니다.

const mismatch: number = "not a number";
console.log(mismatch, process.platform);

// 모듈 경계를 만들어 directive-families.ts의 같은 이름과 전역에서 충돌하지 않게 합니다.
export {};
