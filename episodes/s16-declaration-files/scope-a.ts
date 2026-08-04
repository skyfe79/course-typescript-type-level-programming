// export {}; 유무에 따라 최상위 선언이 전역 스크립트에 보이는지 확인하는 파일입니다.
// export {};가 없을 때는 sharedFlag가 프로젝트 전체에서 보였고 tsc는 0 오류였지만, 지금은 모듈 안으로 제한됩니다.
// 검사: npx tsc --noEmit

// codeStep 240 — export {}; 한 줄이 파일 스코프를 모듈로 전환합니다.

const sharedFlag = true;

export {}; // 이 빈 export는 실행 값을 생성하지 않고 이 파일을 모듈로 분류합니다.

// 두 시점 실측(이 파일에서 export {}; 줄을, scope-b.ts에서 @ts-expect-error 줄을 함께 뺀 상태):
// 1단계 — 이 파일에 export {};가 없을 때: npx tsc --noEmit → 출력 0줄, 종료 코드 0.
//         두 파일 모두 전역 스크립트라 sharedFlag가 import 없이 scope-b.ts에서 보입니다.
// 2단계 — 거기에 이 파일의 export {}; 한 줄만 되돌렸을 때:
//         episodes/s16-declaration-files/scope-b.ts(7,28): error TS2304: Cannot find name 'sharedFlag'.
