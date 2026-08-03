// 콜백 매개변수를 필요 이상으로 넓게 선언하면 호출자는 더 많은 값을 넘길 수 있다.
// 본문이 실제로는 좁은 타입을 가정하면 버그는 컴파일을 지나 런타임까지 밀린다.
// 매개변수 타입을 정확히 좁혔을 때 같은 문제가 컴파일 에러로 바뀌는지 확인한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/wide-callback-bug.ts

// codeStep 180 — 느슨한 Animal 콜백과 정상 Dog 호출을 대조

interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): string;
}

interface Cat extends Animal {
  meow(): string;
}

// Dog만 처리할 생각이었지만, 매개변수 타입을 필요 이상으로 넓은 Animal로 선언했다.
const handleDogEvent = (animal: Animal) => {
  const dog = animal as Dog; // Animal 전체가 아니라 Dog만 올 것이라고 "가정"하고 강제 단언
  console.log(`${dog.name}가 짖습니다: ${dog.bark()}`);
};

const dog: Dog = {
  name: "초코",
  bark() {
    return "멍멍";
  },
};

handleDogEvent(dog);

// codeStep 181 — Animal로 통과한 Cat 호출이 런타임에서 깨지는 경로를 재현

const cat: Cat = {
  name: "나비",
  meow() {
    return "야옹";
  },
};

try {
  handleDogEvent(cat);
} catch (error) {
  console.log("컴파일은 통과했지만 실행이 막는다:", `${(error as Error).name}: ${(error as Error).message}`);
  // 실측 런타임 메시지: TypeError: dog.bark is not a function
}

export {};
