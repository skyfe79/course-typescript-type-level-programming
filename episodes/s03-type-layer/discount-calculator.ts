function applyDiscount(price: number, rate: number): number {
  const result = price - price * rate;
  // 아래 줄의 주석을 해제하면 반환 타입 불일치 에러가 난다
  // return result + "";
  return result;
}

const price = Number(process.argv[2]);
const rateArg = process.argv[3];

// 아래 줄의 주석을 해제하면 인자 타입 불일치 에러가 난다
// console.log(applyDiscount(price, rateArg));

type CliArgs = { price: number; rate: number };

// 아래 줄의 주석을 해제하면 프로퍼티 이름 오타 에러가 난다
// const typo: CliArgs = { price, rat: Number(rateArg) };

const args: CliArgs = { price, rate: Number(rateArg) };
console.log(applyDiscount(args.price, args.rate));
