function show(v: string | number | boolean | null | undefined): string {
  return typeof v === "string" ? `'${v}'` : String(v);
}

function announce(input: string | number | boolean | null | undefined): void {
  if (input) {
    // input 호버: string | number | true
    console.log(`${show(input)} → true 블록`);
  } else {
    // input 호버: string | number | false | null | undefined
    console.log(`${show(input)} → else 블록`);
  }
}

const falsySamples = [0, "", NaN, false, null, undefined] as const;

for (const sample of falsySamples) {
  announce(sample);
}
