// noImplicitAny는 타입 표기 없이 선언되어 암시적으로 any가 된 매개변수를 잡습니다.
function greet(name) {
  console.log(`안녕하세요, ${name}님!`);
}

// noImplicitThis는 일반 함수 안에서 타입을 알 수 없는 this를 사용한 자리를 잡습니다.
function printName() {
  console.log(`이름: ${this.name}`);
}

class LegacyBadge {
  // strictPropertyInitialization은 생성자에서 값을 대입하지 않은 프로퍼티를 잡습니다.
  label: string;

  print() {
    console.log(`배지: ${this.label}`);
  }
}

function add(left: number, right: number) {
  console.log(`합계: ${left + right}`);
}

// strictBindCallApply는 함수 시그니처와 맞지 않는 apply 인자 배열을 잡습니다.
// 이 apply 호출을 잡으려면 strictFunctionTypes도 함께 켜져 있어야 합니다.
add.apply(null, [1]);

// strictBuiltinIteratorReturn은 내장 반복자의 TReturn을 any가 아니라 undefined로 인스턴스화합니다.
// 따라서 done이 참일 때 value는 undefined이며 string에 대입할 수 없습니다.
// 이 대입을 잡으려면 step0부터 켜 둔 strictNullChecks도 함께 필요합니다.
const numbers = [1, 2, 3][Symbol.iterator]();
const step = numbers.next();
if (step.done) {
  const finished: string = step.value;
  console.log(finished);
}

// 위 선언들이 실행 흐름에서도 실제로 사용되는 낡은 코드라고 가정합니다.
greet("홍길동");
printName.call({ name: "김코딩" });
new LegacyBadge().print();
