// 불리언 플래그로 요청 상태를 표현할 때 생기는 불가능한 조합을 보여줍니다.
// status 판별자를 가진 유니온으로 가능한 상태만 남기는 방식을 비교합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/request-state.ts

// codeStep 202 — 불리언 플래그 세 개가 허용하는 여덟 가지 조합

interface RequestStateFlags {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}
// 2 * 2 * 2 = 8가지 조합

const impossible: RequestStateFlags = {
  isLoading: false,
  isSuccess: true,
  isError: true, // 성공과 실패가 동시에? 있어선 안 되는 상태인데 컴파일된다
};

export {};
