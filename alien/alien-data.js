// 👾 외계인 단어 디펜스 단어 묶음: [영어, 뜻]
// 미션은 한 묶음을 '쏠 단어'로 정하고, 나머지 묶음 단어는 '지나가게 둘 단어'로 섞어요.
// 두 묶음에 다 들어갈 수 있는 단어(fish, orange, cook, drink …)는 넣지 않았어요.
window.ALIEN_GROUPS = {
  action: { name: "움직임 말 (동사)", emoji: "🏃", mission: "움직임을 나타내는 말(동사)을 쏘세요!", words: [
    ["run", "달리다"], ["jump", "뛰다"], ["swim", "수영하다"], ["walk", "걷다"], ["eat", "먹다"], ["sleep", "자다"],
    ["sing", "노래하다"], ["dance", "춤추다"], ["read", "읽다"], ["write", "쓰다"], ["fly", "날다"], ["kick", "차다"],
    ["throw", "던지다"], ["climb", "오르다"], ["sit", "앉다"], ["stand", "서다"], ["push", "밀다"], ["ride", "타다"],
    ["clap", "손뼉 치다"], ["laugh", "웃다"], ["cry", "울다"], ["catch", "잡다"], ["go", "가다"], ["come", "오다"]
  ] },
  thing: { name: "물건 이름", emoji: "📚", mission: "물건 이름(명사)을 쏘세요!", words: [
    ["book", "책"], ["desk", "책상"], ["chair", "의자"], ["pencil", "연필"], ["bag", "가방"], ["cup", "컵"],
    ["ball", "공"], ["door", "문"], ["window", "창문"], ["bed", "침대"], ["hat", "모자"], ["box", "상자"],
    ["clock", "시계"], ["shoe", "신발"], ["spoon", "숟가락"], ["table", "탁자"], ["phone", "전화기"], ["key", "열쇠"],
    ["lamp", "전등"], ["eraser", "지우개"], ["umbrella", "우산"], ["car", "자동차"]
  ] },
  animal: { name: "동물", emoji: "🐾", mission: "동물 이름을 쏘세요!", words: [
    ["cat", "고양이"], ["dog", "개"], ["lion", "사자"], ["tiger", "호랑이"], ["rabbit", "토끼"], ["bear", "곰"],
    ["duck", "오리"], ["frog", "개구리"], ["monkey", "원숭이"], ["horse", "말"], ["pig", "돼지"], ["cow", "소"],
    ["bird", "새"], ["snake", "뱀"], ["zebra", "얼룩말"], ["mouse", "쥐"], ["sheep", "양"], ["elephant", "코끼리"],
    ["panda", "판다"], ["giraffe", "기린"], ["fox", "여우"], ["penguin", "펭귄"]
  ] },
  food: { name: "먹을 것", emoji: "🍎", mission: "먹을 것을 쏘세요!", words: [
    ["apple", "사과"], ["banana", "바나나"], ["bread", "빵"], ["milk", "우유"], ["egg", "달걀"], ["pizza", "피자"],
    ["cake", "케이크"], ["rice", "밥"], ["grape", "포도"], ["carrot", "당근"], ["cookie", "쿠키"], ["juice", "주스"],
    ["cheese", "치즈"], ["candy", "사탕"], ["tomato", "토마토"], ["corn", "옥수수"], ["soup", "수프"], ["melon", "멜론"],
    ["peach", "복숭아"], ["lemon", "레몬"]
  ] },
  color: { name: "색깔", emoji: "🎨", mission: "색깔 이름을 쏘세요!", words: [
    ["red", "빨간색"], ["blue", "파란색"], ["green", "초록색"], ["yellow", "노란색"], ["pink", "분홍색"], ["black", "검은색"],
    ["white", "흰색"], ["purple", "보라색"], ["brown", "갈색"], ["gray", "회색"]
  ] }
};
