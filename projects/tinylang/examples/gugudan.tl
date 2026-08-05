let base: number = 2;
while (base <= 9) {
  let row: string = "";
  let i: number = 1;
  while (i <= 9) {
    row = row + toString(base) + " x " + toString(i) + " = " + toString(base * i) + "  ";
    i = i + 1;
  }
  print(row);
  base = base + 1;
}
