// png 파일 import가 문자열 타입으로 해석되는지 확인하는 타입 검사 전용 파일입니다.
// 실제 이미지 파일 없이도 와일드카드 모듈 선언이 확장자 전체를 설명하는지 확인합니다.
// 검사: npx tsc --noEmit
// 실행하지 않음: 실제 로딩은 번들러의 몫이고 Node는 없는 png 파일을 찾으려다 실패합니다.

// codeStep 241 — 와일드카드 모듈 선언으로 png import의 타입을 설명합니다.

import logo from "./assets/logo.png";
// ./assets/logo.png는 디스크에 없습니다. 그런데도 검사가 통과하는 것이 이 파일의 요점입니다.
// global.d.ts의 declare module "*.png"가 그 확장자에 맞는 import 전부를 한꺼번에 설명하므로,
// 컴파일러는 파일이 실제로 있는지 보지 않고 그 선언만으로 logo의 타입을 정합니다.
// 실측 실행 오류(node episodes/s16-declaration-files/asset-check.ts):
// Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../episodes/s16-declaration-files/assets/logo.png' imported from .../episodes/s16-declaration-files/asset-check.ts
// 검사와 실행이 갈리는 자리입니다. 타입 층은 선언을 믿고, 런타임은 파일을 찾습니다.

const src: string = logo;
console.log(typeof src);
