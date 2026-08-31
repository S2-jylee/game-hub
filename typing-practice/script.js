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
// - novel: 저작권이 만료된 실제 고전 작품 발췌 (퍼블릭 도메인, 위키문헌/구텐베르크 프로젝트 원문 대조)
//   한자 병기나 옛 표기 일부는 타이핑 연습에 맞게 현대 한글 표기로만 남겼습니다.
// - proverbs/folktale/poem: 이 프로젝트를 위해 새로 쓴 글이거나(속담 뜻풀이, 동화, 동시 일부),
//   저작권이 만료된 실제 작품(윤동주 「서시」 등, 퍼블릭 도메인)입니다.
function passage(text, source) {
  return { text, source };
}

const PASSAGES = {
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
  proverbs: {
    // 속담 원문과 그 뜻을 한 화면 안에 두 줄로 이어 붙여서, 뜻까지 통째로 타이핑하게 한다.
    ko: [
      passage('가는 말이 고와야 오는 말이 곱다.\n내가 남에게 말을 곱게 해야 남도 나에게 좋게 말한다는 뜻이에요.', '한국 속담'),
      passage('백지장도 맞들면 낫다.\n아무리 쉬운 일이라도 여럿이 힘을 합치면 훨씬 쉬워진다는 뜻이에요.', '한국 속담'),
      passage('호랑이도 제 말 하면 온다.\n누군가에 대해 이야기하고 있는데 마침 그 사람이 나타났을 때 쓰는 말이에요.', '한국 속담'),
      passage('발 없는 말이 천 리 간다.\n말은 발이 없어도 순식간에 멀리 퍼져 나가니, 말을 늘 조심해야 한다는 뜻이에요.', '한국 속담'),
      passage('티끌 모아 태산.\n아무리 작은 것도 꾸준히 모으면 나중에는 큰 것이 된다는 뜻이에요.', '한국 속담'),
      passage('소 잃고 외양간 고친다.\n일이 이미 잘못된 뒤에야 손을 쓰면 아무 소용이 없다는 뜻이에요.', '한국 속담'),
      passage('우물 안 개구리.\n넓은 세상을 알지 못하고, 자기가 아는 것이 전부인 줄 아는 사람을 이르는 말이에요.', '한국 속담'),
      passage('낮말은 새가 듣고 밤말은 쥐가 듣는다.\n아무리 조심스럽게 한 말이라도 결국 남의 귀에 들어갈 수 있으니, 말을 항상 조심해야 한다는 뜻이에요.', '한국 속담'),
      passage('천 리 길도 한 걸음부터.\n아무리 큰 일이라도 작은 것부터 차근차근 시작해야 이룰 수 있다는 뜻이에요.', '한국 속담'),
      passage('고생 끝에 낙이 온다.\n힘든 일을 참고 견디다 보면 결국에는 좋은 일이 생긴다는 뜻이에요.', '한국 속담'),
    ],
    en: [
      passage('Actions speak louder than words.\nWhat people actually do matters more than what they merely say.', 'English proverb'),
      passage('The early bird catches the worm.\nThose who start early or act quickly have the best chance of success.', 'English proverb'),
      passage("Don't judge a book by its cover.\nYou shouldn't decide what something is like based only on how it looks.", 'English proverb'),
      passage('Practice makes perfect.\nThe more you practice something, the better you become at it.', 'English proverb'),
      passage('A picture is worth a thousand words.\nAn image can express an idea more powerfully than a long explanation.', 'English proverb'),
      passage('When it rains, it pours.\nDifficult things often seem to happen all at once instead of one at a time.', 'English proverb'),
      passage('Every cloud has a silver lining.\nEven a difficult or sad situation usually has some positive side to it.', 'English proverb'),
      passage("Better late than never.\nIt's better to do something late than to never do it at all.", 'English proverb'),
      passage('The pen is mightier than the sword.\nWords and ideas can change the world more powerfully than violence can.', 'English proverb'),
      passage("Where there's a will, there's a way.\nIf you're determined enough, you'll find a way to achieve what you want.", 'English proverb'),
    ],
  },
  folktale: {
    ko: [
      passage('옛날 어느 마을에 흥부와 놀부라는 형제가 살았습니다. 욕심 많은 형 놀부는 부모님이 물려주신 재산을 혼자 다 차지하고, 마음씨 착한 동생 흥부를 집에서 내쫓았습니다. 흥부는 가난했지만 다리 다친 제비를 정성껏 치료해 주었고, 이듬해 제비가 물어다 준 박씨를 심었더니 커다란 박 속에서 금은보화가 쏟아져 나왔습니다.', '전래동화 「흥부와 놀부」'),
      passage('콩쥐는 어릴 때 어머니를 여의고 계모와 함께 살게 되었습니다. 계모는 자기 딸 팥쥐만 예뻐하고 콩쥐에게는 힘든 일만 시켰습니다. 어느 날 잔치에 가고 싶었던 콩쥐에게 두꺼비와 참새들이 나타나 항아리에 물을 채우고 곡식 껍질을 까는 것을 도와주었습니다.', '전래동화 「콩쥐팥쥐」'),
      passage('가난한 남매가 산 너머 사는 어머니를 기다리던 어느 날, 호랑이가 어머니로 변장하고 찾아왔습니다. 오누이는 재빨리 눈치를 채고 우물가 나무 위로 도망쳤습니다. 하늘에서 내려온 동아줄을 타고 올라간 오누이는 각각 해와 달이 되었다고 합니다.', '전래동화 「해와 달이 된 오누이」'),
      passage('가난한 나무꾼이 산속에서 사냥꾼에게 쫓기는 사슴을 구해 주었습니다. 사슴은 은혜를 갚기 위해 나무꾼에게 하늘에서 내려온 선녀들이 목욕하는 연못을 알려주었습니다. 나무꾼은 선녀의 날개옷을 숨겨 함께 살게 되었지만, 훗날 선녀는 아이들과 함께 다시 하늘로 올라갔습니다.', '전래동화 「선녀와 나무꾼」'),
      passage('가난한 총각이 밭을 갈다가 우렁이 한 마리를 주워 집으로 가져왔습니다. 그날부터 총각이 밭에 나가 있는 사이, 우렁이 속에서 아리따운 색시가 나와 맛있는 밥상을 차려 놓곤 했습니다. 총각은 색시의 정체를 알아내고는 함께 살게 되었습니다.', '전래동화 「우렁각시」'),
      passage('옛날 어느 겨울밤, 호랑이 한 마리가 마을에 내려와 소를 잡아먹으려 했습니다. 그런데 마침 아기가 울음을 그치지 않자 어머니가 밖에 있는 호랑이보다 무섭다는 곶감을 아기에게 주자 울음이 뚝 그쳤습니다. 이를 들은 호랑이는 자기보다 무서운 곶감이 있다는 말에 놀라 도망쳐 버렸습니다.', '전래동화 「호랑이와 곶감」'),
      passage('옛날 어느 임금님에게는 아무도 모르는 비밀이 있었습니다. 임금님의 귀가 당나귀처럼 길다는 것이었습니다. 이 사실을 알게 된 이발사는 답답한 마음을 참지 못하고 대나무 숲에 들어가 소리쳤습니다. "임금님 귀는 당나귀 귀!" 그 뒤로 바람이 불 때마다 대나무 숲에서 그 소리가 들려왔다고 합니다.', '전래동화 「임금님 귀는 당나귀 귀」'),
      passage('옛날 어느 마을에 몹시 인색한 부자가 살았습니다. 그는 밥을 먹을 때마다 굴비를 천장에 매달아 놓고 한 번 쳐다볼 때마다 밥 한 술을 떠먹었습니다. 아들이 굴비를 두 번 쳐다보자 그는 크게 화를 내며 짜다고 나무랐다고 합니다. 이 이야기에서 몹시 인색한 사람을 자린고비라고 부르게 되었습니다.', '전래동화 「자린고비」'),
    ],
    en: [
      passage('Once upon a time, a kind young girl lived with her cruel stepmother and two stepsisters who forced her to do all the housework. They called her Cinderella because she was always covered in ashes from the fireplace. One night, a fairy godmother appeared and helped her attend the royal ball, where she danced with the prince until the clock struck midnight.', 'Folktale, "Cinderella"'),
      passage('A little girl in a red hooded cloak was sent by her mother to bring food to her sick grandmother who lived deep in the forest. On the way, she met a sly wolf who asked where she was going. The wolf rushed ahead, disguised himself as her grandmother, and waited for the girl to arrive at the cottage.', 'Folktale, "Little Red Riding Hood"'),
      passage('Three little pigs each built a house to protect themselves from a hungry wolf. The first pig built his house of straw, and the second built his of sticks, but both houses were blown down easily. The third pig worked hard to build his house of bricks, and when the wolf huffed and puffed, the sturdy house would not fall.', 'Folktale, "The Three Little Pigs"'),
      passage('A speedy hare once mocked a slow tortoise for being so sluggish, so the tortoise challenged him to a race. Confident of victory, the hare ran ahead and then stopped to take a long nap in the shade. While he slept, the tortoise kept walking slowly and steadily, eventually crossing the finish line first.', "Aesop's Fable, \"The Tortoise and the Hare\""),
      passage('Among a family of ducklings, one little bird looked different from all the rest and was teased for being big and gray. Feeling lonely and unwanted, he wandered away and spent a difficult winter alone. In the spring, he was amazed to discover his reflection in the water and realized he had grown into a beautiful swan.', 'Folktale, "The Ugly Duckling"'),
      passage('A curious girl named Goldilocks wandered into a cottage in the woods that belonged to a family of three bears. She tasted their porridge, sat in their chairs, and finally fell asleep in the smallest bed. When the bears returned home, they were surprised to find someone had been in their house.', 'Folktale, "Goldilocks and the Three Bears"'),
      passage('A young shepherd boy grew bored watching his sheep and decided to shout that a wolf was attacking, just to see the villagers come running. He laughed as they rushed to help and found nothing wrong. When a real wolf appeared days later, no one believed his cries for help anymore.', "Aesop's Fable, \"The Boy Who Cried Wolf\""),
      passage('A hungry fox spotted a bunch of ripe grapes hanging from a high vine and tried again and again to reach them. No matter how high he jumped, the grapes stayed just out of reach. Finally, he gave up and walked away, muttering that the grapes were probably sour anyway.', "Aesop's Fable, \"The Fox and the Grapes\""),
    ],
  },
  poem: {
    ko: [
      passage('죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를,\n잎새에 이는 바람에도\n나는 괴로워했다.\n별을 노래하는 마음으로\n모든 죽어가는 것을 사랑해야지\n그리고 나한테 주어진 길을\n걸어가야겠다.\n\n오늘 밤에도 별이 바람에 스치운다.', '윤동주, 「서시」(1941) · 퍼블릭 도메인'),
      passage('봄비가 사뿐사뿐\n내려앉아요\n새싹들은 기지개를\n활짝 켜지요\n\n토닥토닥 두드리는\n작은 빗소리\n온 세상이 초록으로\n물이 들어요', '연습용 창작 동시 「봄비」'),
      passage('살금살금 고양이가\n지나갑니다\n소리 없이 사뿐사뿐\n걸어갑니다\n\n동그란 두 눈으로\n나를 보다가\n어느새 담장 위로\n사라집니다', '연습용 창작 동시 「고양이」'),
      passage('높고 높은 가을 하늘\n구름 두둥실\n잠자리도 신이 나서\n빙글빙글\n\n파란 도화지 위에\n그림 그리듯\n하늘은 오늘도\n예쁘게 웃어요', '연습용 창작 동시 「가을 하늘」'),
      passage('손을 잡고 걸어가면\n마음도 따뜻해\n웃음소리 나눠 가지면\n하루가 즐거워\n\n비 오는 날에도\n우산 하나 나눠 쓰고\n너와 나는 언제나\n좋은 친구', '연습용 창작 동시 「친구」'),
      passage('하얀 눈을 굴려굴려\n동글동글 눈사람\n까만 단추 눈을 달고\n방긋 웃는 얼굴\n\n햇살 나면 사라질까\n조마조마하지만\n오늘 하루 우리는\n좋은 친구가 되었어요', '연습용 창작 동시 「눈사람」'),
    ],
    en: [
      passage('The rain is raining all around,\nIt falls on field and tree,\nIt rains on the umbrellas here,\nAnd on the ships at sea.', 'Robert Louis Stevenson, "Rain" (1885) · Public Domain'),
      passage("Softly falls the spring rain down,\nDancing on the sleepy town,\nLittle seeds begin to wake,\nGreen leaves for the sunshine's sake.", 'Original practice poem, "Spring Rain"'),
      passage('Quiet paws on a quiet floor,\nSlipping past the kitchen door,\nRound green eyes that watch and blink,\nWhat could my small cat be thinking?', 'Original practice poem, "My Cat"'),
      passage('Up so high the autumn sky,\nClouds like cotton drifting by,\nDragonflies spin, loop, and turn,\nLeaves of gold and orange burn.', 'Original practice poem, "Autumn Sky"'),
      passage('Roll the snow round and round,\nMake a snowman on the ground,\nButtons black for happy eyes,\nWaving to the winter skies.', 'Original practice poem, "Snowman"'),
    ],
  },
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
  passageCategory: 'novel',
  lastSentence: '',
  lastPassageText: '',
  targetText: '',
  targetJamoSeq: [], // 목표 텍스트를 자모(키 입력) 단위로 분해한 시퀀스
  charJamoRange: [], // 글자별로 그 자모들이 targetJamoSeq에서 차지하는 [시작,끝] 인덱스
  typedIndex: 0, // 지금까지 맞게 입력한 자모 개수
  startTime: null,
  correctCount: 0,
  incorrectCount: 0,
  finished: false,
  // position mode
  posSequence: [],
  posIndex: 0,
  // interval
  timerId: null,
  // 타자게임
  game: {
    active: false,
    difficulty: 'easy',
    config: DIFFICULTIES.easy,
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
  statsDivider: document.getElementById('stats-divider'),
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
  typingPreview: document.getElementById('typing-preview'),
  typingHint: document.getElementById('typing-hint'),
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
  // 재생한다. 원본 파일이 긴 연속 녹음이라, 매번 짧게 잘라 튼다.
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
    gain.gain.value = 1.4; // 2.6 → 2.47 → 2.22 → 2.0 → 1.4 (5%, 10%, 10%, 30% 순차적으로 낮춤)
    source.connect(gain);
    gain.connect(this.ctx.destination);
    // 이 녹음은 0초가 아니라 약 0.2초 지점에서 실제 "딸깍" 소리가 시작된다.
    // 앞부분 무음까지 그대로 재생하면 키를 누른 순간과 소리 사이에 반박자 정도
    // 밀리는 느낌이 나서, 소리가 실제로 시작하는 지점부터 잘라 튼다.
    const clipStart = Math.min(0.19, this.typeClickBuffer.duration);
    const clipLen = Math.min(0.35, this.typeClickBuffer.duration - clipStart);
    source.start(this.ctx.currentTime, clipStart, clipLen);
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

// 첫 클릭/터치를 기다리지 않고 곧바로 mp3 디코딩을 미리 시작해둔다. AudioContext 생성과
// decodeAudioData는 사용자 제스처 없이도 항상 허용되고(실제 소리 재생만 제스처가 필요),
// 이렇게 미리 받아두면 화면에 들어가자마자 타이핑을 시작해도 첫 글자부터 소리가 난다.
soundEngine.init();

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
  const needsCategory = mode === 'passage';
  el.stageSelect.classList.toggle('show', needsStage);
  el.categorySelect.classList.toggle('show', needsCategory);
  el.statsDivider.classList.toggle('show', needsStage || needsCategory);
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
    d('Ctrl', 1.3), d('Fn', 0.9), d('Win', 1.1), d('Alt', 1.3), d('SPACE BAR', 6, 'key-space'), d('Alt', 1.3), d('Ctrl', 1.3),
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

// 목표 텍스트 전체를 "실제로 눌러야 하는 자모(키 입력 단위)" 시퀀스로 미리 분해해두고,
// 자리연습처럼 물리 키를 하나씩 받아 순서대로 정오를 판정한다(네이티브 한글 IME에 기대지
// 않는다). 글자별로 그 자모들이 시퀀스에서 차지하는 [시작,끝] 인덱스도 같이 구해서
// renderTypingDisplay()에서 글자 단위 색칠에 쓴다.
function buildJamoSequence(text) {
  const seq = [];
  const charRange = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const jamos = ch === '\n' ? [ch] : decomposeKoreanChar(ch);
    const start = seq.length;
    seq.push(...jamos);
    charRange.push({ start, end: seq.length - 1 });
  }
  return { seq, charRange };
}

function currentExpectedKeyCode() {
  const jamo = state.targetJamoSeq[state.typedIndex];
  if (!jamo || jamo === '\n') return null;
  if (state.lang === 'en') {
    const key = KEYMAP.find(k => k.en === jamo.toLowerCase());
    return key ? key.code : null;
  }
  return jamoToKeyCode(jamo);
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

  const built = buildJamoSequence(target.text);
  state.targetJamoSeq = built.seq;
  state.charJamoRange = built.charRange;
  state.typedIndex = 0;

  updateKeyboardLang();
  updateTypingKeyboardStage();
  renderTypingDisplay();
  updateTypingKeyboardHighlight();
  updateTypingHint();
  el.typingPreview.value = '';
  el.typingPreview.focus();
}

// 입력 상태에 따라 안내 문구를 바꾼다: 오타가 나면 빨갛게, 다 쓰면 Enter를 안내한다
function updateTypingHint(hadTypo) {
  const target = state.targetText;
  el.typingHint.classList.remove('bad', 'good');
  if (!target || state.typedIndex === 0) {
    el.typingHint.textContent = '';
    return;
  }
  if (hadTypo) {
    el.typingHint.textContent = '❌ 오타예요! 다시 입력해보세요';
    el.typingHint.classList.add('bad');
    return;
  }
  if (state.typedIndex >= state.targetJamoSeq.length) {
    el.typingHint.textContent = '✅ 다 썼어요! Enter를 눌러 결과를 확인하세요';
    el.typingHint.classList.add('good');
    return;
  }
  el.typingHint.textContent = '👍 잘하고 있어요! 이대로 계속 쳐보세요';
}

// 지금까지 "정확히" 완성한 글자들만 이어붙인 문자열 (오타는 애초에 진행이 막혀 있어서
// typedIndex 이전 구간은 항상 target의 정확한 접두어와 같다). 여러 줄(예: 속담+뜻)은
// 한 줄짜리 입력칸에 자연스럽게 보이도록 줄바꿈을 공백으로 바꿔서 보여준다.
function currentTypedText() {
  const target = state.targetText;
  const ranges = state.charJamoRange;
  let count = 0;
  for (let i = 0; i < target.length; i++) {
    if (ranges[i] && state.typedIndex > ranges[i].end) count = i + 1;
    else break;
  }
  return target.slice(0, count);
}

function renderTypingDisplay() {
  const target = state.targetText;
  const ranges = state.charJamoRange;
  let html = '';
  for (let i = 0; i < target.length; i++) {
    if (target[i] === '\n') {
      html += '<br>';
      continue;
    }
    const ch = escapeHtml(target[i]);
    const range = ranges[i];
    let cls = 'pending';
    if (range) {
      if (state.typedIndex > range.end) cls = 'correct';
      else if (state.typedIndex >= range.start) cls = 'current';
    }
    html += `<span class="${cls}">${ch}</span>`;
  }
  el.typingDisplay.innerHTML = html;
  const currentSpan = el.typingDisplay.querySelector('.current');
  // 다 치고 나서야 스크롤되는 게 아니라, 다음에 칠 글자가 항상 화면 안에 미리 보이도록
  // (예측하며 칠 수 있게) 매번 지금 위치를 화면 가운데 쪽으로 당겨온다.
  if (currentSpan) currentSpan.scrollIntoView({ block: 'center' });

  el.typingPreview.value = currentTypedText();
  el.typingPreview.scrollTop = el.typingPreview.scrollHeight; // 긴 글에서도 방금 친 부분이 보이게
}

function shakeTypingDisplay() {
  el.typingDisplay.classList.remove('shake');
  void el.typingDisplay.offsetWidth; // 리플레이를 위한 강제 리플로우
  el.typingDisplay.classList.add('shake');
  setTimeout(() => el.typingDisplay.classList.remove('shake'), 300);
}

// 지금 기대하는 자모(jamo)를 물리 키 e가 실제로 만들어내는지 판정한다.
// 한글 자모(ㄱ~ㅣ 호환 자모 범위)는 2벌식 물리 키 위치로, 그 외(영문/공백/문장부호)는
// 실제 입력 문자로 그대로 비교한다.
function keyMatchesJamo(e, jamo) {
  const code = jamo.charCodeAt(0);
  const isHangulJamo = code >= 0x3131 && code <= 0x3163;
  if (isHangulJamo) {
    const base = HANGUL_SHIFT_TO_BASE[jamo] || jamo;
    const key = KEYMAP.find(k => k.ko === base);
    return !!key && e.code === key.code;
  }
  return e.key === jamo;
}

const TYPING_MODES = ['rowword', 'randomword', 'sentence', 'passage'];

// 자리연습처럼 document 전체에서 물리 키를 직접 받아 처리한다. 별도의 입력 상자(input/
// textarea) 없이도, 참고 화면처럼 화면 아무 데나 있는 상태로 바로 타이핑할 수 있다.
function handleTypingModeKeydown(e) {
  if (!TYPING_MODES.includes(state.mode) || state.view !== 'practice' || state.finished) return;

  if (e.key === 'Enter') {
    e.preventDefault();

    // 속담처럼 목표 텍스트 중간에 실제 줄바꿈이 있는 경우, 그 자리에서는 Enter가
    // "제출"이 아니라 그 줄바꿈 자체를 입력하는 정상적인 한 글자로 처리돼야 한다.
    if (state.targetJamoSeq[state.typedIndex] === '\n') {
      soundEngine.playTypeClick();
      state.typedIndex++;
      state.correctCount = state.typedIndex;
      renderTypingDisplay();
      updateTypingKeyboardHighlight();
      updateTypingHint();
      tickStats();
      return;
    }

    if (state.targetJamoSeq.length === 0 || state.typedIndex < state.targetJamoSeq.length) return;
    // 이 핸들러 자체가 document에 바로 붙어있어서, 같은 document에 등록된 "결과창이
    // 떠 있으면 Enter로 재시작" 단축키와 같은 노드(target)의 형제 리스너다. stopPropagation()은
    // 조상으로의 전파만 막을 뿐 같은 노드의 다른 리스너 실행은 막지 못하므로,
    // stopImmediatePropagation()으로 그 형제 리스너 자체가 아예 실행되지 않게 막는다.
    e.stopImmediatePropagation();

    state.finished = true;
    showResult();
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (state.typedIndex > 0) {
      soundEngine.playClick();
      state.typedIndex--;
      renderTypingDisplay();
      updateTypingKeyboardHighlight();
      updateTypingHint();
    }
    return;
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return; // 단축키는 건드리지 않는다
  if (e.key.length !== 1) return; // 화살표, F5 등 특수 키는 무시

  const expectedJamo = state.targetJamoSeq[state.typedIndex];
  if (!expectedJamo) return; // 이미 다 침 (Enter만 기다리는 중)

  e.preventDefault();
  startTimerIfNeeded();

  const matched = keyMatchesJamo(e, expectedJamo);
  let pressedCode = null;
  if (state.lang === 'en') {
    const key = KEYMAP.find(k => k.en === e.key.toLowerCase());
    pressedCode = key ? key.code : null;
  } else if (KEYMAP.some(k => k.code === e.code)) {
    pressedCode = e.code;
  }
  if (pressedCode) {
    flashKeyInRegistry(typingKeyElsByCode, pressedCode, matched);
  } else {
    // 문장부호/공백처럼 우리 가상 키보드에 없는 키는 반짝임 없이 소리만 준다
    matched ? soundEngine.playCorrect() : soundEngine.playWrong();
  }

  if (matched) {
    state.typedIndex++;
    state.correctCount = state.typedIndex;
    updateTypingHint(false);
  } else {
    state.incorrectCount++;
    shakeTypingDisplay();
    updateTypingHint(true);
  }
  renderTypingDisplay();
  updateTypingKeyboardHighlight();
  tickStats();
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
  clearGameField(); // 다음 스테이지로 넘어갈 때 화면에 남아있던 폭탄은 모두 리셋한다
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
    applySpeedEffect(0.35, 4000);
    showBonusToast('🐢 4초간 느려져요!');
  } else if (type === 'freeze') {
    applySpeedEffect(0, 4000);
    showBonusToast('🧊 4초간 멈춰요!');
  } else if (type === 'clear') {
    clearAllWords();
    showBonusToast('✨ 화면 정리!');
  }
}

// 입력 중에는 일치하는 폭탄을 하이라이트만 하고, 실제 격침은 Enter를 눌러야 이루어진다.
// 타이핑 소리는 (정오답 판정과 무관하게) 물리 키를 누르는 순간 바로 재생한다 — 아래
// keydown 리스너 쪽에서 처리하고, 여기서는 화면 표시만 갱신한다.
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

// 화면 어디를 클릭하든 입력 미리보기 칸에 포커스가 돌아오게 해서, 마우스로 굳이
// 그 칸을 다시 클릭하지 않아도 바로 이어서 타이핑할 수 있게 한다.
el.modeTyping.addEventListener('click', () => {
  el.typingPreview.focus();
});

el.resultRestart.addEventListener('click', () => {
  hideResult();
  startCurrentMode();
});

document.addEventListener('keydown', handlePositionKeydown);
document.addEventListener('keydown', handleTypingModeKeydown);

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
// 키를 하나 누를 때마다(자모/글자 단위) 바로 타이핑 소리를 낸다. 정오답 판정과는 무관한
// "치고 있다"는 느낌만 주는 소리이고, 실제 정오답 소리는 Enter로 단어를 확정할 때
// popWord()/오답 흔들림 쪽에서 원래대로 따로 재생된다.
el.gameInput.addEventListener('keydown', e => {
  if (e.key === 'Backspace') { soundEngine.playClick(); return; }
  if (['Enter', 'Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return; // 화살표 등 특수 키 제외
  soundEngine.playTypeClick();
});
el.levelUpContinueBtn.addEventListener('click', resumeAfterLevelUp);

// ===================== 초기화 =====================

initKeyboard();
initFingerGuide();
setMode('position');
showHome();
