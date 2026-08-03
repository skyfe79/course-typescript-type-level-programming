// 함수 타입에서 매개변수는 반공변, 반환값은 공변으로 검사된다.
// 같은 Dog-Animal 관계를 매개변수 자리와 반환값 자리에 각각 넣어 방향이 반대라는 것을 대조한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/variance-check.ts

// codeStep 179 — 반공변 위반과 공변 통과를 한 파일에서 대조

interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): string;
}

interface Cat extends Animal {
  meow(): string;
}

type Handler<T> = (input: T) => void;

const dogHandler: Handler<Dog> = (dog) => {
  console.log("개 전용 핸들러는 bark를 바로 부른다:", dog.bark());
};

// 매개변수는 반공변이다 — Dog만 처리할 수 있는 함수는 Animal 전체를 처리하는 자리에 못 들어간다.
// 아래 한 줄을 살리면 컴파일이 곧바로 막힌다.
// const animalHandler: Handler<Animal> = dogHandler;
// episodes/s12-functions-variance/variance-check.ts(28,7): error TS2322: Type 'Handler<Dog>' is not assignable to type 'Handler<Animal>'.
//   Property 'bark' is missing in type 'Animal' but required in type 'Dog'.

const dog: Dog = {
  name: "초코",
  bark() {
    return "멍멍";
  },
};

const cat: Cat = {
  name: "나비",
  meow() {
    return "야옹";
  },
};

// 거부의 이유는 여기 있다 — Handler<Animal> 자리에 들어가려면 Cat이 와도 처리할 수 있어야 한다.
const animalOnlyHandler: Handler<Animal> = (animal) => {
  console.log("Animal 핸들러는 공통 필드만 써서 처리한다:", animal.name);
};

dogHandler(dog);
animalOnlyHandler(dog);
animalOnlyHandler(cat);

// 반환값은 공변이다 — 같은 Dog-Animal 관계인데 방향이 뒤집힌다.
type Producer<T> = () => T;

const dogProducer: Producer<Dog> = () => dog;

// 이 대입은 아무 표시 없이 통과한다. 받는 쪽은 Animal을 기대했는데 더 구체적인 Dog가 와도 문제가 없다.
const animalProducer: Producer<Animal> = dogProducer;

console.log("Dog 생산자는 Animal 생산자 자리로 올라갈 수 있다:", animalProducer().name);
console.log("요약 — 매개변수는 더 넓게 받을 수 있어야 하고, 반환값은 더 좁게 돌려줘도 된다.");

export {};
