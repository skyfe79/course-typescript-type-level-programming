// in/out 어노테이션을 뗀 타입에서 같은 대입을 다시 확인한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/variance-effect-stripped.ts

// codeStep 186 — 어노테이션을 뗀 Producer2와 Consumer2의 대입 대조

interface Animal {
  name: string;
}

interface Cat extends Animal {
  meow(): string;
}

interface Producer2<T> {
  get(): T;
}

interface Consumer2<T> {
  set(v: T): void;
}

const nabi: Cat = {
  name: "나비",
  meow() {
    return "야옹";
  },
};

const catProducer: Producer2<Cat> = {
  get() {
    return nabi;
  },
};

let p1: Producer2<Animal> = catProducer;

console.log("Producer2<Cat>도 Producer2<Animal> 자리에 들어간다:", p1.get().name);

const animalConsumer: Consumer2<Animal> = {
  set(animal) {
    console.log("Animal 소비자는 Cat도 받을 수 있다:", animal.name);
  },
};

let c1: Consumer2<Cat> = animalConsumer;

c1.set(nabi);

// 결정적 대조: 메서드 문법에서는 어노테이션이 없으면 반대 방향도 통과한다.
// 아래 catConsumer는 매개변수의 meow를 실제로 사용하는데, Consumer2<Animal> 자리에 들어간다.
const catConsumer: Consumer2<Cat> = {
  set(cat) {
    console.log("Cat 소비자는 meow를 사용한다:", cat.meow());
  },
};

let ok: Consumer2<Animal> = catConsumer;

console.log("Consumer2<Cat>은 어노테이션이 없으면 Consumer2<Animal> 자리도 통과한다.");

// 그래서 Animal만 있는 값을 넘기면 타입 검사를 통과하고도 실행 중에 터진다.
try {
  ok.set({ name: "이름만 있는 동물" });
} catch (e) {
  console.log("통과한 대입이 실행 중에 터진다:", (e as Error).message);
}

// 어노테이션이 있는 Consumer<in T>에서는 같은 자리가 TS2322로 거부된다.
// let badConsumer: Consumer<Animal> = {} as Consumer<Cat>;
// episodes/s12-functions-variance/variance-effect-annotated.ts(56,5): error TS2322: Type 'Consumer<Cat>' is not assignable to type 'Consumer<Animal>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.

// Producer2의 반대 방향은 어노테이션이 있는 쪽과 똑같이 거부된다.
// let badProducer: Producer2<Cat> = {} as Producer2<Animal>;
// episodes/s12-functions-variance/variance-effect-stripped.ts(75,5): error TS2322: Type 'Producer2<Animal>' is not assignable to type 'Producer2<Cat>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.

interface PropConsumer<in T> {
  set: (v: T) => void;
}

interface PropConsumer2<T> {
  set: (v: T) => void;
}

const propCatConsumer: PropConsumer<Cat> = {
  set(cat) {
    console.log("프로퍼티 함수 타입의 Cat 소비자:", cat.meow());
  },
};

const propCatConsumer2: PropConsumer2<Cat> = {
  set(cat) {
    console.log("어노테이션 없는 프로퍼티 함수 타입의 Cat 소비자:", cat.meow());
  },
};

propCatConsumer.set(nabi);
propCatConsumer2.set(nabi);

// 프로퍼티 + 함수 타입 문법은 어노테이션 유무와 관계없이 이미 반공변으로 검사된다.
// let badPropConsumer: PropConsumer<Animal> = {} as PropConsumer<Cat>;
// episodes/s12-functions-variance/variance-effect-stripped.ts(103,5): error TS2322: Type 'PropConsumer<Cat>' is not assignable to type 'PropConsumer<Animal>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.
// let badPropConsumer2: PropConsumer2<Animal> = {} as PropConsumer2<Cat>;
// episodes/s12-functions-variance/variance-effect-stripped.ts(106,5): error TS2322: Type 'PropConsumer2<Cat>' is not assignable to type 'PropConsumer2<Animal>'.
//   Property 'meow' is missing in type 'Animal' but required in type 'Cat'.

export {};
