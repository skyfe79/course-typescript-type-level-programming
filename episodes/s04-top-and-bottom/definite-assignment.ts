// strictNullChecks는 값을 쓰기 전에 확실히 할당되었는지도 검사한다.

// let port: number;
// console.log(port);
// error TS2454: Variable 'port' is used before being assigned.

let port: number;
port = 3000;
console.log(port);

// 생성자에서 할당하지 않고 init에서만 할당하면 컴파일러는 확실하다고 인정하지 않는다.
// class Config {
//   value: string;
//   init(value: string): void {
//     this.value = value;
//   }
// }
// error TS2564: Property 'value' has no initializer and is not definitely assigned in the constructor.

// 생성자에서 초기화하면 같은 필드가 규칙을 통과한다.
class Config {
  value: string;

  constructor() {
    this.value = "not initialized";
  }

  init(value: string): void {
    this.value = value;
  }
}

class ConfigFixed {
  value!: string;

  init(value: string): void {
    this.value = value;
  }
}

// 지역 변수의 TS2454는 strictNullChecks 자체가 켜는 규칙이다.
// 클래스 필드 검사는 strictPropertyInitialization이 켜지만, strictNullChecks 없이는 켤 수 없다.
// error TS5052: Option 'strictPropertyInitialization' cannot be specified without specifying option 'strictNullChecks'.
// 따라서 strictNullChecks를 끄면 두 검사 모두 꺼진다.

const eagerConfig = new Config();
eagerConfig.init("eager");
console.log(eagerConfig.value);

const assertedConfig = new ConfigFixed();
assertedConfig.init("asserted");
console.log(assertedConfig.value);
