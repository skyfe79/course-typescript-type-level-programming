function pickBoth<T>(a: T, b: T): T[] {
  return [a, b];
}

// 두 인자가 같은 후보를 던지므로 T는 number로 정해진다.
const pair: number[] = pickBoth(1, 2);
console.log(pair);

// 후보가 number와 string으로 갈리면 둘을 합쳐 number | string을 만들지는 않는다.
// 나머지를 전부 받아들이는 후보가 없으면 먼저 온 number를 붙들고, 두 번째 인자를 거기에 맞춰 검사한다.
// const brokenPair = pickBoth(1, "two");
// error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

function pickAll<T>(items: T[]): T[] {
  return items;
}

// 여기서는 후보를 던지는 표현식이 배열 리터럴 하나뿐이고, 그 리터럴의 타입이 이미 (string | number)[]다.
const mixed = pickAll([1, "two"]);
const mixedCheck: (string | number)[] = mixed;
console.log(mixedCheck);

// 그래서 T는 string | number가 되고, number[]를 받는 자리에는 넣을 수 없다.
// const mixedNumbers: number[] = mixed;
// error TS2322: Type '(string | number)[]' is not assignable to type 'number[]'.

interface Pipeline<T> {
  seed(): T;
  step(value: T): void;
}

function run<T>(pipeline: Pipeline<T>): void {
  pipeline.step(pipeline.seed());
}

// T의 후보를 던지는 것은 seed 하나인데, 그 값을 받는 step을 일부러 먼저 적었다.
// this를 참조하지 않는 메서드는 문맥에 민감하지 않아 이 순서가 추론을 흔들지 않는다.
// value.toFixed가 컴파일된다는 사실이 T가 number로 정해졌다는 증거다.
run({
  step(value) {
    console.log(value.toFixed(2));
  },
  seed() {
    return 42;
  },
});

export {};
