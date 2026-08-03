function describe(value: string | number): string {
  if (typeof value === "string") {
    // value 호버: string
    return value.toUpperCase();
  } else {
    // value 호버: number
    return value.toFixed(2);
  }
}

console.log(describe("hello"));
console.log(describe(3.14159));

interface Box {
  value: string | number;
}

function mutate(box: Box): void {
  box.value = 42;
}

function callThenRead(box: Box): void {
  if (typeof box.value === "string") {
    mutate(box);

    try {
      // 여기서 tsc는 에러 0건이다.
      console.log("callThenRead:", box.value.toUpperCase());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("callThenRead caught:", message);
    }
  }
}

function assignThenRead(box: Box): void {
  if (typeof box.value === "string") {
    box.value = 42;

    // box.value.toUpperCase();
    // error TS2339: Property 'toUpperCase' does not exist on type 'number'.
    console.log("assignThenRead:", box.value.toFixed(2));
  }
}

function captureThenRead(value: string | number): void {
  let current = value;
  const reset = (): void => {
    current = 42;
  };

  if (typeof current === "string") {
    setTimeout(() => {
      // current.toUpperCase();
      // error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
      //   Property 'toUpperCase' does not exist on type 'number'.
      console.log("captureThenRead callback:", typeof current, String(current));
    }, 0);

    reset();
    // reset() 호출 뒤에도 이 바깥의 좁히기는 유지된다.
    console.log("captureThenRead after reset:", typeof current, String(current));
  }
}

callThenRead({ value: "hello" });
assignThenRead({ value: "hello" });
captureThenRead("hello");
