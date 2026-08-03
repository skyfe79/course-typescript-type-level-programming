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

export {};
