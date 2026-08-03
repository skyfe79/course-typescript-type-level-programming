function announce(input: string | number | boolean | null | undefined): void {
  if (input) {
    // input 호버: string | number | true
    console.log(input);
  } else {
    // input 호버: string | number | false | null | undefined
    console.log(input);
  }
}
