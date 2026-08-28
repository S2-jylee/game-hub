// ===================== 데이터 =====================

// 2벌식 자판 매핑 (물리 키코드 기준 -> 한글 자모 / 영문자)
const KEYMAP = [
  { code: 'KeyA', ko: 'ㅁ', en: 'a', row: 0, finger: 'L-pinky' },
  { code: 'KeyS', ko: 'ㄴ', en: 's', row: 0, finger: 'L-ring' },
  { code: 'KeyD', ko: 'ㅇ', en: 'd', row: 0, finger: 'L-middle' },
  { code: 'KeyF', ko: 'ㄹ', en: 'f', row: 0, finger: 'L-index' },
  { code: 'KeyG', ko: 'ㅎ', en: 'g', row: 0, finger: 'L-index' },
  { code: 'KeyH', ko: 'ㅗ', en: 'h', row: 0, finger: 'R-index' },
  { code: 'KeyJ', ko: 'ㅓ', en: 'j', row: 0, finger: 'R-index' },
  { code: 'KeyK', ko: 'ㅏ', en: 'k', row: 0, finger: 'R-middle' },
  { code: 'KeyL', ko: 'ㅣ', en: 'l', row: 0, finger: 'R-ring' },
  { code: 'KeyQ', ko: 'ㅂ', en: 'q', row: 1, finger: 'L-pinky' },
  { code: 'KeyW', ko: 'ㅈ', en: 'w', row: 1, finger: 'L-ring' },
  { code: 'KeyE', ko: 'ㄷ', en: 'e', row: 1, finger: 'L-middle' },
  { code: 'KeyR', ko: 'ㄱ', en: 'r', row: 1, finger: 'L-index' },
  { code: 'KeyT', ko: 'ㅅ', en: 't', row: 1, finger: 'L-index' },
  { code: 'KeyY', ko: 'ㅛ', en: 'y', row: 1, finger: 'R-index' },
  { code: 'KeyU', ko: 'ㅕ', en: 'u', row: 1, finger: 'R-index' },
  { code: 'KeyI', ko: 'ㅑ', en: 'i', row: 1, finger: 'R-middle' },
  { code: 'KeyO', ko: 'ㅐ', en: 'o', row: 1, finger: 'R-ring' },
  { code: 'KeyP', ko: 'ㅔ', en: 'p', row: 1, finger: 'R-pinky' },
  { code: 'KeyZ', ko: 'ㅋ', en: 'z', row: 2, finger: 'L-pinky' },
  { code: 'KeyX', ko: 'ㅌ', en: 'x', row: 2, finger: 'L-ring' },
  { code: 'KeyC', ko: 'ㅊ', en: 'c', row: 2, finger: 'L-middle' },
  { code: 'KeyV', ko: 'ㅍ', en: 'v', row: 2, finger: 'L-index' },
  { code: 'KeyB', ko: 'ㅠ', en: 'b', row: 2, finger: 'L-index' },
  { code: 'KeyN', ko: 'ㅜ', en: 'n', row: 2, finger: 'R-index' },
  { code: 'KeyM', ko: 'ㅡ', en: 'm', row: 2, finger: 'R-index' },
];
const KEY_ROWS = [
  KEYMAP.filter(k => k.row === 0),
  KEYMAP.filter(k => k.row === 1),
  KEYMAP.filter(k => k.row === 2),
];

// 손가락 가이드: 왼손 새끼~검지, 오른손 검지~새끼 순서
const FINGER_ORDER = ['L-pinky', 'L-ring', 'L-middle', 'L-index', 'R-index', 'R-middle', 'R-ring', 'R-pinky'];
const FINGER_LABELS = {
  'L-pinky': { hand: '왼손', name: '새끼손가락', size: 'pinky' },
  'L-ring': { hand: '왼손', name: '약지', size: 'ring' },
  'L-middle': { hand: '왼손', name: '중지', size: 'middle' },
  'L-index': { hand: '왼손', name: '검지', size: 'index' },
  'R-index': { hand: '오른손', name: '검지', size: 'index' },
  'R-middle': { hand: '오른손', name: '중지', size: 'middle' },
  'R-ring': { hand: '오른손', name: '약지', size: 'ring' },
  'R-pinky': { hand: '오른손', name: '새끼손가락', size: 'pinky' },
};

const WORD_LISTS = {
  rowword: {
    ko: [
      ['나라', '얼마', '어머니', '아마', '나이', '하나', '언니', '하마', '머리', '마리', '허리', '아이', '오이'],
      ['가방', '바다', '아버지', '가게', '사자', '바지', '지도', '자리', '다리', '사랑', '사람', '거리', '소리'],
      ['구두', '우리', '그림', '초록', '추억', '치마', '카드', '타조', '파도', '두부', '누나', '구름'],
    ],
    en: [
      ['dad', 'sad', 'lad', 'gal', 'gas', 'has', 'had', 'fall', 'hall', 'salad', 'flask', 'glass', 'shall', 'flag', 'half'],
      ['dark', 'hero', 'idea', 'tiger', 'paper', 'water', 'after', 'great', 'potato', 'order', 'tired', 'estate', 'gate', 'adopt', 'trade'],
      ['cloud', 'music', 'number', 'monkey', 'zebra', 'brave', 'cabin', 'picnic', 'banana', 'volume', 'canvas', 'jungle', 'bubble', 'mixture', 'symphony'],
    ],
  },
  random: {
    ko: ['학교', '친구', '행복', '오늘', '컴퓨터', '연습', '키보드', '감사', '여행', '사진', '음악', '생일', '점심', '저녁', '강아지', '고양이', '커피', '도서관', '병원', '시장', '바다', '하늘', '나무', '꽃', '구름', '바람', '봄', '여름', '가을', '겨울', '별', '달', '태양', '시간', '사랑', '우정', '희망', '미래', '추억', '계획'],
    en: ['apple', 'happy', 'garden', 'coffee', 'music', 'friend', 'travel', 'sunshine', 'ocean', 'mountain', 'rainbow', 'butterfly', 'cookie', 'puppy', 'kitten', 'dream', 'smile', 'gentle', 'breeze', 'autumn', 'winter', 'spring', 'summer', 'cloud', 'star', 'moon', 'planet', 'forest', 'river', 'meadow', 'candy', 'bubble', 'pastel', 'cozy', 'sparkle', 'whisper', 'journey', 'harmony', 'blossom', 'wonder'],
  },
};

const SENTENCES = {
  ko: [
    '오늘 하루도 힘내세요.',
    '커피 한 잔의 여유를 즐겨보세요.',
    '연습이 완벽을 만든다.',
    '꾸준함이 실력을 만든다.',
    '작은 습관이 큰 변화를 만든다.',
    '비가 오는 날엔 창밖을 바라본다.',
    '고양이가 창가에서 낮잠을 잔다.',
    '따뜻한 봄바람이 불어온다.',
    '친구와 함께 걷는 산책길이 좋다.',
    '오늘도 좋은 하루 보내세요.',
    '느리더라도 꾸준히 나아가자.',
    '행복은 작은 순간에 있다.',
    '새로운 시작을 응원합니다.',
    '푸른 하늘 아래 웃음꽃이 핀다.',
    '따뜻한 차 한잔이 마음을 녹인다.',
  ],
  en: [
    'Practice makes perfect every day.',
    'The early bird catches the worm.',
    'A gentle breeze drifts through the window.',
    'Coffee tastes better on a rainy day.',
    'Small steps lead to big changes.',
    'The cat is sleeping in the sun.',
    'Kindness is a language everyone understands.',
    'Every sunset brings the promise of a new dawn.',
    'She smiled and waved from across the street.',
    'Good things come to those who wait.',
    'Keep calm and type on.',
    'The garden bloomed with pastel flowers.',
    'A cup of tea makes everything better.',
    'Dream big and work hard.',
    'Happiness is found in little things.',
  ],
};

// 글연습 항목
// - essay: 이 프로젝트를 위해 새로 쓴 창작 예문 (source 없음)
// - novel/lyrics/script: 저작권이 만료된 실제 고전 작품 발췌 (퍼블릭 도메인, 위키문헌/구텐베르크 프로젝트 원문 대조)
//   한자 병기나 옛 표기 일부는 타이핑 연습에 맞게 현대 한글 표기로만 남겼습니다.
function passage(text, source) {
  return { text, source };
}

const PASSAGES = {
  essay: {
    ko: [
      passage('타자 연습은 꾸준함이 가장 중요합니다. 처음에는 손가락이 어색하고 속도도 느리게 느껴지겠지만, 매일 조금씩 연습하다 보면 어느새 손가락이 자판 위를 자연스럽게 움직이게 됩니다. 정확하게 치는 습관을 먼저 기르고, 그다음에 속도를 높여 나가는 것이 좋은 방법입니다. 오늘도 즐거운 마음으로 연습을 시작해 볼까요? 하루 10분씩이라도 매일 반복하면, 한 달 후에는 몰라보게 달라진 손가락을 만나게 될 거예요.', ''),
      passage('봄이 되면 온 세상이 초록빛으로 물들기 시작합니다. 겨우내 움츠렸던 나뭇가지에서는 여린 새싹이 돋아나고, 길가에는 이름 모를 꽃들이 하나둘 피어납니다. 사람들은 두꺼운 외투를 벗고 가벼운 옷차림으로 거리를 걷습니다. 따뜻한 햇살 아래에서 산책을 하다 보면 저절로 콧노래가 나옵니다. 겨울 동안 쌓였던 먼지를 씻어내듯, 봄비가 한 차례 지나가고 나면 거리는 한층 더 싱그러운 초록으로 물듭니다.', ''),
      passage('고양이는 하루의 대부분을 잠으로 보내는 동물입니다. 햇살이 잘 드는 창가나 포근한 담요 위에서 몸을 동그랗게 말고 낮잠을 즐깁니다. 하지만 눈을 뜨는 순간에는 놀라운 순발력을 보여주기도 합니다. 작은 소리에도 귀를 쫑긋 세우고, 움직이는 물체를 향해 재빠르게 몸을 날립니다. 이런 반전 매력 때문에 사람들은 고양이를 오랫동안 사랑해 왔습니다.', ''),
      passage('새벽 공기는 유난히 맑고 차갑습니다. 아직 잠들어 있는 도시 위로 첫 버스가 지나가고, 가로등은 하나둘 꺼지기 시작합니다. 이 고요한 시간을 좋아하는 사람들은 이른 아침의 산책이나 조깅으로 하루를 엽니다. 부지런한 하루의 시작은 언제나 작은 뿌듯함을 안겨줍니다.', ''),
      passage('도서관의 냄새를 좋아하는 사람들이 있습니다. 오래된 종이와 잉크가 뒤섞인 그 특유의 냄새는 어쩐지 마음을 차분하게 가라앉혀 줍니다. 책장 사이를 걷다 보면 낯선 제목의 책 한 권이 눈에 들어오고, 그렇게 우연한 만남에서 좋은 책을 발견하기도 합니다.', ''),
      passage('여행의 즐거움은 목적지에만 있지 않습니다. 낯선 기차역에서 시간표를 확인하는 순간, 창밖으로 스쳐 지나가는 풍경, 처음 먹어보는 지역 음식까지, 그 모든 과정이 여행의 일부입니다. 계획대로 되지 않는 순간조차 나중엔 좋은 추억이 됩니다.', ''),
      passage('손편지를 쓰는 사람이 점점 줄어들고 있습니다. 그러나 정성껏 눌러쓴 글씨와 종이의 질감은 메시지 앱이 흉내 낼 수 없는 온기를 담고 있습니다. 가끔은 느리더라도 마음이 전해지는 방법을 택하는 것도 좋은 일입니다.', ''),
      passage('비 오는 날 창문에 맺힌 물방울을 가만히 바라본 적이 있나요? 물방울이 천천히 흘러내리며 서로 만나고 갈라지는 모습은 마치 작은 강물 같습니다. 별것 아닌 풍경이지만, 가만히 들여다보면 시간 가는 줄 모르게 됩니다.', ''),
      passage('요리를 배우는 과정은 실패의 연속입니다. 소금을 너무 많이 넣기도 하고, 불 조절에 실패해 태우기도 합니다. 하지만 몇 번의 시행착오 끝에 완성한 한 그릇의 요리는 그 어떤 것보다 뿌듯한 성취감을 안겨줍니다.', ''),
      passage('밤하늘의 별을 보려면 무엇보다 어둠에 익숙해질 시간이 필요합니다. 처음에는 아무것도 보이지 않다가, 몇 분이 지나면 하나둘 별이 눈에 들어오기 시작합니다. 인내심을 가지고 기다리는 법을 별빛에게서 배우게 됩니다.', ''),
    ],
    en: [
      passage("Typing practice is all about consistency. At first, your fingers may feel clumsy and your speed may feel painfully slow, but with a little practice every day, your fingers will soon move naturally across the keyboard. It is best to build accurate habits first, and then gradually increase your speed. Why not start today's practice with a cheerful heart? Even just ten minutes a day, repeated consistently, can make a noticeable difference within a single month.", ''),
      passage('When spring arrives, the whole world slowly turns green again. Tiny buds sprout from branches that shivered through the winter, and unnamed flowers begin to bloom along the streets one by one. People shed their heavy coats for lighter clothes and stroll through town. Walking beneath the warm sunshine, you might find yourself humming a little tune. Just as spring rain washes away the dust of winter, the streets grow even greener and fresher after each shower.', ''),
      passage('Cats spend most of their day sleeping. They curl up into a cozy circle on a sunlit windowsill or a soft blanket, enjoying a long nap. Yet the moment they open their eyes, they can show surprising bursts of energy. Their ears perk up at the smallest sound, and they can pounce swiftly toward anything that moves. It is this delightful contrast that has made cats such beloved companions for so long.', ''),
      passage("The early morning air feels especially clear and cool. The first bus of the day passes through a city still half asleep, and the streetlights begin to switch off one by one. People who love this quiet hour often start their day with a walk or a jog. Beginning the day early always brings a small sense of pride.", ''),
      passage('Some people simply love the smell of a library. The distinct scent of old paper mixed with ink has a way of calming the mind. Wandering between the shelves, an unfamiliar title might catch your eye, and that is often how the best books are discovered.', ''),
      passage("The joy of travel is not only found at the destination. Checking a timetable at an unfamiliar train station, watching scenery rush past the window, tasting a local dish for the first time - all of these moments are part of the journey. Even the times things don't go as planned become good memories later.", ''),
      passage('Fewer and fewer people write letters by hand these days. Yet careful handwriting and the texture of paper carry a warmth that no messaging app can imitate. Sometimes it is worth choosing the slower way, if it means the feeling comes through more clearly.', ''),
      passage('Have you ever quietly watched raindrops gather on a window? As they slide down slowly, meeting and splitting apart, they look like tiny rivers. It is such a small thing to watch, yet time seems to pass without notice.', ''),
      passage('Learning to cook is a series of small failures. Sometimes there is too much salt, sometimes the heat is wrong and something burns. But after a few rounds of trial and error, a single finished dish can bring more satisfaction than almost anything else.', ''),
      passage('Seeing stars in the night sky first requires time for your eyes to adjust to the dark. At first nothing seems visible, but after a few minutes, stars begin to appear one by one. Patience is a lesson the night sky teaches quietly.', ''),
    ],
  },
  novel: {
    ko: [
      passage(
        '새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 비가 추적추적 내리었다. 이날이야말로 동소문 안에서 인력거꾼 노릇을 하는 김 첨지에게는 오래간만에도 닥친 운수 좋은 날이었다. 문안에(거기도 문밖은 아니지만) 들어간답시는 앞집 마나님을 전찻길까지 모셔다 드린 것을 비롯으로 행여나 손님이 있을까 하고 정류장에서 어정어정하며 내리는 사람 하나하나에게 거의 비는 듯한 눈결을 보내고 있다가 마침내 교원인 듯한 양복장이를 동광학교까지 태워다 주기로 되었다.\n\n첫번에 삼십 전, 둘째 번에 오십 전 - 아침 댓바람에 그리 흔치 않은 일이었다. 그야말로 재수가 옴붙어서 근 열흘 동안 돈 구경도 못한 김 첨지는 십 전짜리 백통화 서 푼, 또는 다섯 푼이 찰깍하고 손바닥에 떨어질 제 거의 눈물을 흘릴 만큼 기뻤었다. 더구나 이날 이때에 이 팔십 전이라는 돈이 그에게 얼마나 유용한지 몰랐다.',
        '현진건, 「운수 좋은 날」(1924) · 퍼블릭 도메인'
      ),
      passage(
        '여름장이란 애시당초에 글러서, 해는 아직 중천에 있건만 장판은 벌써 쓸쓸하고 더운 햇발이 벌여놓은 전 휘장 밑으로 등줄기를 훅훅 볶는다. 마을 사람들은 거지 반 돌아간 뒤요, 팔리지 못한 나무꾼 패가 길거리에 궁싯거리고들 있으나 석유병이나 받고 고깃마리나 사면 족할 이 축들을 바라고 언제까지든지 버티고 있을 법은 없다. 얼금뱅이요 왼손잡이인 드팀전의 허 생원은 기어코 동업의 조 선달에게 나꾸어 보았다.\n\n"그만 거둘까?"\n"잘 생각했네. 봉평 장에서 한번이나 흐붓하게 사본 일 있을까해. 내일 대화 장에서가 한몫 벌어야겠네."\n"오늘 밤은 밤을 새서 걸어야 될걸?"\n"달이 뜨렷다?"',
        '이효석, 「메밀꽃 필 무렵」(1936) · 퍼블릭 도메인'
      ),
      passage(
        '"뭐 어디 빈자리가 있어야지." K사장은 안락의자에 푹신 파묻힌 몸을 뒤로 벌떡 젖히며 하품을 하듯이 시원찮게 대답을 한다. 미상불 그는 두 팔을 쭉 내뻗고 기지개라도 한 번 쓰고 싶은 것을 겨우 참는 눈치다.\n\n이 K사장과 둥근 탁자를 사이에 두고 공손히 마주 앉아 얼굴에는 나는 선배인 선생님을 극히 존경하고 앙모합니다 하는 비굴한 미소를 띠고 있는, 구변 없는 구변을 다하여 직업 동냥의 구걸 문구를 기다랗게 늘어놓던 P는 그러나 취직운동에 백전백패의 노졸인지라 K씨의 힘 아니 드는 한마디의 거절에도 새삼스럽게 실망도 아니한다.',
        '채만식, 「레디메이드 인생」(1934) · 퍼블릭 도메인'
      ),
      passage('낡은 우체통 속에서 오래된 편지 한 통을 발견한 건 순전히 우연이었다. 누렇게 바랜 봉투에는 낯선 필체로 자신의 이름이 적혀 있었다. 봉투를 열기까지 그녀는 한참을 망설였다. 어쩌면 그 안에는, 잊고 지낸 시간이 고스란히 담겨 있을지도 몰랐다.\n\n떨리는 손으로 봉투를 뜯자, 색이 바랜 편지지 세 장이 나왔다. 첫 줄을 읽는 순간 그녀는 그 자리에 얼어붙고 말았다. 십 년도 더 전에, 이사를 가며 미처 전하지 못했던 마지막 인사였다. 그때는 몰랐던 진심이 이제야 뒤늦게 도착한 셈이었다.\n\n그녀는 편지를 가슴에 품은 채 한참을 그렇게 서 있었다. 답장을 보낼 수 없다는 걸 알면서도, 마음속으로는 이미 몇 번이고 답장을 쓰고 있었다.', ''),
      passage('바닷가 마을에 도착했을 때는 이미 해가 저물고 있었다. 짠내 섞인 바람이 옷깃을 스쳐 지나갔고, 멀리서 등대 불빛이 규칙적으로 깜빡였다. 그는 오랫동안 이곳을 그리워했지만, 막상 다시 서 있으니 낯설게만 느껴졌다.\n\n골목 어귀에 있던 구멍가게는 문을 닫은 지 오래인 듯 셔터가 녹슬어 있었다. 어릴 적 매일같이 들르던 그곳에서, 그는 늘 같은 자리에 앉아 아이스크림을 먹곤 했다. 지금은 그 자리에 잡초만 무성했다.\n\n파도 소리를 들으며 방파제를 걷다 보니, 문득 이곳을 떠나던 날의 기억이 떠올랐다. 그때는 다시 돌아올 일이 없을 거라 생각했었다. 하지만 사람은 결국, 자신이 떠나온 곳으로 한 번쯤은 돌아오게 되는 모양이었다.', ''),
      passage('할머니의 낡은 재봉틀에서는 여전히 특유의 삐걱거리는 소리가 났다. 그 소리를 들을 때마다 어린 시절 방바닥에 엎드려 숙제를 하던 오후가 떠올랐다. 시간이 이만큼 흘렀는데도, 그 소리만은 조금도 변하지 않았다.\n\n할머니는 돌아가시기 전까지도 매일 오후가 되면 그 재봉틀 앞에 앉으셨다. 손주들의 옷을 고쳐주고, 이웃들의 부탁을 들어주며 하루를 보내셨다. 그때는 그 시간이 얼마나 소중한지 미처 알지 못했다.\n\n이제 그 재봉틀은 다락방 한구석을 지키고 있을 뿐이지만, 가끔 꺼내어 먼지를 닦아낼 때면 할머니의 손길이 아직 그 위에 남아 있는 것만 같았다.', ''),
      passage('폭우가 쏟아지던 그날 밤, 정전으로 온 동네가 캄캄해졌다. 초 하나에 의지해 마주 앉은 가족들은 오랜만에 서로의 얼굴을 오래 들여다보았다. 텔레비전도 휴대폰도 없는 그 몇 시간이, 뜻밖에도 가장 따뜻한 저녁으로 남았다.\n\n아버지는 오래된 이야기를 꺼내셨다. 젊은 시절 이 집으로 처음 이사 오던 날의 이야기였다. 어머니는 그 이야기에 몇 번이나 웃음을 터뜨리셨고, 아이들은 처음 듣는 부모님의 옛날이야기에 눈을 반짝였다.\n\n전기가 다시 들어왔을 때, 누구도 선뜻 불을 켜지 않았다. 어둠 속에서 나눈 이야기가 아직 끝나지 않았기 때문이었다.', ''),
      passage('그녀는 창가에 서서 오래도록 거리를 내려다보았다. 가로등 불빛이 하나둘 켜지는 저녁, 낯선 발걸음 소리가 골목을 지나갔다. 무언가를 기다리는 사람처럼, 그녀는 좀처럼 자리를 뜨지 못했다. 시간은 더디게 흘렀고, 마음속에서는 오래된 질문 하나가 다시 떠올랐다.\n\n언제부터 이 창가에 서는 습관이 생겼는지는 정확히 기억나지 않았다. 다만 하루의 끝에서 이렇게 거리를 내려다보고 있으면, 복잡했던 마음이 조금은 가라앉는 것 같았다.\n\n저 멀리서 누군가 우산을 접으며 건물 안으로 들어서는 모습이 보였다. 그녀는 그제야 창문에서 몸을 돌려, 불 꺼진 방 안으로 천천히 걸어 들어갔다.', ''),
      passage('노인은 낡은 지도를 펼쳐 놓고 손끝으로 산맥의 능선을 따라갔다. 젊은 시절 걸었던 길이었다. 이제는 다리가 예전 같지 않았지만, 마음만은 여전히 그 산 어딘가를 헤매고 있었다. 창밖으로 눈이 내리기 시작했다.\n\n지도 위의 지명들은 이제 많이 바뀌었을 것이다. 그가 알던 작은 마을들은 사라지거나 이름을 바꾸었을 테고, 그가 넘었던 고개에는 이제 도로가 뚫렸을지도 몰랐다. 그래도 지도를 펼칠 때마다 그는 다시 스물몇 살의 청년이 되는 기분이었다.\n\n손녀가 방문을 열고 들어와 무얼 하시냐고 물었다. 노인은 웃으며 지도를 접었다. "언젠가 같이 가보자꾸나." 그 말에 담긴 오랜 그리움을, 손녀는 아직 다 이해하지 못하는 눈치였다.', ''),
      passage('기차는 정확히 자정에 도착했다. 플랫폼에는 아무도 없었고, 오직 희미한 안내 방송만이 울려 퍼졌다. 그는 트렁크를 끌고 천천히 계단을 내려갔다. 이 도시에서의 첫날 밤이, 그렇게 조용히 시작되고 있었다.\n\n역 앞 광장에는 가로등 몇 개만이 드문드문 불을 밝히고 있었다. 예약해 둔 숙소까지는 걸어서 이십 분 남짓이라고 했다. 낯선 거리를 걷는 발걸음은 조심스러웠지만, 이상하게도 마음 한구석은 설레고 있었다.\n\n숙소에 도착해 짐을 내려놓고 창문을 열자, 저 멀리 도시의 불빛이 한눈에 들어왔다. 그는 오랫동안 그 풍경을 바라보았다. 내일부터 시작될 새로운 하루하루가, 이 낯선 불빛들처럼 조금씩 익숙해지기를 바라면서.', ''),
    ],
    en: [
      passage(
        'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
        "Lewis Carroll, Alice's Adventures in Wonderland (1865) · Public Domain"
      ),
      passage(
        'It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.\n\n"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"',
        'Jane Austen, Pride and Prejudice (1813) · Public Domain'
      ),
      passage(
        'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.',
        'Charles Dickens, A Tale of Two Cities (1859) · Public Domain'
      ),
      passage(
        "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.",
        'Herman Melville, Moby-Dick (1851) · Public Domain'
      ),
      passage(
        "Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon 'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail.",
        'Charles Dickens, A Christmas Carol (1843) · Public Domain'
      ),
      passage(
        'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.',
        'Mary Shelley, Frankenstein (1818) · Public Domain'
      ),
      passage(
        "My father's family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip, and came to be called Pip.",
        'Charles Dickens, Great Expectations (1861) · Public Domain'
      ),
      passage(
        '"Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug.\n"It\'s so dreadful to be poor!" sighed Meg, looking down at her old dress.\n"I don\'t think it\'s fair for some girls to have plenty of pretty things, and other girls nothing at all," added little Amy.',
        'Louisa May Alcott, Little Women (1868) · Public Domain'
      ),
      passage(
        'Mrs. Rachel Lynde lived just where the Avonlea main road dipped down into a little hollow, with alder trees and ladies\' eardrops. There are plenty of people who can attend closely to their neighbors\' business by dint of neglecting their own; but Mrs. Rachel Lynde was one of those capable creatures who can manage their own concerns and those of other folks into the bargain.',
        "Lucy Maud Montgomery, Anne of Green Gables (1908) · Public Domain"
      ),
      passage(
        'Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer\'s wife. Their house was small, for the lumber to build it had to be carried by wagon many miles. There were four walls, a floor and a roof, which made one room.',
        'L. Frank Baum, The Wonderful Wizard of Oz (1900) · Public Domain'
      ),
    ],
  },
  lyrics: {
    ko: [
      passage('밤하늘 저 별빛보다\n더 반짝이는 건 너의 눈\n손끝이 스칠 때마다\n심장이 쿵 하고 뛰어\n\n말하지 않아도 알잖아\n이 떨림이 뭔지\n오늘 밤은 너와 나\n이 순간이 전부야', '연습용 창작 가사'),
      passage('높이 더 높이 날아올라\n두려움 따위는 버려둬\n내가 나일 수 있는 이유\n그게 바로 너니까\n\n빛나는 무대 위에서\n주인공은 바로 나\n흔들리지 않을게\n끝까지 가볼게', '연습용 창작 가사'),
      passage('괜찮아 울어도 괜찮아\n오늘 하루쯤은\n내일 다시 웃을 거니까\n걱정하지 마\n\n네가 있어 다행이야\n이 밤이 지나가도\n우리 함께라면\n뭐든 할 수 있어', '연습용 창작 가사'),
      passage('여름밤 바람을 타고\n우리 둘이 걸어가\n네온사인 반짝이는 거리\n노래를 부르며\n\n지금 이 순간 기억해줘\n영원할 것처럼\n너와 나 이 밤을\n영원히 간직할게', '연습용 창작 가사'),
      passage('심장이 뛰는 소리\n너에게 들릴까\n조심스럽게 다가가\n손을 내밀어봐\n\n달빛 아래 춤을 춰\n둘만의 세상에서\n오늘 밤이 지나도\n잊지 않을 거야', '연습용 창작 가사'),
      passage('다시 일어설 거야\n넘어져도 괜찮아\n이 길 끝에 뭐가 있을지\n아무도 모르니까\n\n두 손을 꼭 잡고서\n앞으로 걸어가자\n우리가 만든 이 노래\n끝까지 불러보자', '연습용 창작 가사'),
      passage('스쳐 지나간 인연도\n소중한 이유가 있어\n그때는 몰랐던 감정\n이제는 알 것 같아\n\n너를 만나고 나서야\n나는 조금 더 자랐어\n고마워 그 시절의 나에게\n이제는 웃으며 안녕', '연습용 창작 가사'),
      passage('새벽을 달리는 우리\n지친 하루는 잊어\n창문을 열어젖히면\n펼쳐지는 별빛\n\n꿈이라고 해도 좋아\n이 순간이 진짜라면\n너와 함께라면\n어디든 갈 수 있어', '연습용 창작 가사'),
      passage('말 없이 건넨 그 손길\n따뜻했던 그 온기\n잊지 못해 자꾸만\n생각이 나\n\n다시 만나는 날엔\n웃으며 인사할게\n그리웠다는 말 대신\n안아줄게', '연습용 창작 가사'),
      passage('빛나는 너의 미소가\n오늘 하루를 살게 해\n지친 나를 일으켜주는\n단 하나의 이유\n\n함께라면 두렵지 않아\n어떤 어둠도 괜찮아\n너와 나 우리라는 이름으로\n끝까지 걸어갈게', '연습용 창작 가사'),
    ],
    en: [
      passage("Under the city lights tonight\nyour eyes shine brighter than the stars\nEvery time our fingers touch\nmy heart forgets how to slow down\n\nYou don't have to say a word\nI already know it's real\nTonight it's just you and me\nthis moment is everything", 'Original practice lyrics'),
      passage("Fly a little higher now\nleave your fears down on the ground\nThe reason I can be myself\nis simply because of you\n\nUnder the spotlight, on this stage\nI'm the main character tonight\nI won't let myself shake\nI'll go all the way", 'Original practice lyrics'),
      passage("It's okay to cry tonight\njust for today, let it out\nTomorrow you'll be smiling again\nso don't you worry now\n\nI'm glad that you are here\neven when this night fades away\nas long as we're together\nwe can make it through anything", 'Original practice lyrics'),
      passage("Riding on a summer breeze\nwe're walking side by side\nUnder neon lights that glow\nwe're singing to the night\n\nRemember this right now\nlike it's going to last forever\nYou and me, this very night\nI'll keep it close forever", 'Original practice lyrics'),
      passage("Can you hear my heartbeat now\nbeating faster just for you\nI'm taking one step closer\nreaching out my hand to you\n\nDancing underneath the moon\nin a world made just for two\nEven when tonight is over\nI won't forget this feeling", 'Original practice lyrics'),
      passage("I'm gonna stand back up again\nit's alright if I fall down\nNobody knows what's waiting\nat the end of this long road\n\nSo hold my hand a little tighter\nlet's keep walking straight ahead\nThis song that we made together\nlet's sing it till the very end", 'Original practice lyrics'),
      passage("Even the people who passed by\nhad a reason to be there\nFeelings I never understood\nnow I finally see them clear\n\nIt was meeting you that helped me\ngrow a little more each day\nThank you to my younger self\nnow I can smile and say goodbye", 'Original practice lyrics'),
      passage("Driving through the break of dawn\nleaving all this day behind\nRoll the window down a little\nand the starlight fills the sky\n\nCall it a dream if you want\nas long as this moment is real\nAs long as I'm here with you\nwe could go anywhere at all", 'Original practice lyrics'),
      passage("That quiet touch you gave me\nstill feels warm inside my hand\nI can't stop thinking about it\nit keeps replaying in my mind\n\nWhen we finally meet again\nI'll greet you with a smile\nInstead of saying that I missed you\nI'll just hold you tight", 'Original practice lyrics'),
      passage("Your shining smile tonight\nis the reason I get through today\nThe only reason that I'm standing\nwhen I'm ready to give up\n\nI'm not afraid of anything\nas long as we're together\nUnder the name of us\nI'll keep walking till the end", 'Original practice lyrics'),
    ],
  },
  script: {
    ko: [
      passage(
        '김첨지: (아내의 머리를 흔들며) 이 년아, 말을 해, 말을! 입이 붙었어, 이 오라질 년!\n아내: (대답이 없다)\n김첨지: (다시 흔들며) 으응, 이것 봐, 아무 말이 없네.\n아내: (대답이 없다)\n김첨지: (목소리가 떨리며) 이년아, 죽었단 말이냐, 왜 말이 없어.\n아내: (대답이 없다)\n김첨지: (울먹이며) 으응, 또 대답이 없네, 정말 죽었나버이.\n김첨지: (얼굴을 마주 비비며) 이 눈깔! 이 눈깔! 왜 나를 바라보지 못하고 천정만 보느냐, 응.\n김첨지: (미친 듯이 중얼거리며) 설렁탕을 사다놓았는데 왜 먹지를 못하니, 왜 먹지를 못하니... 괴상하게도 오늘은! 운수가 좋더니만...',
        '현진건, 「운수 좋은 날」(1924) 결말부 · 퍼블릭 도메인'
      ),
      passage(
        '학생: (다급하게 뛰어나오며) 남대문 정거장까지 얼마요?\n김첨지: (잠깐 주저하며) 남대문 정거장까지 말씀입니까.\n학생: (초조한 듯) 그래 남대문 정거장까지 얼마란 말이요?\n김첨지: (불쑥) 일 원 오십 전만 줍시요.\n학생: (고개를 기웃하며) 일 원 오십 전은 너무 과한데.\n김첨지: (빙글빙글 웃으며) 아니올시다. 잇수로 치면 여기서 거기가 시오 리가 넘는답니다. 또 이런 진날은 좀 더 주셔야지요.\n학생: (총총히 짐을 챙기며) 그러면 달라는 대로 줄 터이니 빨리 가요.',
        '현진건, 「운수 좋은 날」(1924) 중 · 퍼블릭 도메인'
      ),
      passage(
        'P: (비굴한 미소를 지으며) 글쎄올시다, 그러시다면 지금 당장 어떻게 해주십사고 무리하게 조를 수야 있겠습니까마는... 그러면 이 담에 결원이 있다든지 하면 그때는 꼭...\nK사장: (하품 섞인 목소리로) 결원이 그렇게 나나 어데... 그러고 간혹가다가 결원이 난다더래도 유력한 후보자가 몇십 명씩 밀려 있어서...\nK사장: (혀를 차며) 거 참 큰일들 났어. 저렇게 좋은 청년들이 일거리가 없어서 저렇게들 애를 쓰니.\nP: (말 중동을 갈라 반문하며) 농촌으로 돌아가서 무얼 합니까?',
        '채만식, 「레디메이드 인생」(1934) 중 · 퍼블릭 도메인'
      ),
      passage('민준: (반갑게 손을 흔들며) 오랜만이야.\n서연: (웃으며) 그러게, 정말 오랜만이네.\n민준: (다가서며) 잘 지냈어?\n서연: (어깨를 으쓱하며) 그럭저럭. 너는?\n민준: (미소 지으며) 나도 그럭저럭 지냈어.', ''),
      passage('지훈: (자신 있게) 이번 일은 내가 맡을게.\n하은: (걱정스러운 표정으로) 혼자서 괜찮겠어?\n지훈: (손을 내저으며) 걱정하지 마, 잘 해낼 수 있어.\n하은: (한숨을 쉬며) 그래, 믿을게. 대신 무리하지는 마.', ''),
      passage('수아: (하늘을 올려다보며) 오늘따라 하늘이 예쁘다.\n도윤: (고개를 끄덕이며) 그러게, 노을이 진짜 곱네.\n수아: (미소 지으며) 이런 날은 그냥 걷고 싶어져.\n도윤: (손을 내밀며) 그럼 우리, 조금만 더 걸을까?', ''),
      passage('재민: (놀란 눈으로) 이거 진짜 네가 만든 거야?\n소율: (뿌듯하게) 응, 밤새 연습했어.\n재민: (엄지를 치켜세우며) 대박, 완전 잘하는데?\n소율: (수줍게 웃으며) 그렇게 말해주니 고맙다.', ''),
      passage('현우: (급하게 다가오며) 오늘 회의 어떻게 됐어?\n지아: (안도하며) 생각보다 잘 끝났어.\n현우: (가슴을 쓸어내리며) 다행이다, 걱정 많이 했는데.\n지아: (웃으며) 네 덕분에 준비 잘 됐어, 고마워.', ''),
      passage('은서: (달력을 보며) 우리 언제 또 만날까?\n태윤: (잠시 생각하다) 다음 주말 어때?\n은서: (밝게 웃으며) 좋아, 그때 보자.\n태윤: (손을 흔들며) 그래, 연락할게.', ''),
      passage('유진: (지도를 들여다보며) 이 길이 맞나?\n서준: (고개를 갸웃하며) 지도상으로는 맞는데... 좀 이상하다.\n유진: (앞을 가리키며) 일단 조금만 더 가보자.\n서준: (따라가며) 그래, 그러자.', ''),
    ],
    en: [
      passage(
        "ROMEO: (gazing upward) But soft, what light through yonder window breaks? It is the east, and Juliet is the sun! Arise fair sun and kill the envious moon, who is already sick and pale with grief.\nJULIET: (sighing) Ay me.\nROMEO: (whispering) She speaks. O speak again, bright angel, for thou art as glorious to this night, being o'er my head, as is a winged messenger of heaven.\nJULIET: O Romeo, Romeo, wherefore art thou Romeo? Deny thy father and refuse thy name. Or if thou wilt not, be but sworn my love, and I'll no longer be a Capulet.\nROMEO: (aside) Shall I hear more, or shall I speak at this?",
        'William Shakespeare, Romeo and Juliet (1597), Act 2 Scene 2 · Public Domain'
      ),
      passage(
        "JULIET: (impatiently) Now, good sweet Nurse, O Lord, why look'st thou sad? Though news be sad, yet tell them merrily; if good, thou sham'st the music of sweet news by playing it to me with so sour a face.\nNURSE: (catching her breath) I am aweary, give me leave awhile; fie, how my bones ache! What a jaunt have I had!\nJULIET: (pleading) I would thou hadst my bones, and I thy news. Nay come, I pray thee speak; good, good Nurse, speak.\nNURSE: (still out of breath) Jesu, what haste? Can you not stay a while? Do you not see that I am out of breath?",
        'William Shakespeare, Romeo and Juliet (1597), Act 2 Scene 5 · Public Domain'
      ),
      passage(
        "BEATRICE: (mockingly) I wonder that you will still be talking, Signior Benedick: nobody marks you.\nBENEDICK: (grinning) What! my dear Lady Disdain, are you yet living?\nBEATRICE: (sharply) Is it possible Disdain should die while she hath such meet food to feed it as Signior Benedick? Courtesy itself must convert to disdain if you come in her presence.\nBENEDICK: (unbothered) Then is courtesy a turncoat. But it is certain I am loved of all ladies, only you excepted.",
        'William Shakespeare, Much Ado About Nothing (1599), Act 1 Scene 1 · Public Domain'
      ),
      passage("MINJUN: (waving happily) It's been a while.\nSEOYEON: (smiling) Yeah, it really has.\nMINJUN: (stepping closer) How have you been?\nSEOYEON: (shrugging) So-so. And you?\nMINJUN: (grinning) Same here, I guess.", ''),
      passage("JIHOON: (confidently) I'll take care of this one.\nHAEUN: (worried) Are you sure you can handle it alone?\nJIHOON: (waving it off) Don't worry, I can pull it off.\nHAEUN: (sighing) Okay, I trust you. Just don't push yourself too hard.", ''),
      passage("SUA: (looking up at the sky) The sky looks so pretty today.\nDOYUN: (nodding) Yeah, the sunset is really lovely.\nSUA: (smiling) Days like this make me want to just walk.\nDOYUN: (holding out a hand) Then, shall we walk a little longer?", ''),
      passage("OLIVIA: (surprised) Did you really make this yourself?\nNOAH: (proudly) Yeah, I practiced all night.\nOLIVIA: (giving a thumbs up) Wow, that's really impressive.\nNOAH: (blushing a little) Thanks, that means a lot.", ''),
      passage("ETHAN: (rushing in) How did the meeting go today?\nMIA: (relieved) Better than I expected.\nETHAN: (sighing with relief) I'm relieved, I was worried.\nMIA: (smiling) Thanks to you, we were well prepared.", ''),
      passage("GRACE: (checking the calendar) When should we meet again?\nLUCAS: (thinking for a moment) How about next weekend?\nGRACE: (brightly) Sounds good, see you then.\nLUCAS: (waving) Great, I'll text you.", ''),
      passage("ZOE: (studying the map) Is this the right way?\nJACK: (tilting his head) According to the map, yes, but something feels off.\nZOE: (pointing ahead) Let's just go a little further.\nJACK: (following) Alright, let's do that.", ''),
    ],
  },

  // --- 아래는 K-pop 가사를 직접 추가하고 싶을 때 쓰는 자리입니다 ---
  // passage('가사 1행\\n가사 2행\\n\\n(빈 줄로 문단/절 구분)', '아티스트 - 곡명') 형식으로
  // lyrics.ko 또는 lyrics.en 배열 안에 원하는 만큼 추가하면 됩니다.
};

// 난이도별 설정 (레벨 1일 때 기준값 + 레벨업마다 가산/감산되는 값)
const DIFFICULTIES = {
  // 1-1(쉬움 1단계)은 독수리타법으로 천천히 치는 어르신도 여유있게 잡을 수 있도록 아주 느리게
  easy: { label: '쉬움', lives: 4, baseSpeed: 9, speedPerLevel: 2, baseSpawnDelay: 4200, spawnDelayPerLevel: 80, minSpawnDelay: 2200 },
  normal: { label: '보통', lives: 3, baseSpeed: 28, speedPerLevel: 6, baseSpawnDelay: 2300, spawnDelayPerLevel: 150, minSpawnDelay: 1200 },
  hard: { label: '어려움', lives: 2, baseSpeed: 38, speedPerLevel: 8, baseSpawnDelay: 1900, spawnDelayPerLevel: 170, minSpawnDelay: 900 },
};
const GAME_LEVEL_MAX = 5;
const GAME_WORDS_PER_LEVEL = 24; // 36개는 너무 길다고 해서 2/3로 줄임
const BONUS_CHANCE = 0.18; // 내려오는 단어 중 특수 단어가 나올 확률
const BONUS_TYPES = ['slow', 'freeze', 'clear'];

// ===================== 상태 =====================

const state = {
  view: 'home', // 'home' | 'practice'
  mode: 'position',
  lang: 'ko',
  stages: new Set([0]), // 자리 단계는 여러 개를 동시에, 자유 조합으로 선택할 수 있다
  passageCategory: 'essay',
  lastSentence: '',
  lastPassageText: '',
  targetText: '',
  startTime: null,
  correctCount: 0,
  incorrectCount: 0,
  finished: false,
  // position mode
  posSequence: [],
  posIndex: 0,
  // interval
  timerId: null,
  isComposing: false,
  // 타자게임
  game: {
    active: false,
    difficulty: 'normal',
    config: DIFFICULTIES.normal,
    words: [],
    score: 0,
    lives: 3,
    level: 1,
    wordsCleared: 0,
    nextId: 1,
    lastFrame: 0,
    rafId: null,
    spawnTimeoutId: null,
    speedMultiplier: 1,
    speedEffectTimeoutId: null,
  },
};

// ===================== DOM =====================

const el = {
  homeLink: document.getElementById('home-link'),
  homeView: document.getElementById('home-view'),
  tileGrid: document.getElementById('tile-grid'),
  langToggle: document.getElementById('lang-toggle'),
  modeTabs: document.getElementById('mode-tabs'),
  statsBar: document.getElementById('stats-bar'),
  statSpeed: document.getElementById('stat-speed'),
  statAccuracy: document.getElementById('stat-accuracy'),
  statTime: document.getElementById('stat-time'),
  restartBtn: document.getElementById('restart-btn'),
  stageSelect: document.getElementById('stage-select'),
  categorySelect: document.getElementById('category-select'),
  modePosition: document.getElementById('mode-position'),
  modeTyping: document.getElementById('mode-typing'),
  modeGame: document.getElementById('mode-game'),
  positionCurrent: document.getElementById('position-current'),
  positionNext: document.getElementById('position-next'),
  fingerLabel: document.getElementById('finger-label'),
  keyboardStage: document.getElementById('keyboard-stage'),
  fingerGuide: document.getElementById('finger-guide'),
  virtualKeyboard: document.getElementById('virtual-keyboard'),
  positionProgressBar: document.getElementById('position-progress-bar'),
  typingDisplay: document.getElementById('typing-display'),
  passageSource: document.getElementById('passage-source'),
  typingHint: document.getElementById('typing-hint'),
  typingInput: document.getElementById('typing-input'),
  typingKeyboard: document.getElementById('typing-keyboard'),
  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  resultModal: document.getElementById('result-modal'),
  resultSpeed: document.getElementById('result-speed'),
  resultAccuracy: document.getElementById('result-accuracy'),
  resultTime: document.getElementById('result-time'),
  resultRestart: document.getElementById('result-restart'),
  difficultySelect: document.getElementById('difficulty-select'),
  gameBoat: document.getElementById('game-boat'),
  gameLives: document.getElementById('game-lives'),
  gameScore: document.getElementById('game-score'),
  gameLevel: document.getElementById('game-level'),
  gameField: document.getElementById('game-field'),
  gameStartOverlay: document.getElementById('game-start-overlay'),
  gameStartBtn: document.getElementById('game-start-btn'),
  gameInput: document.getElementById('game-input'),
  gameOverModal: document.getElementById('game-over-modal'),
  gameFinalScore: document.getElementById('game-final-score'),
  gameFinalWords: document.getElementById('game-final-words'),
  gameFinalLevel: document.getElementById('game-final-level'),
  gameRestartBtn: document.getElementById('game-restart-btn'),
  gameKeyboard: document.getElementById('game-keyboard'),
  levelUpModal: document.getElementById('level-up-modal'),
  levelUpLabel: document.getElementById('level-up-label'),
  levelUpContinueBtn: document.getElementById('level-up-continue-btn'),
};

// ===================== 사운드 =====================
// Web Audio API로 직접 합성한 효과음 (iOS/Safari에서도 별도 파일 없이 재생 가능)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.typeClickBuffer = null;
    this.typeClickLoadStarted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.loadTypeClickBuffer();
  }
  // 정답 타건음(mp3)을 AudioBuffer로 한 번만 디코딩해둔다. HTMLAudioElement(<audio>)를
  // 매번 새로 만들거나 돌려쓰는 방식은 iOS 사파리에서 "이 엘리먼트는 사용자 제스처 안에서
  // 재생된 적이 없다"며 조용히 재생을 막는 경우가 있어서, 아예 AudioContext(이미 첫 터치에서
  // 잠금 해제됨) 하나로 통일해 그 문제를 원천적으로 피한다.
  loadTypeClickBuffer() {
    if (this.typeClickLoadStarted || !this.ctx) return;
    this.typeClickLoadStarted = true;
    fetch('sounds/type-click.mp3')
      .then(res => res.arrayBuffer())
      .then(data => this.ctx.decodeAudioData(data))
      .then(buffer => { this.typeClickBuffer = buffer; })
      .catch(() => { this.typeClickLoadStarted = false; });
  }
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }
  // 정답 키를 눌렀을 때 나는 소리: 합성음 대신 실제 키보드 녹음(mp3)을 AudioBuffer로
  // 재생한다. 원본 파일이 20초 가까운 긴 연속 녹음이라, 매번 맨 앞부분 0.35초만 잘라 튼다.
  // AudioContext 기반이라 <audio> 엘리먼트를 여러 개 겹쳐 재생할 때 생기는 모바일 잠금
  // 문제 없이, 연타해도 자연스럽게 겹쳐서 재생된다.
  playTypeClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.typeClickBuffer) return; // 아직 디코딩 중이면 이번 키는 조용히 넘어간다
    const source = this.ctx.createBufferSource();
    source.buffer = this.typeClickBuffer;
    // 녹음 원본 자체의 레벨이 낮아서, 다른 합성음(확인/오류음)과 비슷하게 들리도록
    // 게인을 꽤 크게 올린다 (1.0을 넘겨도 Web Audio는 그냥 증폭해서 재생한다)
    const gain = this.ctx.createGain();
    gain.gain.value = 2.6;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    const clipLen = Math.min(0.35, this.typeClickBuffer.duration);
    source.start(this.ctx.currentTime, 0, clipLen);
  }
  playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.05);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }
  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }
  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const now = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }
}
const soundEngine = new SoundEngine();

// iOS Safari는 사용자 제스처 안에서 한 번은 AudioContext를 직접 생성/재개해야
// 이후 소리가 정상 재생된다 (최초 터치/클릭 1회로 잠금 해제).
// init()이 resume()과 함께 mp3 디코딩도 같이 시작해준다.
const unlockAudio = () => {
  soundEngine.init();
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('click', unlockAudio);
};
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

function toggleSound() {
  soundEngine.muted = !soundEngine.muted;
  el.soundToggleBtn.textContent = soundEngine.muted ? '🔇 소리 끔' : '🔊 소리 켬';
  el.soundToggleBtn.classList.toggle('active', !soundEngine.muted);
}

// ===================== 유틸 =====================

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pickRandom(arr, n) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function resetStats() {
  state.startTime = null;
  state.correctCount = 0;
  state.incorrectCount = 0;
  state.finished = false;
  updateStatsDisplay(0, 100, 0);
  stopTimer();
}

function updateStatsDisplay(speed, accuracy, time) {
  el.statSpeed.textContent = Math.round(speed);
  el.statAccuracy.textContent = Math.round(accuracy);
  el.statTime.textContent = Math.round(time);
}

function startTimerIfNeeded() {
  if (state.startTime) return;
  state.startTime = Date.now();
  state.timerId = setInterval(tickStats, 300);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function currentElapsedSeconds() {
  if (!state.startTime) return 0;
  return (Date.now() - state.startTime) / 1000;
}

function tickStats() {
  const elapsed = currentElapsedSeconds();
  const minutes = Math.max(elapsed / 60, 1 / 60);
  const speed = state.correctCount / minutes;
  const total = state.correctCount + state.incorrectCount;
  const accuracy = total === 0 ? 100 : (state.correctCount / total) * 100;
  updateStatsDisplay(speed, accuracy, elapsed);
}

function showResult() {
  stopTimer();
  const elapsed = currentElapsedSeconds();
  const minutes = Math.max(elapsed / 60, 1 / 60);
  const speed = state.correctCount / minutes;
  const total = state.correctCount + state.incorrectCount;
  const accuracy = total === 0 ? 100 : (state.correctCount / total) * 100;
  updateStatsDisplay(speed, accuracy, elapsed);
  el.resultSpeed.textContent = Math.round(speed);
  el.resultAccuracy.textContent = Math.round(accuracy);
  el.resultTime.textContent = Math.round(elapsed);
  el.resultModal.classList.add('show');
  soundEngine.playFanfare();
}

function hideResult() {
  el.resultModal.classList.remove('show');
}

// ===================== 모드/언어/스테이지 전환 =====================

function setMode(mode) {
  if (state.mode === 'game' && mode !== 'game') stopGameLoops();
  state.mode = mode;
  [...el.modeTabs.children].forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));

  const needsStage = mode === 'position' || mode === 'rowword';
  el.stageSelect.classList.toggle('show', needsStage);
  el.categorySelect.classList.toggle('show', mode === 'passage');
  el.difficultySelect.classList.toggle('show', mode === 'game');
  el.statsBar.classList.toggle('hide', mode === 'game');

  el.modePosition.classList.toggle('active', mode === 'position');
  el.modeGame.classList.toggle('active', mode === 'game');
  el.modeTyping.classList.toggle('active', mode !== 'position' && mode !== 'game');

  hideResult();
  startCurrentMode();
}

function setLang(lang) {
  state.lang = lang;
  [...el.langToggle.children].forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  hideResult();
  startCurrentMode();
}

// 자리 단계 버튼은 체크박스처럼 동작한다: 눌린 단계를 따로따로 켜고 끌 수 있고,
// 서로 다른 단계를 자유롭게 중복 선택할 수 있다. 최소 1개는 항상 선택되어 있어야 한다.
function toggleStage(stage) {
  if (state.stages.has(stage)) {
    if (state.stages.size === 1) return;
    state.stages.delete(stage);
  } else {
    state.stages.add(stage);
  }
  [...el.stageSelect.querySelectorAll('button[data-stage]')].forEach(btn => {
    btn.classList.toggle('active', state.stages.has(Number(btn.dataset.stage)));
  });
  hideResult();
  startCurrentMode();
}

function setCategory(category) {
  state.passageCategory = category;
  [...el.categorySelect.querySelectorAll('button')].forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
  hideResult();
  startCurrentMode();
}

function showHome() {
  state.view = 'home';
  if (state.mode === 'game') stopGameLoops();
  stopTimer();
  document.body.classList.add('home-active');
}

function enterMode(mode) {
  state.view = 'practice';
  document.body.classList.remove('home-active');
  setMode(mode);
}

function startCurrentMode() {
  resetStats();
  if (state.mode === 'position') {
    startPositionDrill();
  } else if (state.mode === 'game') {
    resetGamePanel();
  } else {
    startTypingDrill();
  }
}

// ===================== 자리연습 (물리 키 코드 기반) =====================

function allowedKeysForStages(stages) {
  let keys = [];
  [...stages].sort((a, b) => a - b).forEach(i => { keys = keys.concat(KEY_ROWS[i]); });
  return keys;
}

// 키보드/손가락 가이드는 처음 한 번만 만들고, 이후에는 클래스/텍스트만 갱신한다.
// (단계를 바꿀 때마다 DOM을 다시 만들면 위치가 미묘하게 흔들려 보일 수 있어서 고정한다)
const keyElsByCode = {};        // 자리연습용 키보드
const typingKeyElsByCode = {};  // 단어/문장/글연습용 키보드
const gameKeyElsByCode = {};    // 타자게임용 키보드
const fingerEls = {};

// 실제 키보드처럼 보이도록, 연습에 쓰이지 않는 키(숫자줄/Tab/Caps/Shift/스페이스 등)도
// 장식용으로 함께 그린다. l()은 연습 대상 글자키(KEYMAP의 code를 그대로 참조해 기존
// 하이라이트/오답 표시 로직을 그대로 쓴다), d()는 항상 같은 회색인 비활성 장식 키다.
// w는 기본 키 폭(1칸)의 배수.
function l(code) { return { type: 'letter', code }; }
function d(label, w, cls) { return { type: 'deco', label, w: w || 1, cls }; }

const KB_LAYOUT = [
  { cls: 'kb-row-num', keys: [
    d('`'), d('1'), d('2'), d('3'), d('4'), d('5'), d('6'), d('7'), d('8'), d('9'), d('0'), d('-'), d('='), d('⌫', 1.4),
  ] },
  { cls: 'kb-row-top', keys: [
    d('Tab', 1.4),
    l('KeyQ'), l('KeyW'), l('KeyE'), l('KeyR'), l('KeyT'), l('KeyY'), l('KeyU'), l('KeyI'), l('KeyO'), l('KeyP'),
    d('['), d(']'), d('\\', 1),
  ] },
  { cls: 'kb-row-home', keys: [
    d('Caps', 1.7),
    l('KeyA'), l('KeyS'), l('KeyD'), l('KeyF'), l('KeyG'), l('KeyH'), l('KeyJ'), l('KeyK'), l('KeyL'),
    d(';'), d("'"), d('Enter', 1.8),
  ] },
  { cls: 'kb-row-bottom', keys: [
    d('Shift', 2.2),
    l('KeyZ'), l('KeyX'), l('KeyC'), l('KeyV'), l('KeyB'), l('KeyN'), l('KeyM'),
    d(','), d('.'), d('/'),
    d('Shift', 2.4),
  ] },
  { cls: 'kb-row-space', keys: [
    // Ctrl/Alt는 좌우 모두 왼쪽 Ctrl(1.3) 크기로 맞춘다
    d('Ctrl', 1.3), d('Fn', 0.9), d('Win', 1.1), d('Alt', 1.3), d('', 6, 'key-space'), d('Alt', 1.3), d('Ctrl', 1.3),
  ] },
];

function buildKeyboardInto(container, registry) {
  container.innerHTML = '';
  KB_LAYOUT.forEach(({ cls, keys }) => {
    const rowEl = document.createElement('div');
    rowEl.className = `kb-row ${cls}`;
    keys.forEach(k => {
      const keyEl = document.createElement('div');
      if (k.type === 'letter') {
        keyEl.className = 'key letter';
        keyEl.dataset.code = k.code;
        registry[k.code] = keyEl;
      } else {
        keyEl.className = k.cls ? `key deco ${k.cls}` : 'key deco';
        keyEl.textContent = k.label;
      }
      if (k.w && k.w !== 1) keyEl.style.setProperty('--kw', k.w);
      rowEl.appendChild(keyEl);
    });
    container.appendChild(rowEl);
  });
  buildArrowCluster(container);
}

// 방향키는 자리연습/자판 아랫줄들의 폭에 맞춰 끼워 넣기보다, 오른쪽 아래 빈 공간에
// 독립된 3x2 격자로 절대좌표 배치한다 (다른 줄 폭 계산에 영향을 주지 않아 어긋나지 않는다)
function buildArrowCluster(container) {
  const cluster = document.createElement('div');
  cluster.className = 'arrow-cluster';
  [['', '↑', ''], ['←', '↓', '→']].forEach(row => {
    row.forEach(label => {
      const keyEl = document.createElement('div');
      keyEl.className = label ? 'key deco' : 'key deco key-blank';
      keyEl.textContent = label;
      cluster.appendChild(keyEl);
    });
  });
  container.appendChild(cluster);
}

function initKeyboard() {
  buildKeyboardInto(el.virtualKeyboard, keyElsByCode);
  buildKeyboardInto(el.typingKeyboard, typingKeyElsByCode);
  buildKeyboardInto(el.gameKeyboard, gameKeyElsByCode);
}

// 손가락 가이드를 왼손/오른손 두 뭉치로 나누어, 손가락(손톱 포함)+손바닥이 있는
// 손 모양으로 그린다. FINGER_ORDER는 왼손 새끼~검지, 오른손 검지~새끼 순서이다.
function buildHand(codes, tag, cls) {
  const handEl = document.createElement('div');
  handEl.className = `hand ${cls}`;

  // 손가락+손바닥만 따로 묶어서, 엄지의 위치 기준을 손바닥 쪽으로 고정한다
  const shapeEl = document.createElement('div');
  shapeEl.className = 'hand-shape';

  const fingersEl = document.createElement('div');
  fingersEl.className = 'fingers';
  codes.forEach(code => {
    const info = FINGER_LABELS[code];
    const fEl = document.createElement('div');
    fEl.className = `finger f-${info.size}`;
    const nailEl = document.createElement('span');
    nailEl.className = 'nail';
    fEl.appendChild(nailEl);
    fingersEl.appendChild(fEl);
    fingerEls[code] = fEl;
  });

  const palmEl = document.createElement('div');
  palmEl.className = 'palm';

  // 엄지는 이 연습에서 어떤 키에도 쓰이지 않아 하이라이트되지 않지만,
  // 손가락을 4개로만 그리면 실제 손 모양과 달라 보여서 장식용으로 함께 그린다.
  const thumbEl = document.createElement('div');
  thumbEl.className = 'finger f-thumb';
  const thumbNail = document.createElement('span');
  thumbNail.className = 'nail';
  thumbEl.appendChild(thumbNail);

  const tagEl = document.createElement('span');
  tagEl.className = 'hand-tag';
  tagEl.textContent = tag;

  shapeEl.appendChild(fingersEl);
  shapeEl.appendChild(palmEl);
  shapeEl.appendChild(thumbEl);
  handEl.appendChild(shapeEl);
  handEl.appendChild(tagEl);
  return handEl;
}

function initFingerGuide() {
  el.fingerGuide.innerHTML = '';
  el.fingerGuide.appendChild(buildHand(FINGER_ORDER.slice(0, 4), '왼손', 'hand-left'));
  el.fingerGuide.appendChild(buildHand(FINGER_ORDER.slice(4), '오른손', 'hand-right'));
}

function updateKeyboardLang() {
  KEYMAP.forEach(k => {
    const label = state.lang === 'ko' ? k.ko : k.en;
    if (keyElsByCode[k.code]) keyElsByCode[k.code].textContent = label;
    if (typingKeyElsByCode[k.code]) typingKeyElsByCode[k.code].textContent = label;
    if (gameKeyElsByCode[k.code]) gameKeyElsByCode[k.code].textContent = label;
  });
}

// 선택된 자리 단계에 없는 자모는 흐리게 표시한다. active=false면 전부 정상 색으로 되돌린다
// (자리별 단어연습이 아닌 다른 화면은 자리 단계 자체가 없으니 항상 전체 색으로 보여준다).
function applyStageDim(registry, active) {
  const allowed = active ? new Set(allowedKeysForStages(state.stages).map(k => k.code)) : null;
  KEYMAP.forEach(k => {
    const keyEl = registry[k.code];
    if (!keyEl) return;
    keyEl.classList.toggle('dim', active ? !allowed.has(k.code) : false);
  });
}

function updateKeyboardStage() {
  applyStageDim(keyElsByCode, true);
}

// 자리별 단어연습에서만 자리 단계 선택이 자판 색에 반영되고, 나머지 연습은 항상 전체 색이다
function updateTypingKeyboardStage() {
  applyStageDim(typingKeyElsByCode, state.mode === 'rowword');
}

function highlightKeyInRegistry(registry, code) {
  Object.values(registry).forEach(k => k.classList.remove('target'));
  const keyEl = registry[code];
  if (keyEl) keyEl.classList.add('target');
}

function highlightTargetKey(code) {
  highlightKeyInRegistry(keyElsByCode, code);
}

// 왼손/오른손 기준이 되는 홈로우 키(엄지 자리인 R-pinky는 세미콜론이 없어 L로 대신한다).
// 이 위치를 손 전체(손가락+손바닥)의 기준점으로 삼아 자판 위에 자연스럽게 얹히게 한다.
const HAND_HOME_CODES = { 'hand-left': ['KeyA', 'KeyS', 'KeyD', 'KeyF'], 'hand-right': ['KeyJ', 'KeyK', 'KeyL'] };

// 손 전체(왼손/오른손)를 키보드의 홈로우 자리 위에 겹쳐 놓는다.
// 창 크기가 바뀌어 키 크기가 달라져도 다시 맞출 수 있도록 별도 함수로 둔다.
function layoutHandOverlay() {
  if (!el.keyboardStage) return;
  const stageRect = el.keyboardStage.getBoundingClientRect();
  if (!stageRect.width) return;
  Object.entries(HAND_HOME_CODES).forEach(([handCls, codes]) => {
    const handEl = el.fingerGuide.querySelector(`.${handCls}`);
    if (!handEl) return;
    const rects = codes.map(c => keyElsByCode[c]).filter(Boolean).map(k => k.getBoundingClientRect());
    if (!rects.length) return;
    const centerX = rects.reduce((sum, r) => sum + r.left + r.width / 2, 0) / rects.length;
    const centerY = rects.reduce((sum, r) => sum + r.top + r.height / 2, 0) / rects.length;
    handEl.style.left = `${centerX - stageRect.left}px`;
    handEl.style.top = `${centerY - stageRect.top}px`;
  });
}

// 지금 눌러야 할 손가락 하나만 홈로우 자리에서 목표 키 위로 이동시킨다.
// 나머지 손가락은 손을 그대로 유지해 실제로 손을 얹어 놓은 것처럼 보이게 한다.
function moveActiveFinger(fingerCode, targetCode) {
  Object.values(fingerEls).forEach(f => { f.style.transform = ''; });
  const fEl = fingerEls[fingerCode];
  const keyEl = keyElsByCode[targetCode];
  if (!fEl || !keyEl) return;
  const fRect = fEl.getBoundingClientRect();
  const kRect = keyEl.getBoundingClientRect();
  if (!fRect.width || !kRect.width) return;
  const dx = (kRect.left + kRect.width / 2) - (fRect.left + fRect.width / 2);
  const dy = (kRect.top + kRect.height * 0.4) - (fRect.top + fRect.height * 0.3);
  fEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
}

function highlightFinger(fingerCode, targetCode) {
  Object.values(fingerEls).forEach(f => f.classList.remove('active'));
  const fEl = fingerEls[fingerCode];
  if (fEl) fEl.classList.add('active');
  const info = FINGER_LABELS[fingerCode];
  el.fingerLabel.textContent = `${info.hand} ${info.name}`;
  moveActiveFinger(fingerCode, targetCode);
}

function flashKeyInRegistry(registry, code, ok) {
  ok ? soundEngine.playTypeClick() : soundEngine.playWrong();
  const keyEl = registry[code];
  if (!keyEl) return;
  const cls = ok ? 'correct-flash' : 'wrong-flash';
  keyEl.classList.add(cls);
  setTimeout(() => keyEl.classList.remove(cls), 220);
}

function flashKey(code, ok) {
  flashKeyInRegistry(keyElsByCode, code, ok);
}

function generatePositionSequence(len = 25) {
  const pool = allowedKeysForStages(state.stages);
  const seq = [];
  let last = null;
  for (let i = 0; i < len; i++) {
    let pick;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && pick === last);
    seq.push(pick);
    last = pick;
  }
  return seq;
}

function startPositionDrill() {
  updateKeyboardLang();
  updateKeyboardStage();
  state.posSequence = generatePositionSequence();
  state.posIndex = 0;
  renderPositionPrompt();
}

function renderPositionPrompt() {
  const seq = state.posSequence;
  const idx = state.posIndex;
  if (idx >= seq.length) return;
  const cur = seq[idx];
  const next = seq[idx + 1];
  el.positionCurrent.textContent = state.lang === 'ko' ? cur.ko : cur.en;
  el.positionNext.textContent = next ? (state.lang === 'ko' ? next.ko : next.en) : '';
  el.modePosition.dataset.row = cur.row; // 기본/윗/아랫자리 색(파랑/주황/초록)을 현재 자리에 맞춘다
  el.virtualKeyboard.dataset.row = cur.row; // 자판의 목표 키 강조색도 같은 자리 색으로
  layoutHandOverlay();
  highlightTargetKey(cur.code);
  highlightFinger(cur.finger, cur.code);
  el.positionProgressBar.style.width = `${(idx / seq.length) * 100}%`;
}

function handlePositionKeydown(e) {
  if (state.mode !== 'position' || state.view !== 'practice') return;
  if (e.code === 'Space') e.preventDefault(); // 스페이스로 인한 스크롤 방지
  const key = KEYMAP.find(k => k.code === e.code);
  if (!key) return; // 관련 없는 키는 무시(기본 동작 허용)
  e.preventDefault();

  startTimerIfNeeded();
  const seq = state.posSequence;
  const target = seq[state.posIndex];

  if (key.code === target.code) {
    state.correctCount++;
    flashKey(key.code, true);
    state.posIndex++;
    if (state.posIndex >= seq.length) {
      el.positionProgressBar.style.width = '100%';
      showResult();
      return;
    }
    renderPositionPrompt();
  } else {
    state.incorrectCount++;
    flashKey(key.code, false);
  }
}

// ===================== 단어/문장/글 공용 엔진 =====================

// 한글 자모 분해 (단어/문장/글연습용 가상 키보드에 "다음 누를 키"를 표시하기 위함.
// 실제 정오 채점은 텍스트 값 비교로 그대로 처리하고, 이 분해 로직은 키보드 하이라이트에만 쓰인다)
const HANGUL_CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const HANGUL_JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const HANGUL_JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// 이중모음/겹받침은 실제로 두 번의 키 입력으로 만들어지므로 구성 자모로 다시 풀어준다
const HANGUL_COMPOUND_JUNG = { 'ㅘ':['ㅗ','ㅏ'], 'ㅙ':['ㅗ','ㅐ'], 'ㅚ':['ㅗ','ㅣ'], 'ㅝ':['ㅜ','ㅓ'], 'ㅞ':['ㅜ','ㅔ'], 'ㅟ':['ㅜ','ㅣ'], 'ㅢ':['ㅡ','ㅣ'] };
const HANGUL_COMPOUND_JONG = { 'ㄳ':['ㄱ','ㅅ'], 'ㄵ':['ㄴ','ㅈ'], 'ㄶ':['ㄴ','ㅎ'], 'ㄺ':['ㄹ','ㄱ'], 'ㄻ':['ㄹ','ㅁ'], 'ㄼ':['ㄹ','ㅂ'], 'ㄽ':['ㄹ','ㅅ'], 'ㄾ':['ㄹ','ㅌ'], 'ㄿ':['ㄹ','ㅍ'], 'ㅀ':['ㄹ','ㅎ'], 'ㅄ':['ㅂ','ㅅ'] };
// 쌍자음/이중모음 중 Shift+기본 키 한 번으로 입력되는 것들 (물리 키는 기본 자모와 동일)
const HANGUL_SHIFT_TO_BASE = { 'ㄲ':'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ', 'ㅆ':'ㅅ', 'ㅉ':'ㅈ', 'ㅒ':'ㅐ', 'ㅖ':'ㅔ' };

function decomposeKoreanChar(ch) {
  if (!ch) return [];
  const code = ch.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return [ch];
  const cho = HANGUL_CHO[Math.floor(code / 588)];
  const jung = HANGUL_JUNG[Math.floor((code % 588) / 28)];
  const jong = HANGUL_JONG[code % 28];
  const jamos = [cho, ...(HANGUL_COMPOUND_JUNG[jung] || [jung])];
  if (jong) jamos.push(...(HANGUL_COMPOUND_JONG[jong] || [jong]));
  return jamos;
}

function jamoToKeyCode(jamo) {
  const base = HANGUL_SHIFT_TO_BASE[jamo] || jamo;
  const key = KEYMAP.find(k => k.ko === base);
  return key ? key.code : null;
}

// 지금 입력 중인 한글 음절에서 이미 조합된 자모 (compositionupdate 이벤트로 갱신)
let typingComposedSoFar = '';

function currentExpectedKeyCode() {
  const target = state.targetText;
  const typed = el.typingInput.value;
  // 한글은 자모가 조합되는 동안(예: "오"를 만들려고 ㅇ까지만 친 상태) value의 마지막 글자가
  // 아직 완성되지 않은 채로 이미 한 글자로 잡혀서, idx를 typed.length로만 계산하면
  // "다음 글자"로 착각해 버린다. 조합 중일 때는 그 글자를 아직 "완성 전"으로 보고
  // 한 칸 당겨서(typed.length - 1) 지금 조합 중인 글자를 계속 target으로 본다.
  const idx = Math.max(0, typed.length - (state.isComposing ? 1 : 0));
  if (idx >= target.length) return null;
  const targetChar = target[idx];
  if (targetChar === '\n') return null;

  if (state.lang === 'en') {
    const key = KEYMAP.find(k => k.en === targetChar.toLowerCase());
    return key ? key.code : null;
  }

  const jamos = decomposeKoreanChar(targetChar);
  const composedJamos = typingComposedSoFar ? decomposeKoreanChar(typingComposedSoFar) : [];
  if (composedJamos.length >= jamos.length) return null;
  return jamoToKeyCode(jamos[composedJamos.length]);
}

function updateTypingKeyboardHighlight() {
  const code = currentExpectedKeyCode();
  if (code) {
    const info = KEYMAP.find(k => k.code === code);
    if (info) el.typingKeyboard.dataset.row = info.row; // 목표 키가 속한 자리 색으로 강조
    highlightKeyInRegistry(typingKeyElsByCode, code);
  } else {
    Object.values(typingKeyElsByCode).forEach(k => k.classList.remove('target'));
  }
}

function buildTypingTarget() {
  if (state.mode === 'rowword') {
    const lists = WORD_LISTS.rowword[state.lang];
    const words = [...state.stages].sort((a, b) => a - b).flatMap(i => lists[i]);
    return { text: pickRandom(words, Math.min(8, words.length)).join(' '), source: '' };
  }
  if (state.mode === 'randomword') {
    const words = WORD_LISTS.random[state.lang];
    return { text: pickRandom(words, 10).join(' '), source: '' };
  }
  if (state.mode === 'sentence') {
    const list = SENTENCES[state.lang];
    let text;
    do { text = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && text === state.lastSentence);
    state.lastSentence = text;
    return { text, source: '' };
  }
  if (state.mode === 'passage') {
    const list = PASSAGES[state.passageCategory][state.lang];
    let item;
    do { item = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && item.text === state.lastPassageText);
    state.lastPassageText = item.text;
    return item;
  }
  return { text: '', source: '' };
}

function startTypingDrill() {
  const target = buildTypingTarget();
  state.targetText = target.text;
  el.passageSource.textContent = target.source ? `— ${target.source}` : '';
  el.typingInput.value = '';
  typingComposedSoFar = '';
  updateKeyboardLang();
  updateTypingKeyboardStage();
  renderTypingDisplay('');
  updateTypingKeyboardHighlight();
  updateTypingHint('');
  el.typingInput.disabled = false;
  el.typingInput.focus();
}

// 입력 상태에 따라 안내 문구를 바꾼다: 오타가 나면 빨갛게, 다 쓰면 Enter를 안내한다
function updateTypingHint(value) {
  const target = state.targetText;
  el.typingHint.classList.remove('bad', 'good');
  if (!target) {
    el.typingHint.textContent = '';
    return;
  }
  if (value.length > 0 && value[value.length - 1] !== target[value.length - 1]) {
    el.typingHint.textContent = '❌ 오타예요! 다시 확인해보세요';
    el.typingHint.classList.add('bad');
    return;
  }
  if (value.length >= target.length) {
    el.typingHint.textContent = '✅ 다 썼어요! Enter를 눌러 결과를 확인하세요';
    el.typingHint.classList.add('good');
    return;
  }
  if (value.length === 0) {
    el.typingHint.textContent = '⌨️ 키보드로 입력을 시작해보세요!';
    return;
  }
  el.typingHint.textContent = '👍 잘하고 있어요! 이대로 계속 쳐보세요';
}

function renderTypingDisplay(typed) {
  const target = state.targetText;
  let html = '';
  for (let i = 0; i < target.length; i++) {
    if (target[i] === '\n') {
      html += '<br>';
      continue;
    }
    const ch = escapeHtml(target[i]);
    let cls = 'pending';
    if (i < typed.length) {
      cls = typed[i] === target[i] ? 'correct' : 'incorrect';
    } else if (i === typed.length) {
      cls = 'current';
    }
    html += `<span class="${cls}">${ch}</span>`;
  }
  el.typingDisplay.innerHTML = html;
  const currentSpan = el.typingDisplay.querySelector('.current');
  if (currentSpan) currentSpan.scrollIntoView({ block: 'nearest' });
}

function evaluateTyped(typed) {
  const target = state.targetText;
  let correct = 0;
  let incorrect = 0;
  const len = Math.min(typed.length, target.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] === target[i]) correct++;
    else incorrect++;
  }
  return { correct, incorrect };
}

function handleTypingInput() {
  if (state.mode === 'position' || state.finished) return;
  if (state.isComposing) {
    renderTypingDisplay(el.typingInput.value);
    return;
  }

  let value = el.typingInput.value.replace(/\r\n/g, '\n');
  const target = state.targetText;
  if (value.length > target.length) {
    value = value.slice(0, target.length);
  }
  if (value !== el.typingInput.value) {
    el.typingInput.value = value;
  }

  startTimerIfNeeded();
  renderTypingDisplay(value);
  typingComposedSoFar = '';
  updateTypingKeyboardHighlight();
  updateTypingHint(value);

  const { correct, incorrect } = evaluateTyped(value);
  state.correctCount = correct;
  state.incorrectCount = incorrect;
  tickStats();
}

// 다 입력한 뒤 Enter를 눌러야 결과 화면으로 넘어간다 (그전까지는 이어서 수정 가능)
function handleTypingKeydown(e) {
  if (e.key !== 'Enter') return;
  if (state.mode === 'position' || state.finished || state.isComposing) return;
  const target = state.targetText;
  if (target.length > 0 && el.typingInput.value.length >= target.length) {
    e.preventDefault();
    // 결과창을 여는 이 Enter가 document의 "결과창이 떠 있으면 재시작" 단축키에도
    // 그대로 버블링되면 같은 키 입력 한 번에 열리자마자 재시작돼버리므로 막는다.
    e.stopPropagation();
    state.finished = true;
    el.typingInput.disabled = true;
    showResult();
  }
}

// ===================== 타자게임: 떨어지는 단어 잡기 =====================

function updateGameHud() {
  el.gameLives.textContent = state.game.lives;
  el.gameScore.textContent = state.game.score;
  el.gameLevel.textContent = gameLevelLabel();
}

function stopGameLoops() {
  if (state.game.rafId) cancelAnimationFrame(state.game.rafId);
  if (state.game.spawnTimeoutId) clearTimeout(state.game.spawnTimeoutId);
  if (state.game.speedEffectTimeoutId) clearTimeout(state.game.speedEffectTimeoutId);
  state.game.rafId = null;
  state.game.spawnTimeoutId = null;
  state.game.speedEffectTimeoutId = null;
  state.game.speedMultiplier = 1;
  state.game.active = false;
}

function hideGameOver() {
  el.gameOverModal.classList.remove('show');
}

function clearGameField() {
  el.gameField.querySelectorAll('.falling-word').forEach(w => w.remove());
  state.game.words = [];
}

function setDifficulty(key) {
  state.game.difficulty = key;
  [...el.difficultySelect.querySelectorAll('button')].forEach(btn => btn.classList.toggle('active', btn.dataset.difficulty === key));
  // 진행 중인 게임의 목숨/점수에는 영향 없이, 다음 판부터 적용된다.
  if (!state.game.active) {
    el.gameLives.textContent = DIFFICULTIES[key].lives;
    el.gameLevel.textContent = gameLevelLabel();
  }
}

function resetGamePanel() {
  stopGameLoops();
  clearGameField();
  state.game.score = 0;
  state.game.lives = DIFFICULTIES[state.game.difficulty].lives;
  state.game.level = 1;
  state.game.wordsCleared = 0;
  state.game.nextId = 1;
  state.game.lastFrame = 0;
  updateKeyboardLang();
  updateGameHud();
  updateGameKeyboardHighlight();
  el.gameStartOverlay.style.display = 'flex';
  el.gameInput.disabled = true;
  el.gameInput.value = '';
  hideGameOver();
  el.levelUpModal.classList.remove('show');
}

// 지금 잡아야 할(배에 가장 가까운, 입력한 접두어와 일치하는) 단어를 찾아 다음 글자를 강조한다.
// 자모 단위까지는 추적하지 않고 완성된 글자 단위로 다음 글자의 첫 자모만 강조한다
// (게임 입력창은 완성된 접두어 일치로만 판정하므로 이 정도로도 충분한 힌트가 된다).
function updateGameKeyboardHighlight() {
  const typed = el.gameInput.value.trim().toLowerCase();
  let candidates = state.game.words;
  if (typed) candidates = candidates.filter(w => w.text.toLowerCase().startsWith(typed));
  if (!candidates.length) {
    Object.values(gameKeyElsByCode).forEach(k => k.classList.remove('target'));
    return;
  }
  const target = candidates.reduce((a, b) => (a.y > b.y ? a : b));
  const nextChar = target.text[typed.length];
  let code = null;
  if (nextChar) {
    if (state.lang === 'en') {
      const key = KEYMAP.find(k => k.en === nextChar.toLowerCase());
      code = key ? key.code : null;
    } else {
      const jamos = decomposeKoreanChar(nextChar);
      code = jamos.length ? jamoToKeyCode(jamos[0]) : null;
    }
  }
  if (code) {
    const info = KEYMAP.find(k => k.code === code);
    if (info) el.gameKeyboard.dataset.row = info.row;
    highlightKeyInRegistry(gameKeyElsByCode, code);
  } else {
    Object.values(gameKeyElsByCode).forEach(k => k.classList.remove('target'));
  }
}

function spawnWord() {
  if (!state.game.active) return;
  const pool = WORD_LISTS.random[state.lang];
  const available = pool.filter(w => !state.game.words.some(fw => fw.text === w));
  const list = available.length ? available : pool;
  const text = list[Math.floor(Math.random() * list.length)];

  const isBonus = Math.random() < BONUS_CHANCE;
  const bonusType = isBonus ? BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)] : null;

  const wordEl = document.createElement('div');
  wordEl.className = isBonus ? 'falling-word bonus' : 'falling-word';
  wordEl.innerHTML = `<span class="bomb-icon">${isBonus ? '🎁' : '💣'}</span>${escapeHtml(text)}`;
  wordEl.style.top = '-46px';
  el.gameField.appendChild(wordEl);

  const fieldWidth = el.gameField.clientWidth;
  const wordWidth = wordEl.offsetWidth;
  const maxLeft = Math.max(8, fieldWidth - wordWidth - 8);
  const left = 8 + Math.random() * Math.max(0, maxLeft - 8);
  wordEl.style.left = `${left}px`;

  const cfg = state.game.config;
  const speed = cfg.baseSpeed + (state.game.level - 1) * cfg.speedPerLevel + Math.random() * 8;
  state.game.words.push({ id: state.game.nextId++, text, el: wordEl, y: -46, speed, bonusType });
  updateGameKeyboardHighlight();
}

function scheduleNextSpawn() {
  if (!state.game.active) return;
  const cfg = state.game.config;
  const delay = Math.max(cfg.minSpawnDelay, cfg.baseSpawnDelay - (state.game.level - 1) * cfg.spawnDelayPerLevel);
  state.game.spawnTimeoutId = setTimeout(() => {
    spawnWord();
    scheduleNextSpawn();
  }, delay);
}

function popWord(index) {
  soundEngine.playCorrect();
  const w = state.game.words[index];
  w.el.innerHTML = '💥';
  w.el.classList.add('pop');
  setTimeout(() => w.el.remove(), 300);
  state.game.words.splice(index, 1);
  state.game.score += w.text.length * 10;
  state.game.wordsCleared++;
  const prevLevel = state.game.level;
  state.game.level = Math.min(GAME_LEVEL_MAX, Math.floor(state.game.wordsCleared / GAME_WORDS_PER_LEVEL) + 1);
  updateGameHud();
  updateGameKeyboardHighlight();
  if (state.game.level > prevLevel) showLevelUp();
}

function missWord(index) {
  soundEngine.playWrong();
  const w = state.game.words[index];
  w.el.innerHTML = '💦';
  w.el.classList.add('miss');
  setTimeout(() => w.el.remove(), 350);
  state.game.words.splice(index, 1);
  state.game.lives--;
  updateGameHud();
  updateGameKeyboardHighlight();
  el.gameField.classList.add('hit-flash');
  el.gameBoat.classList.add('hit');
  setTimeout(() => el.gameField.classList.remove('hit-flash'), 250);
  setTimeout(() => el.gameBoat.classList.remove('hit'), 400);
  if (state.game.lives <= 0) endGame();
}

// 난이도(쉬움/보통/어려움)별로 각각 5단계씩 있다는 걸 "1-3" 같은 표기로 보여준다.
// 맨 처음 고르는 건 지금처럼 난이도 3가지뿐이고, 그 안에서 5단계씩 진행된다.
const DIFFICULTY_TIER = { easy: 1, normal: 2, hard: 3 };
function gameLevelLabel() {
  const tier = DIFFICULTY_TIER[state.game.difficulty] || 1;
  return `${tier}-${state.game.level}`;
}

// 스폰/이동만 멈추고(목숨·점수 등은 그대로) 레벨업 안내를 보여준다. stopGameLoops와 달리
// state.game.active는 그대로 true로 둬서 "일시정지"임을 구분한다.
function showLevelUp() {
  if (state.game.rafId) cancelAnimationFrame(state.game.rafId);
  if (state.game.spawnTimeoutId) clearTimeout(state.game.spawnTimeoutId);
  state.game.rafId = null;
  state.game.spawnTimeoutId = null;
  el.gameInput.disabled = true;
  el.levelUpLabel.textContent = gameLevelLabel();
  el.levelUpModal.classList.add('show');
  soundEngine.playFanfare();
}

function resumeAfterLevelUp() {
  el.levelUpModal.classList.remove('show');
  if (!state.game.active) return; // 레벨업 팝업이 떠 있는 동안 게임이 끝났다면 재개하지 않는다
  el.gameInput.disabled = false;
  el.gameInput.focus();
  state.game.lastFrame = 0; // 멈춰있던 시간만큼 dt가 튀지 않도록 초기화
  scheduleNextSpawn();
  state.game.rafId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!state.game.active) return;
  if (!state.game.lastFrame) state.game.lastFrame = timestamp;
  const dt = (timestamp - state.game.lastFrame) / 1000;
  state.game.lastFrame = timestamp;

  // 배에 닿는 순간이 아니라, 게임판 맨 아래(바닥)까지 떨어져야 놓친 것으로 처리한다.
  const fieldHeight = el.gameField.clientHeight;

  for (let i = state.game.words.length - 1; i >= 0; i--) {
    const w = state.game.words[i];
    w.y += w.speed * dt * state.game.speedMultiplier;
    w.el.style.top = `${w.y}px`;
    if (w.y + w.el.offsetHeight >= fieldHeight) missWord(i);
  }

  state.game.rafId = requestAnimationFrame(gameLoop);
}

function applySpeedEffect(multiplier, duration) {
  state.game.speedMultiplier = multiplier;
  if (state.game.speedEffectTimeoutId) clearTimeout(state.game.speedEffectTimeoutId);
  state.game.speedEffectTimeoutId = setTimeout(() => {
    state.game.speedMultiplier = 1;
    state.game.speedEffectTimeoutId = null;
  }, duration);
}

function clearAllWords() {
  state.game.words.forEach(w => {
    w.el.classList.add('pop');
    setTimeout(() => w.el.remove(), 300);
  });
  state.game.words = [];
}

function showBonusToast(text) {
  const toast = document.createElement('div');
  toast.className = 'bonus-toast';
  toast.textContent = text;
  el.gameField.appendChild(toast);
  setTimeout(() => toast.remove(), 1200);
}

function triggerBonusEffect(type) {
  if (type === 'slow') {
    applySpeedEffect(0.35, 2000);
    showBonusToast('🐢 2초간 느려져요!');
  } else if (type === 'freeze') {
    applySpeedEffect(0, 2000);
    showBonusToast('🧊 2초간 멈춰요!');
  } else if (type === 'clear') {
    clearAllWords();
    showBonusToast('✨ 화면 정리!');
  }
}

// 입력 중에는 일치하는 폭탄을 하이라이트만 하고, 실제 격침은 Enter를 눌러야 이루어진다.
function handleGameInput() {
  const value = el.gameInput.value.trim();
  state.game.words.forEach(w => {
    w.el.classList.toggle('targeted', value.length > 0 && w.text.toLowerCase().startsWith(value.toLowerCase()));
  });
  updateGameKeyboardHighlight();
}

function handleGameKeydown(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  // 이 Enter가 document로 버블링되면, popWord()가 방금 띄운 레벨업 팝업을
  // "팝업이 떠 있으면 Enter로 닫기" 단축키가 같은 키 입력 한 번에 즉시 닫아버린다
  // (result-modal 때와 같은 문제). 게임 입력의 Enter는 여기서 처리를 끝내므로 막아준다.
  e.stopPropagation();
  if (!state.game.active) return;
  const value = el.gameInput.value.trim();
  if (!value) return;
  const idx = state.game.words.findIndex(w => w.text.toLowerCase() === value.toLowerCase());

  // 정답이든 오답이든 Enter를 누르면 입력칸은 항상 비워서 바로 다시 입력할 수 있게 한다.
  el.gameInput.value = '';
  handleGameInput();

  if (idx !== -1) {
    const bonusType = state.game.words[idx].bonusType;
    popWord(idx);
    if (bonusType) triggerBonusEffect(bonusType);
  } else {
    soundEngine.playWrong();
    el.gameInput.classList.remove('shake');
    void el.gameInput.offsetWidth; // 리플레이를 위한 강제 리플로우
    el.gameInput.classList.add('shake');
    setTimeout(() => el.gameInput.classList.remove('shake'), 300);
  }
}

function startGame() {
  stopGameLoops();
  clearGameField();
  state.game.config = DIFFICULTIES[state.game.difficulty];
  state.game.score = 0;
  state.game.lives = state.game.config.lives;
  state.game.level = 1;
  state.game.wordsCleared = 0;
  state.game.nextId = 1;
  state.game.lastFrame = 0;
  state.game.active = true;
  updateGameHud();
  hideGameOver();
  el.levelUpModal.classList.remove('show');
  el.gameStartOverlay.style.display = 'none';
  el.gameInput.disabled = false;
  el.gameInput.value = '';
  el.gameInput.focus();
  updateGameKeyboardHighlight();
  scheduleNextSpawn();
  state.game.rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
  stopGameLoops();
  el.gameInput.disabled = true;
  el.levelUpModal.classList.remove('show');
  el.gameFinalScore.textContent = state.game.score;
  el.gameFinalWords.textContent = state.game.wordsCleared;
  el.gameFinalLevel.textContent = gameLevelLabel();
  el.gameOverModal.classList.add('show');
}

// ===================== 이벤트 바인딩 =====================

el.homeLink.addEventListener('click', showHome);
el.homeLink.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    showHome();
  }
});

el.tileGrid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-mode]');
  if (btn) enterMode(btn.dataset.mode);
});

el.langToggle.addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) setLang(btn.dataset.lang);
});

el.modeTabs.addEventListener('click', e => {
  const btn = e.target.closest('button[data-mode]');
  if (btn) setMode(btn.dataset.mode);
});

el.stageSelect.addEventListener('click', e => {
  const btn = e.target.closest('button[data-stage]');
  if (btn) toggleStage(Number(btn.dataset.stage));
});

el.difficultySelect.addEventListener('click', e => {
  const btn = e.target.closest('button[data-difficulty]');
  if (btn) setDifficulty(btn.dataset.difficulty);
});

el.categorySelect.addEventListener('click', e => {
  const btn = e.target.closest('button[data-category]');
  if (btn) setCategory(btn.dataset.category);
});

el.restartBtn.addEventListener('click', () => {
  hideResult();
  startCurrentMode();
});

el.resultRestart.addEventListener('click', () => {
  hideResult();
  startCurrentMode();
});

el.typingInput.addEventListener('input', handleTypingInput);
el.typingInput.addEventListener('compositionstart', () => { state.isComposing = true; typingComposedSoFar = ''; });
el.typingInput.addEventListener('compositionupdate', e => {
  typingComposedSoFar = e.data || '';
  updateTypingKeyboardHighlight();
});
el.typingInput.addEventListener('compositionend', () => {
  state.isComposing = false;
  handleTypingInput();
});
el.typingInput.addEventListener('keydown', handleTypingKeydown);

// 물리 키보드로 입력할 때, 눌린 키에 해당하는 가상 키보드 키를 정오 색으로 반짝여준다
el.typingInput.addEventListener('keydown', e => {
  if (state.mode === 'position' || state.finished) return;
  if (e.key === 'Backspace') { soundEngine.playClick(); return; }
  if (['Enter', 'Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;

  const expectedCode = currentExpectedKeyCode();
  let pressedCode = null;
  if (state.lang === 'en') {
    const key = KEYMAP.find(k => k.en === e.key.toLowerCase());
    pressedCode = key ? key.code : null;
  } else if (KEYMAP.some(k => k.code === e.code)) {
    pressedCode = e.code;
  }
  if (pressedCode) flashKeyInRegistry(typingKeyElsByCode, pressedCode, pressedCode === expectedCode);
});

document.addEventListener('keydown', handlePositionKeydown);

// 창 크기가 바뀌면(반응형 구간 전환 포함) 자판 위 손 오버레이 위치를 다시 계산한다
window.addEventListener('resize', () => {
  if (state.mode === 'position' && state.view === 'practice') renderPositionPrompt();
});

// 결과/게임종료 팝업이 떠 있을 때 Enter를 누르면 "한번 더!" 버튼과 동일하게 동작한다.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (el.resultModal.classList.contains('show')) {
    e.preventDefault();
    el.resultRestart.click();
  } else if (el.gameOverModal.classList.contains('show')) {
    e.preventDefault();
    el.gameRestartBtn.click();
  } else if (el.levelUpModal.classList.contains('show')) {
    e.preventDefault();
    el.levelUpContinueBtn.click();
  }
});

el.soundToggleBtn.addEventListener('click', toggleSound);

el.gameStartBtn.addEventListener('click', startGame);
el.gameRestartBtn.addEventListener('click', () => {
  hideGameOver();
  startGame();
});
el.gameInput.addEventListener('input', handleGameInput);
el.gameInput.addEventListener('keydown', handleGameKeydown);
el.levelUpContinueBtn.addEventListener('click', resumeAfterLevelUp);

// ===================== 초기화 =====================

initKeyboard();
initFingerGuide();
setMode('position');
showHome();
