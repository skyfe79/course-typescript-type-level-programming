function applyDiscount(price: number, rate: number): number {
  return price - price * rate;
}

const price = Number(process.argv[2]);
const rateArg = process.argv[3];

// 아래 줄의 주석을 해제하면 인자 타입 불일치 에러가 난다
// console.log(applyDiscount(price, rateArg));

console.log(applyDiscount(price, Number(rateArg)));
