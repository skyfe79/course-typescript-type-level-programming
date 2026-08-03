type Status = "idle" | "loading" | "error";

function describeStatus(status: Status): string {
  if (status === "error") {
    // 여기서 status를 호버하면 "error" 리터럴 하나로 좁혀져 있다.
    return "failed";
  }
  // 여기서 status를 호버하면 남은 "idle" | "loading"으로 좁혀져 있다.
  return `status: ${status}`;
}

console.log(describeStatus("error"));
console.log(describeStatus("loading"));
