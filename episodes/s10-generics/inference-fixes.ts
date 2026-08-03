interface Store<T> {
  value: T | undefined;
  set(next: T): void;
}

// 매개변수가 하나도 없다. T가 인자 어디에도 나타나지 않으니 호출부가 던질 후보가 아예 없다.
function createStore<T>(): Store<T> {
  const store: Store<T> = {
    value: undefined,
    set(next) {
      store.value = next;
    },
  };
  return store;
}

// 타입 인자도, 결과를 받는 자리의 타입 표기도 없다. 그런데 오류가 나지 않는다.
const store = createStore();

// 후보가 없던 T는 unknown으로 물러났고, unknown 매개변수 자리에는 어떤 값이든 넘길 수 있다.
store.set(true);
console.log(store.value);

// 무엇이 정해졌는지는 오류 메시지가 그대로 출력한다. Store<string> 자리에 넣어 보면 Store<unknown>이라고 답한다.
// const typedStore: Store<string> = store;
// error TS2322: Type 'Store<unknown>' is not assignable to type 'Store<string>'.

const stringStore = createStore<string>();
stringStore.set("hello");
console.log(stringStore.value);
// stringStore.set(42);
// error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.

function createBoundedStore<T extends string | number>(): Store<T> {
  const store: Store<T> = {
    value: undefined,
    set(next) {
      store.value = next;
    },
  };
  return store;
}

const bounded = createBoundedStore();

// 후보가 없어도 unknown까지 물러나지 않고 string | number 제약에 머문다.
// 위의 store.set(true)는 통과하지만, 여기서는 제약 밖의 boolean이 막힌다.
bounded.set(42);
console.log(bounded.value);
// bounded.set(true);
// error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string | number'.

function createStoreWith<T>(initial: T): Store<T> {
  const store: Store<T> = {
    value: initial,
    set(next) {
      store.value = next;
    },
  };
  return store;
}

const readyStore = createStoreWith("ready");
// 제약이 없는 타입 매개변수는 리터럴 후보를 넓힌 타입으로 받는다. 그래서 T는 "ready"가 아니라 string이다.
// 증거는 바로 아래 두 줄이다 — set("go")는 통과하고, set(42)만 막힌다.
console.log(readyStore.value);
readyStore.set("go");
// readyStore.set(42);
// error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.

export {};
