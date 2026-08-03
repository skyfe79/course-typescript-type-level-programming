// 변성 어노테이션 in/out은 제네릭 타입 매개변수의 사용 방향을 직접 선언한다.
// 선언한 방향과 실제 사용 위치가 어긋나면 컴파일러가 그 불일치를 짚어 준다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/variance-annotations.ts

// codeStep 183 — out 선언과 실제 사용이 어긋날 때 나는 변성 오류

interface Animal {
  name: string;
}

interface Cat extends Animal {
  meow(): string;
}

const cat: Cat = {
  name: "나비",
  meow() {
    return "야옹";
  },
};

interface ReadonlyBox<out T> {
  get: () => T;
}

const readonlyCatBox: ReadonlyBox<Cat> = {
  get: () => cat,
};

const readonlyAnimalBox: ReadonlyBox<Animal> = readonlyCatBox;

console.log("ReadonlyBox<Cat>은 ReadonlyBox<Animal> 자리에 들어간다:", readonlyAnimalBox.get().name);

// 컴파일 실패 사례 — out T인데 set이 T를 입력 위치에서 쓴다.
// interface WriteBox<out T> {
//   get: () => T;
//   set: (v: T) => void;
// }
// episodes/s12-functions-variance/variance-annotations.ts(36,20): error TS2636: Type 'WriteBox<sub-T>' is not assignable to type 'WriteBox<super-T>' as implied by variance annotation.
//   Types of property 'set' are incompatible.
//     Type '(v: sub-T) => void' is not assignable to type '(v: super-T) => void'.
//       Types of parameters 'v' and 'v' are incompatible.
//         Type 'super-T' is not assignable to type 'sub-T'.

interface MethodBox<out T> {
  get(): T;
  set(v: T): void; // 메서드 문법의 매개변수는 양변으로 검사돼 out 선언을 위반하지 않는다.
}

// 그래서 위 실패 사례는 프로퍼티 + 함수 타입으로 써야 드러난다.
const methodCatBox: MethodBox<Cat> = {
  get() {
    return cat;
  },
  set(nextCat) {
    console.log("메서드 문법의 set도 값은 받을 수 있다:", nextCat.meow());
  },
};

methodCatBox.set(cat);

export {};
