let answer: number = random(100) + 1;
let guess: number = 0;
let attempts: number = 0;

while (guess != answer) {
  guess = toNumber(input("1에서 100 사이의 숫자를 맞혀보세요: "));
  attempts = attempts + 1;
  if (guess < answer) {
    print("UP");
  } else if (guess > answer) {
    print("DOWN");
  } else {
    print("정답입니다! 시도 횟수: " + toString(attempts));
  }
}
