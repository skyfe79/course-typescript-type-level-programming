// in/out 어노테이션을 붙인 타입에서 대입 방향이 어떻게 검사되는지 확인한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/variance-effect-annotated.ts

// codeStep 185 — 어노테이션이 붙은 Producer와 Consumer의 기준선 대입

interface Animal {
  name: string;
}

interface Cat extends Animal {
  meow(): string;
}

interface Producer<out T> {
  get(): T;
}

interface Consumer<in T> {
  set(v: T): void;
}

const nabi: Cat = {
  name: "나비",
  meow() {
    return "야옹";
  },
};

const catProducer: Producer<Cat> = {
  get() {
    return nabi;
  },
};

let p1: Producer<Animal> = catProducer;

console.log("Producer<Cat>은 Producer<Animal> 자리에 들어간다:", p1.get().name);

const animalConsumer: Consumer<Animal> = {
  set(animal) {
    console.log("Animal 소비자는 공통 필드만 사용한다:", animal.name);
  },
};

let c1: Consumer<Cat> = animalConsumer;

c1.set(nabi);

// 반대 방향은 out 어노테이션 때문에 거부된다.
// let badProducer: Producer<Cat> = {} as Producer<Animal>;
// episodes/s12-functions-variance/variance-effect-annotated.ts(51,5): error TS2322: Type 'Producer<Animal>' is not assignable to type 'Producer<Cat>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.

// 반대 방향은 in 어노테이션 때문에 메서드 문법에서도 엄격하게 거부된다.
// let badConsumer: Consumer<Animal> = {} as Consumer<Cat>;
// episodes/s12-functions-variance/variance-effect-annotated.ts(56,5): error TS2322: Type 'Consumer<Cat>' is not assignable to type 'Consumer<Animal>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.
export {};
