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

type Primary = "red" | "green" | "blue";
type Secondary = "green" | "blue" | "yellow";

function matchColor(primary: Primary, secondary: Secondary): string {
  if (primary === secondary) {
    // 여기서 primary와 secondary를 호버하면 둘 다 "green" | "blue"로 좁혀져 있다.
    return `both match: ${primary}`;
  }
  return `no match: ${primary} vs ${secondary}`;
}

console.log(matchColor("green", "green"));
console.log(matchColor("red", "yellow"));
