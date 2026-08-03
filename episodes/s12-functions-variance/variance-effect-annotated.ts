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

// codeStep 187 — 어노테이션 유무를 extendedDiagnostics로 대조한 실측

/*
파일 하나만 재려면 --ignoreConfig가 필요하다. tsconfig.json이 있는 상태에서 파일 인자를 주면
error TS5112가 난다. --ignoreConfig는 strict도 함께 끄므로 --strict를 다시 준다.

npx tsc --extendedDiagnostics --ignoreConfig --strict episodes/s12-functions-variance/variance-effect-annotated.ts
npx tsc --extendedDiagnostics --ignoreConfig --strict episodes/s12-functions-variance/variance-effect-stripped.ts

이 두 파일을 3회씩 잰 결과:
  annotated  Types 35379 / Instantiations 34251 / Check time 0.122s, 0.123s, 0.121s
  stripped   Types 35418 / Instantiations 34264 / Check time 0.121s, 0.120s, 0.125s

두 파일은 길이가 달라서(stripped 쪽에 PropConsumer 대조가 더 있다) 이 수치 차이를 어노테이션
때문이라고 말할 수 없다. 그래서 본문을 똑같이 맞추고 어노테이션만 다르게 한 대조군을 따로
만들어 다시 쟀다. 대입 300개 * 8단계 중첩까지 키운 결과:
  annotated  Types 36261 / Instantiations 34245 / Check time 0.132s, 0.123s, 0.127s
  stripped   Types 36261 / Instantiations 34245 / Check time 0.124s, 0.123s, 0.123s

판정: Types와 Instantiations가 글자 그대로 같고 Check time은 실행 간 노이즈 안에 있다.
이 규모에서 어노테이션의 속도 효과는 관측되지 않는다.
*/

console.log(
  "요약 — 어노테이션은 검사를 더 빠르게 만드는 게 아니라, 메서드 문법에서 추론이 느슨하게 두는 자리를 엄격하게 만들고 의도를 코드에 남긴다.",
);

export {};
