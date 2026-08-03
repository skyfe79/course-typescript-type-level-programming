type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; error: string };

// success인데 data가 없는 상태는 막힌다.
// const missingData: RequestState = { status: "success" };
// error TS2322: Type '{ status: "success"; }' is not assignable to type 'RequestState'.
//   Property 'data' is missing in type '{ status: "success"; }' but required in type '{ status: "success"; data: string; }'.

// error인데 data가 남아 있는 상태도 막힌다.
// const staleData: RequestState = {
//   status: "error",
//   data: "이전 응답",
//   error: "요청 실패",
// };
// error TS2353: Object literal may only specify known properties, and 'data' does not exist in type '{ status: "error"; error: string; }'.

function describeRequest(state: RequestState): string {
  switch (state.status) {
    case "idle":
      return "idle: 요청 전";
    case "loading":
      return "loading: 요청 중";
    case "success":
      // status 하나로 data가 string으로 좁혀진다.
      return `success: ${state.data} (${state.data.length}자)`;
    case "error":
      return `error: ${state.error}`;
  }
}

const states: RequestState[] = [
  { status: "idle" },
  { status: "loading" },
  { status: "success", data: "응답 완료" },
  { status: "error", error: "요청 실패" },
];

for (const state of states) {
  console.log(describeRequest(state));
}

export {};
