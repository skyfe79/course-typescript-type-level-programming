type RequestStateOptional = {
  status: "idle" | "loading" | "success" | "error";
  data?: string;
  error?: string;
};

// success인데 data가 없어도 통과한다.
const missingData: RequestStateOptional = { status: "success" };

// error인데 data와 error가 동시에 있어도 통과한다.
const staleData: RequestStateOptional = {
  status: "error",
  data: "이전 응답",
  error: "요청 실패",
};

function describeRequest(state: RequestStateOptional): string {
  if (state.status === "success") {
    // return `success: ${state.data} (${state.data.length}자)`;
    // error TS18048: 'state.data' is possibly 'undefined'.

    // status를 확인한 뒤에도 data를 따로 확인해야 한다.
    if (state.data === undefined) {
      return "success: data가 아예 없음";
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
