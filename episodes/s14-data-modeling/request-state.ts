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

// codeStep 203 — 판별 유니온으로 리팩터링

// (RequestStateFlags와 impossible 값은 이전 커밋의 참고용으로만 남긴다)
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

// @ts-expect-error - error 상태인데 success 전용 필드 data까지 갖는 조합은 만들 수 없다
const mixedState: RequestState = { status: "error", message: "실패", data: "ok" };

function describe(state: RequestState): string {
  switch (state.status) {
    case "idle":
      return "대기 중";
    case "loading":
      return "불러오는 중";
    case "success":
      return state.data;
    case "error":
      return state.message;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

console.log("idle:", describe({ status: "idle" }));
console.log("loading:", describe({ status: "loading" }));
console.log("success:", describe({ status: "success", data: "요청 성공" }));
console.log("error:", describe({ status: "error", message: "요청 실패" }));
console.log("불리언 플래그의 여덟 가지 조합을 네 가지 요청 상태로 줄였습니다.");

export {};
