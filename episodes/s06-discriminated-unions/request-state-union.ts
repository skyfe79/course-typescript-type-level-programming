type RequestStateUnion = {
  status: "idle" | "loading" | "success" | "error";
  data: string | undefined;
  error: string | undefined;
};

// success인데 data가 undefined여도 통과한다.
const missingData: RequestStateUnion = {
  status: "success",
  data: undefined,
  error: undefined,
};

// error인데 data와 error가 동시에 있어도 통과한다.
const staleData: RequestStateUnion = {
  status: "error",
  data: "이전 응답",
  error: "요청 실패",
};

// 키 자체를 생략하면 막힌다.
// const missingBothKeys: RequestStateUnion = { status: "success" };
// error TS2739: Type '{ status: "success"; }' is missing the following properties from type 'RequestStateUnion': data, error

// const missingErrorKey: RequestStateUnion = { status: "success", data: "응답" };
// error TS2741: Property 'error' is missing in type '{ status: "success"; data: string; }' but required in type 'RequestStateUnion'.

function describeRequest(state: RequestStateUnion): string {
  if (state.status === "success") {
    // return `success: ${state.data} (${state.data.length}자)`;
    // error TS18048: 'state.data' is possibly 'undefined'.

    // 옵셔널 필드 모델과 마찬가지로 data를 따로 확인해야 한다.
    if (state.data === undefined) {
      return "success: data 키는 있지만 값이 undefined";
    }
    return `success: ${state.data} (${state.data.length}자)`;
  }

  if (state.status === "error") {
    return `error: error=${state.error}, data=${state.data}`;
  }

  return state.status;
}

console.log(describeRequest(missingData));
console.log(describeRequest(staleData));

export {};
