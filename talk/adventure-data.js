// 🗺️ 어떻게 말할까? 상황 데이터: 장소 10곳 × 상황 10가지 = 100가지
// 장소마다: 바닥 색, 꾸밈(지나갈 수 없는 칸) [x, y, 그림], 사람이 서는 자리 spots(3곳),
// 상황 pool(10가지) → 한 판에 pool에서 3가지를 무작위로 골라 spots에 세워요.
// 상황: { e: 그림, name, turns: [[상대방의 말, 알맞은 대답, 틀린 대답, 틀린 대답], ...] }
window.ADV_AREAS = {
  classroom: { floor: "#f7efe2", floor2: "#e9dcc5", start: [3, 7],
    deco: [[0, 0, "🟩"], [1, 0, "🟩"], [2, 0, "🟩"], [3, 0, "🟩"], [4, 0, "🟩"], [6, 0, "🕐"], [1, 2, "🪑"], [2, 2, "📚"], [4, 2, "🪑"], [5, 2, "✏️"], [1, 4, "🪑"], [5, 4, "🪑"], [0, 6, "🪴"], [6, 6, "🗑️"]],
    spots: [[3, 4], [5, 1], [1, 6]],
    pool: [
      { e: "🧒", name: "넘어진 친구", turns: [
        ["Ouch! I fell down...", "Are you okay?", "Ha ha, that's funny!", "I like apples."],
        ["My knee hurts a little.", "Do you need a band-aid?", "Let's run fast!", "Good night!"],
        ["Yes, please. Thank you!", "Here you go. Feel better!", "No, it's mine.", "See you last week!"]] },
      { e: "👩‍🏫", name: "선생님", turns: [
        ["Good morning! Did you do your homework?", "Yes, I did. Here it is.", "No, I'm a student.", "It's sunny."],
        ["Great job! Can you close the door, please?", "Sure, no problem!", "I'm sorry to hear that.", "My name is Door."],
        ["Thank you!", "You're welcome!", "Me too!", "Happy birthday!"]] },
      { e: "👧", name: "새로 온 친구", turns: [
        ["Hi, I'm new here. I'm Lily.", "Hi, Lily! Nice to meet you.", "Bye, Lily!", "I'm ten o'clock."],
        ["Where is the bathroom?", "It's next to the library. I'll show you.", "Yes, it is.", "It's my pencil."],
        ["Thanks! You're so kind.", "No problem! Let's be friends.", "No, thank you.", "It's raining."]] },
      { e: "🧒", name: "지우개를 두고 온 친구", turns: [
        ["Oh no, I forgot my eraser.", "You can use mine.", "I like your shoes.", "It's Tuesday."],
        ["Really? Thank you!", "You're welcome.", "No, I'm an eraser.", "Good night!"],
        ["I'll give it back after class.", "Okay, no problem!", "I'm twelve years old.", "It's raining."]] },
      { e: "👦", name: "숙제를 묻는 친구", turns: [
        ["What is our homework today?", "We have to read page ten.", "I ate pizza.", "Nice to meet you."],
        ["Oh, when is it due?", "It's due tomorrow.", "It's blue.", "Yes, I'm a book."],
        ["Thanks for telling me!", "Any time!", "Oh, that's too bad.", "See you last year!"]] },
      { e: "👧", name: "필통을 잃어버린 친구", turns: [
        ["I lost my pencil case...", "Don't cry. Let's look for it together.", "That's great!", "I have two dogs."],
        ["It's pink with a cat on it.", "Is this it? It was under the desk.", "I like green.", "Happy New Year!"],
        ["Yes! Thank you so much!", "I'm happy for you!", "No, thank you.", "It's cold today."]] },
      { e: "🧑‍🎨", name: "미술 선생님", turns: [
        ["Let's draw a picture today. What will you draw?", "I will draw my family.", "I'm eight o'clock.", "No, I don't."],
        ["Wonderful! Do you have crayons?", "Yes, I have some.", "I'm sorry to hear that.", "It's a sunny day."],
        ["Show me when you finish!", "Okay, I will!", "Bye, see you yesterday!", "It's my cat."]] },
      { e: "🧒", name: "같이 점심 먹을 친구", turns: [
        ["It's lunch time! Can I sit with you?", "Of course! Sit here.", "No, it's my lunch box.", "I'm nine."],
        ["What did you bring for lunch?", "I brought a sandwich.", "I brought my bed.", "Good morning!"],
        ["Do you want some of my apple?", "Yes, please. Thank you!", "It's under the chair.", "I'm a sandwich."]] },
      { e: "👦", name: "더워하는 친구", turns: [
        ["It's so hot in here.", "Let's open the window.", "Let's wear a coat.", "I'm hungry."],
        ["Can you help me? It's heavy.", "Sure, I'll help you.", "No, it's a window.", "Happy birthday!"],
        ["Ah, that feels much better!", "Yes, it's nice and cool now.", "I'm sorry I'm late.", "It's my pencil."]] },
      { e: "👧", name: "생일인 친구", turns: [
        ["Today is my birthday!", "Happy birthday!", "I'm sorry to hear that.", "Good night!"],
        ["I'm ten years old now.", "Wow! Have a great day!", "I'm a cake.", "It's next to the door."],
        ["Thanks! Please come to my party.", "I'd love to come!", "No, it's Monday.", "Yes, I fell down."]] }
    ] },

  playground: { floor: "#dff5d3", floor2: "#b7e3a1", start: [3, 7],
    deco: [[0, 0, "🌳"], [6, 0, "🌳"], [2, 1, "🛝"], [5, 3, "⛲"], [0, 4, "🌷"], [3, 5, "🌼"], [6, 6, "🌳"], [0, 7, "🌲"]],
    spots: [[1, 2], [5, 1], [2, 4]],
    pool: [
      { e: "🧒", name: "그네 기다리는 친구", turns: [
        ["Can I use the swing after you?", "Sure! I'll be done soon.", "No, I'm a swing.", "It's Monday."],
        ["Thanks! How long will you swing?", "Just two more minutes.", "I'm nine years old.", "Yes, please."],
        ["Okay, I'll wait here.", "Here, it's your turn now!", "See you yesterday!", "I'm hungry."]] },
      { e: "👦", name: "공을 잃어버린 아이", turns: [
        ["I lost my ball. Have you seen it?", "I think it's under the slide.", "Yes, it's a ball.", "Good morning!"],
        ["Oh, can you help me get it?", "Sure, let's go together.", "I'm sorry to hear that.", "I like soccer."],
        ["I found it! Thank you!", "You're welcome! Have fun!", "Oh no, that's too bad.", "It's under the bed."]] },
      { e: "👵", name: "벤치의 할머니", turns: [
        ["Excuse me, is this seat taken?", "No, please sit down.", "Yes, I'm a seat.", "I like ice cream."],
        ["It's a beautiful day, isn't it?", "Yes, it's really sunny!", "No, it's my bag.", "Good night!"],
        ["Have a nice day, dear.", "You too! Bye!", "Yes, please.", "I'm seven."]] },
      { e: "🧒", name: "술래잡기 하자는 친구", turns: [
        ["Do you want to play tag with us?", "Yes! That sounds fun.", "It's a tag.", "I'm fine, thank you."],
        ["You are 'it'! Count to ten.", "Okay! One, two, three...", "I'm ten years old.", "No, it's my ball."],
        ["Ha ha! You can't catch me!", "I'm coming to get you!", "Nice to meet you.", "It's a rainy day."]] },
      { e: "👧", name: "모래성 만드는 아이", turns: [
        ["Look! I'm making a sand castle.", "Wow, it's so big!", "I'm a castle.", "See you tomorrow!"],
        ["Do you want to help me?", "Sure! I'll get some water.", "No, it's sunny.", "I'm sorry I'm late."],
        ["Great! Now it's perfect!", "We did a great job!", "Oh no, that's too bad.", "I have a cold."]] },
      { e: "👦", name: "줄넘기 하는 친구", turns: [
        ["How many times can you jump rope?", "I can jump twenty times.", "I can jump to the moon.", "It's blue."],
        ["Wow! Can you show me?", "Sure, watch me!", "No, I'm a rope.", "Good night!"],
        ["You're really good at it!", "Thanks! You can try, too.", "I'm sorry to hear that.", "It's my lunch."]] },
      { e: "👨", name: "강아지 산책하는 아저씨", turns: [
        ["Hello! Do you want to pet my dog?", "Yes, please! Is he friendly?", "No, I'm a dog.", "It's three o'clock."],
        ["Yes, he's very friendly. His name is Max.", "Hi, Max! You're so cute!", "I'm a cute dog.", "I'm hungry."],
        ["He likes you!", "I like him, too!", "Oh, that's too bad.", "See you last week!"]] },
      { e: "🧒", name: "다친 새를 본 친구", turns: [
        ["Look! There is a little bird on the ground.", "Oh, it looks hurt.", "Let's play soccer.", "It's my birthday."],
        ["What should we do?", "Let's tell a grown-up.", "Let's go to sleep.", "I'm ten."],
        ["Good idea! Let's go find the teacher.", "Okay, let's hurry!", "No, thank you.", "It's a big tree."]] },
      { e: "👧", name: "아이스크림을 떨어뜨린 아이", turns: [
        ["Oh no! I dropped my ice cream!", "Oh no! Are you okay?", "Yummy! Thank you!", "I'm a student."],
        ["I'm sad. It was my favorite.", "Let's share mine.", "That's great!", "It's next to the bank."],
        ["Really? You're so nice!", "That's what friends are for!", "Yes, it's raining.", "Turn left."]] },
      { e: "👦", name: "미끄럼틀 차례 기다리는 아이", turns: [
        ["Hey! Don't push. Wait your turn.", "Oh, I'm sorry.", "Thank you!", "I like pizza."],
        ["It's okay. Let's go one by one.", "Okay. You go first.", "No, I'm a slide.", "It's cold."],
        ["Wheee! That was fun!", "My turn now!", "I'm sorry to hear that.", "Happy Halloween!"]] }
    ] },

  market: { floor: "#eef2ff", floor2: "#c7d2fe", start: [3, 7],
    deco: [[0, 0, "🥛"], [1, 0, "🥚"], [2, 0, "🧀"], [4, 0, "🍎"], [5, 0, "🍌"], [6, 0, "🥕"], [0, 3, "🍞"], [1, 3, "🥖"], [5, 3, "🍪"], [6, 3, "🍫"], [6, 6, "🛒"]],
    spots: [[3, 2], [0, 5], [5, 5]],
    pool: [
      { e: "🧑‍💼", name: "가게 직원", turns: [
        ["Hello! Can I help you?", "Yes, where can I find the milk?", "Yes, I'm a student.", "Happy New Year!"],
        ["It's over there, next to the eggs.", "Thank you very much!", "I'm sorry to hear that.", "It's blue."],
        ["You're welcome. Anything else?", "No, that's all. Thanks!", "Yes, it's mine.", "Nice to meet you, too."]] },
      { e: "👧", name: "엄마를 잃어버린 아이", turns: [
        ["I can't find my mom...", "Don't worry. I'll help you.", "That's great!", "I like milk."],
        ["She's wearing a red coat.", "Let's ask the staff for help.", "I'm wearing shoes.", "Yes, please."],
        ["Mom! There she is! Thank you so much!", "I'm glad you found her!", "Oh, that's too bad.", "It's under the table."]] },
      { e: "🧑", name: "계산대 직원", turns: [
        ["That will be five dollars.", "Here you are.", "I'm five years old.", "See you!"],
        ["Do you need a bag?", "Yes, please.", "No, I'm a bag.", "It's cloudy."],
        ["Here's your change. Have a good day!", "Thanks, you too!", "Happy birthday!", "I lost my pencil."]] },
      { e: "🧑‍🍳", name: "시식 코너 직원", turns: [
        ["Would you like to try some cheese?", "Yes, please!", "No, I'm cheese.", "It's Sunday."],
        ["How is it?", "It's really good!", "It's on the table.", "I'm eleven."],
        ["Do you want to buy some?", "Yes, I'll take one, please.", "I want to sleep.", "Nice to meet you."]] },
      { e: "👴", name: "손이 안 닿는 할아버지", turns: [
        ["Excuse me, I can't reach that box.", "I'll get it for you.", "I'm a box.", "It's a sunny day."],
        ["The blue one, please.", "Here you are.", "I like red.", "Good morning!"],
        ["Thank you, you're very kind.", "You're welcome!", "Me too!", "It's my turn."]] },
      { e: "🧑‍🌾", name: "과일 파는 아저씨", turns: [
        ["Fresh apples! How many do you want?", "Three apples, please.", "I'm three.", "It's an apple."],
        ["Anything else?", "Can I have some bananas, too?", "No, I'm a banana.", "I'm sleepy."],
        ["Here you go. That's six dollars.", "Here's six dollars.", "I'm six years old.", "Happy birthday!"]] },
      { e: "👧", name: "카트에 부딪힌 아이", turns: [
        ["Ouch! Your cart hit my foot!", "I'm so sorry! Are you okay?", "Ha ha!", "I like carts."],
        ["It's okay. It doesn't hurt much.", "I'll be more careful.", "It's my cart.", "Good night!"],
        ["Thank you. Have a nice day!", "You too!", "No, thanks.", "I'm a foot."]] },
      { e: "👩‍🍳", name: "빵집 직원", turns: [
        ["Hi! What would you like?", "Can I have a chocolate cake?", "I'm a cake.", "I'm fine, thanks."],
        ["Sure. Is it for a birthday?", "Yes, it's my mom's birthday.", "No, it's Tuesday.", "It's under the bed."],
        ["How nice! I'll write 'Happy Birthday' on it.", "Thank you so much!", "I'm sorry.", "See you yesterday!"]] },
      { e: "👦", name: "오렌지를 쏟은 아이", turns: [
        ["Oops! I dropped my oranges!", "I'll help you pick them up.", "Let's kick them.", "Good morning!"],
        ["Thank you! They are rolling everywhere!", "Here's one more!", "I'm rolling.", "It's windy."],
        ["Is that all of them?", "Yes, I think so.", "No, I'm an orange.", "Happy New Year!"]] },
      { e: "👩", name: "줄 서 있는 아주머니", turns: [
        ["Excuse me, are you in line?", "Yes, I am. The line starts here.", "No, I'm a line.", "I like milk."],
        ["Oh, sorry. I'll wait behind you.", "That's okay.", "Yes, please.", "It's hot."],
        ["The line is long today, isn't it?", "Yes, it is. It's busy.", "I'm long.", "It's my dog."]] }
    ] },

  airport: { floor: "#f1f5f9", floor2: "#cbd5e1", start: [3, 7],
    deco: [[0, 0, "🪟"], [1, 0, "✈️"], [2, 0, "🪟"], [4, 0, "🪟"], [5, 0, "🛫"], [6, 0, "🪟"], [3, 3, "🧳"], [0, 5, "💺"], [6, 4, "💺"], [6, 7, "🪴"]],
    spots: [[1, 2], [5, 2], [2, 5]],
    pool: [
      { e: "👮", name: "출국 심사 직원", turns: [
        ["May I see your passport, please?", "Sure, here it is.", "No, it's a passport.", "I'm hungry."],
        ["Where are you going?", "I'm going to London.", "I went yesterday.", "It's red."],
        ["Okay. Have a nice trip!", "Thank you!", "You're welcome!", "Good night!"]] },
      { e: "💁", name: "안내 데스크", turns: [
        ["Hello! How can I help you?", "Where is Gate 5, please?", "I'm fine, and you?", "It's my birthday."],
        ["Go straight and turn left.", "Thank you. Is it far?", "Turn left is a dog.", "See you tomorrow!"],
        ["No, it's just a five-minute walk.", "Great, thanks a lot!", "I'm sorry to hear that.", "It's a banana."]] },
      { e: "🧑‍✈️", name: "비행기 승무원", turns: [
        ["Would you like chicken or fish?", "Chicken, please.", "Yes, please.", "I'm a fish."],
        ["Anything to drink?", "Orange juice, please.", "I'm eating chicken.", "It's a plane."],
        ["Here you go. Enjoy your meal!", "Thank you very much!", "Nice to meet you!", "I'm late."]] },
      { e: "💁‍♂️", name: "체크인 카운터", turns: [
        ["Good morning! Where are you flying today?", "To New York, please.", "I'm flying a kite.", "It's my bag."],
        ["Do you have any bags to check?", "Yes, I have one suitcase.", "No, I'm a bag.", "Nice to meet you."],
        ["Window seat or aisle seat?", "Window seat, please.", "My seat is red.", "I'm hungry."]] },
      { e: "👧", name: "비행기가 무서운 아이", turns: [
        ["I'm scared. This is my first flight.", "Don't worry. It will be fun.", "Ha ha, you're a baby!", "That's great!"],
        ["What if it shakes?", "It's okay. Just hold my hand.", "Let's jump.", "It's cold."],
        ["Thank you. I feel better now.", "I'm glad to hear that!", "Oh no!", "See you yesterday."]] },
      { e: "🧔", name: "가방을 찾는 여행객", turns: [
        ["Excuse me, I can't find my suitcase.", "What color is it?", "I like suitcases.", "I'm going home."],
        ["It's big and yellow.", "Is that yours over there?", "It's a banana.", "No, I'm yellow."],
        ["Yes! That's mine! Thanks!", "You're welcome. Have a good trip!", "I'm sorry to hear that.", "Turn right."]] },
      { e: "👮‍♀️", name: "보안 검색 직원", turns: [
        ["Please put your bag on the belt.", "Okay, here it is.", "No, it's my belt.", "Good night!"],
        ["Do you have any water in your bag?", "No, I don't.", "Yes, I'm water.", "It's Friday."],
        ["All done. You can go now.", "Thank you!", "I'm sorry.", "Happy birthday!"]] },
      { e: "👱", name: "외국인 관광객", turns: [
        ["Hi! Is this your first time in Korea?", "No, I live in Korea.", "Yes, I'm Korea.", "It's ten dollars."],
        ["Can you tell me a good food to try?", "You should try bibimbap!", "I'm full.", "No, I can't swim."],
        ["Sounds delicious! Thank you!", "Enjoy your trip!", "Me neither.", "It's my book."]] },
      { e: "🧑‍💼", name: "기념품 가게 직원", turns: [
        ["Hello! Are you looking for a gift?", "Yes, a gift for my friend.", "No, I'm a gift.", "I'm sleepy."],
        ["How about this key ring?", "It's cute! How much is it?", "It's a key.", "Good morning!"],
        ["It's three dollars.", "I'll take it, please.", "I'm three years old.", "Turn left."]] },
      { e: "🤱", name: "짐이 많은 아기 엄마", turns: [
        ["Oh, I have too many bags.", "Can I help you carry one?", "Your baby is a bag.", "I like planes."],
        ["That would be great. Thank you!", "No problem. Where are you going?", "No, thank you.", "It's raining."],
        ["To Gate 7. It's right there.", "Here we are. Have a nice flight!", "I'm seven.", "Happy New Year!"]] }
    ] },

  restaurant: { floor: "#fff7ed", floor2: "#fed7aa", start: [3, 7],
    deco: [[0, 0, "🍳"], [1, 0, "🍲"], [2, 0, "🥘"], [4, 0, "🧂"], [5, 0, "🥤"], [6, 0, "🪴"], [1, 3, "🍽️"], [5, 3, "🍽️"], [0, 6, "🪴"], [6, 6, "🍝"]],
    spots: [[3, 1], [1, 5], [5, 5]],
    pool: [
      { e: "🤵", name: "자리 안내 직원", turns: [
        ["Welcome! How many people?", "Two people, please.", "I'm two years old.", "It's delicious."],
        ["This way, please. Here's the menu.", "Thank you.", "No, I'm a menu.", "Good night!"],
        ["Are you ready to order?", "Yes. One pizza, please.", "Yes, I'm ready to sleep.", "It's under the table."]] },
      { e: "👩‍🍳", name: "요리사", turns: [
        ["Do you like spicy food?", "No, I don't. Not too spicy, please.", "I'm spicy.", "It's my spoon."],
        ["Okay! I'll make it mild for you.", "Thank you!", "I'm sorry to hear that.", "It's Thursday."],
        ["Here is your soup. Be careful, it's hot!", "Thanks! It smells good.", "It's cold outside.", "Nice to meet you."]] },
      { e: "👧", name: "물을 엎지른 친구", turns: [
        ["Oops! I spilled my water!", "Here, use this napkin.", "That's great!", "I'm thirsty."],
        ["Oh no, my shirt is wet.", "Let's ask for more napkins.", "My shirt is blue.", "Happy birthday!"],
        ["Thanks for helping me.", "No problem.", "No, I don't.", "It's a fish."]] },
      { e: "🧑‍💼", name: "계산하는 직원", turns: [
        ["Did you enjoy your meal?", "Yes, it was delicious!", "Yes, I'm a meal.", "It's Monday."],
        ["Would you like a dessert?", "No, thank you. I'm full.", "I'm a dessert.", "It's green."],
        ["Okay. Here's your bill.", "Can I pay by card?", "I like bills.", "See you yesterday!"]] },
      { e: "🧒", name: "메뉴를 못 읽는 동생", turns: [
        ["I can't read the menu. What's this?", "That's spaghetti.", "That's a menu.", "I can't swim."],
        ["Is it yummy?", "Yes, it's yummy. You'll like it.", "No, it's yellow.", "Good morning."],
        ["Okay! I want spaghetti!", "Good choice!", "I'm sorry.", "It's raining."]] },
      { e: "👨", name: "메뉴를 고르는 아빠", turns: [
        ["What do you want to eat today?", "I want a hamburger.", "I want a pencil.", "It's my birthday."],
        ["Do you want fries with it?", "Yes, please!", "No, I'm fries.", "It's a car."],
        ["What would you like to drink?", "Apple juice, please.", "I like to swim.", "It's next to the bank."]] },
      { e: "🧑‍🍳", name: "음식을 잘못 가져온 직원", turns: [
        ["Here's your fried rice.", "Excuse me, I ordered noodles.", "Wow, I'm rice!", "Good night!"],
        ["Oh, I'm so sorry! I'll bring your noodles.", "That's okay. Thank you.", "No, I'm noodles.", "It's hot today."],
        ["Here are your noodles. Enjoy!", "Thank you. It looks great!", "I'm sorry to hear that.", "See you last week."]] },
      { e: "👵", name: "옆 테이블 할머니", turns: [
        ["Excuse me, can you pass me the salt?", "Sure, here you are.", "I'm salty.", "It's a sunny day."],
        ["Thank you. You have good manners.", "Thank you very much!", "No, it's my salt.", "I'm ten o'clock."],
        ["Enjoy your food, dear.", "You too!", "Turn left.", "Happy Halloween!"]] },
      { e: "👧", name: "땅콩을 못 먹는 친구", turns: [
        ["I can't eat peanuts. I'm allergic.", "Oh, let's ask the waiter.", "Here, eat these peanuts!", "I'm nine."],
        ["Does this cake have peanuts?", "The waiter said no peanuts.", "It's a cake.", "Yes, I fell down."],
        ["Yay! Then I can eat it!", "Let's eat together!", "I'm sorry.", "It's my bag."]] },
      { e: "🤵", name: "자리가 꽉 찬 식당 직원", turns: [
        ["Sorry, all the tables are full now.", "How long do we have to wait?", "I'm full, too.", "Nice to meet you!"],
        ["About ten minutes.", "Okay, we'll wait.", "I'm ten.", "It's under the chair."],
        ["Your table is ready now!", "Great! Thank you.", "Oh no, that's too bad.", "See you yesterday!"]] }
    ] },

  hospital: { floor: "#f0fdfa", floor2: "#99f6e4", start: [3, 7],
    deco: [[0, 0, "🏥"], [1, 0, "💊"], [5, 0, "🩺"], [6, 0, "🩹"], [0, 3, "🛏️"], [6, 3, "🛏️"], [3, 4, "🪴"], [6, 7, "🧴"]],
    spots: [[3, 1], [1, 5], [5, 5]],
    pool: [
      { e: "🧑‍⚕️", name: "의사 선생님", turns: [
        ["Hello. What's wrong?", "I have a headache.", "I'm a doctor.", "It's sunny."],
        ["When did it start?", "It started yesterday.", "It's a red apple.", "Yes, please."],
        ["Take this medicine and get some rest.", "Okay. Thank you, doctor.", "I like medicine.", "Happy birthday!"]] },
      { e: "👩‍⚕️", name: "간호사", turns: [
        ["What's your name, please?", "My name is Minji.", "I'm fine.", "It's my name."],
        ["How old are you?", "I'm nine years old.", "I'm nine o'clock.", "I'm a nurse."],
        ["Please wait here. The doctor will call you.", "Okay, I'll wait.", "No, I'm a doctor.", "Turn right."]] },
      { e: "🧒", name: "주사가 무서운 아이", turns: [
        ["I don't want a shot. I'm scared.", "It's okay. It only hurts a little.", "Ha ha, you're a baby!", "I like shots."],
        ["Will you stay with me?", "Sure, I'll hold your hand.", "No, it's Monday.", "It's red."],
        ["I did it! It wasn't so bad!", "You were so brave!", "I'm sorry to hear that.", "Good morning!"]] },
      { e: "👴", name: "다리를 다친 할아버지", turns: [
        ["Oh, my leg hurts. I can't walk fast.", "Let me help you.", "Let's run!", "It's blue."],
        ["Can you open the door for me?", "Sure. Here you go.", "No, I'm a door.", "I'm hungry."],
        ["Thank you, young friend.", "You're welcome. Take care!", "Me too!", "It's a cat."]] },
      { e: "💁", name: "접수처 직원", turns: [
        ["Hello. Do you have an appointment?", "Yes, at three o'clock.", "Yes, I'm three.", "It's my dog."],
        ["Please write your name here.", "Okay. Can I borrow a pen?", "I'm a pen.", "Good night!"],
        ["Here's a pen. Please have a seat.", "Thank you.", "I'm sorry.", "It's a hospital."]] },
      { e: "👦", name: "기침하는 친구", turns: [
        ["(cough, cough) I have a cold.", "Oh no. Cover your mouth, please.", "Great! Let's share a drink.", "I'm a cold."],
        ["Sorry. Do you have a tissue?", "Yes, here you are.", "No, I'm a tissue.", "It's Saturday."],
        ["Thanks. I hope I get better soon.", "Get well soon!", "Have a nice trip!", "See you yesterday!"]] },
      { e: "🦷", name: "치과 선생님", turns: [
        ["Open your mouth, please. Say 'Ahh'.", "Ahh~", "No, I'm hungry.", "It's my nose."],
        ["Do you brush your teeth every day?", "Yes, I brush them three times a day.", "Yes, I'm a tooth.", "It's a toothbrush."],
        ["Good job! Your teeth are very healthy.", "Thank you!", "I'm sorry to hear that.", "Turn left."]] },
      { e: "🧑‍🔬", name: "약사", turns: [
        ["Here is your medicine.", "How many should I take?", "I'm medicine.", "It's purple."],
        ["Take one after each meal.", "Okay. Three times a day.", "I'm eating now.", "Nice to meet you."],
        ["That's right! Feel better soon.", "Thank you very much.", "Me too!", "It's my turn."]] },
      { e: "👧", name: "팔을 다친 친구", turns: [
        ["I broke my arm.", "Oh no! Does it hurt?", "Cool! Let's play basketball.", "I have two arms."],
        ["It hurts a little. Can you sign my cast?", "Sure! I'll draw a smile on it.", "No, it's my arm.", "It's sunny."],
        ["I love it! Thank you!", "I hope you get better soon!", "I'm sorry I'm late.", "Happy Halloween!"]] },
      { e: "👨‍⚕️", name: "열을 재는 간호사", turns: [
        ["I'll check your temperature.", "Okay.", "No, it's my temperature.", "I like ice cream."],
        ["You have a fever. How do you feel?", "I feel tired and hot.", "I feel like a fish.", "It's ten dollars."],
        ["Drink lots of water and rest.", "I will. Thank you.", "I'll run a lot.", "Good morning."]] }
    ] },

  library: { floor: "#fefce8", floor2: "#fde68a", start: [3, 7],
    deco: [[0, 0, "📚"], [1, 0, "📚"], [2, 0, "📚"], [4, 0, "📚"], [5, 0, "📚"], [6, 0, "📚"], [2, 3, "📖"], [4, 3, "🪑"], [0, 6, "🪴"], [6, 6, "💻"]],
    spots: [[3, 1], [1, 4], [5, 5]],
    pool: [
      { e: "🧑‍💼", name: "사서 선생님", turns: [
        ["Hello! Can I help you find a book?", "Yes. I'm looking for a book about dinosaurs.", "I'm a dinosaur.", "It's lunch time."],
        ["They are on the second shelf.", "Thank you! Can I borrow two books?", "It's two o'clock.", "No, it's a shelf."],
        ["Yes. Please bring them back in two weeks.", "Okay, I will.", "I'm sorry to hear that.", "Happy birthday!"]] },
      { e: "🧒", name: "떠드는 친구", turns: [
        ["Ha ha ha! This book is so funny!", "Shh! We have to be quiet here.", "Let's shout together!", "I'm a book."],
        ["Oh, sorry. I forgot.", "That's okay. Let's read quietly.", "No, it's funny.", "It's windy."],
        ["Do you want to read it with me?", "Sure, I'd like that.", "I'm reading a bus.", "I'm full."]] },
      { e: "👦", name: "책을 못 찾는 친구", turns: [
        ["I can't find a book about space.", "Let's ask the librarian.", "I'm a rocket.", "I'm hungry."],
        ["Good idea. Can you come with me?", "Sure, let's go together.", "No, I'm a librarian.", "It's yellow."],
        ["We found it! Thanks!", "Have fun reading!", "Oh, that's too bad.", "It's my turn."]] },
      { e: "👵", name: "글씨가 안 보이는 할머니", turns: [
        ["Excuse me, I can't see the small letters.", "Do you want me to read it for you?", "I can't see you.", "Turn left."],
        ["Yes, please. What does it say?", "It says 'Closed on Monday'.", "It says 'Woof'.", "Good night!"],
        ["Oh, thank you. You read very well.", "Thank you!", "Me too!", "I'm a letter."]] },
      { e: "👧", name: "책을 고르는 친구", turns: [
        ["What kind of books do you like?", "I like adventure stories.", "I like Mondays.", "I'm a book."],
        ["Me too! Have you read this one?", "No, I haven't. Is it good?", "Yes, I'm good.", "It's under the desk."],
        ["It's really exciting!", "I'll borrow it, then!", "I'm sorry.", "It's raining."]] },
      { e: "🧑‍🏫", name: "책 반납 직원", turns: [
        ["Are you returning these books?", "Yes, I am.", "No, I'm a book.", "It's cloudy."],
        ["Oh, this book is late.", "I'm sorry. I forgot.", "That's great!", "It's my dog."],
        ["That's okay. Just be on time next time.", "I will. Thank you.", "No, thank you.", "Happy New Year!"]] },
      { e: "🧒", name: "자리를 찾는 친구", turns: [
        ["Is anyone sitting here?", "No. You can sit here.", "Yes, it's a chair.", "It's ten o'clock."],
        ["Thanks! What are you reading?", "I'm reading a comic book.", "I'm eating a book.", "It's red."],
        ["Cool! Can I read it after you?", "Sure, I'm almost done.", "I'm nine.", "Good morning!"]] },
      { e: "👦", name: "컴퓨터로 책 찾는 아이", turns: [
        ["How do I search for a book on the computer?", "Type the title here.", "Turn off the light.", "I'm a computer."],
        ["Then what?", "Press 'Enter'.", "Press the dog.", "It's sunny."],
        ["Wow, I found it! Thank you!", "Good job!", "I'm sorry.", "See you yesterday."]] },
      { e: "👩‍🏫", name: "동화 읽어 주는 선생님", turns: [
        ["Story time! Do you want to listen?", "Yes! I love stories!", "No, I'm a story.", "It's my bag."],
        ["Today's story is about a brave rabbit.", "Sounds fun!", "I'm a rabbit.", "It's Wednesday."],
        ["Did you like the story?", "Yes, it was great!", "Yes, it's hot.", "Turn right."]] },
      { e: "👧", name: "주스를 든 아이", turns: [
        ["Can I drink juice here?", "No, we can't eat or drink here.", "Yes, let's have a party!", "I'm a juice."],
        ["Oh. Where can I drink it?", "You can drink it outside.", "In the bookshelf.", "It's nine o'clock."],
        ["Okay. Thanks for telling me.", "No problem!", "I'm sorry to hear that.", "It's a lemon."]] }
    ] },

  zoo: { floor: "#ecfccb", floor2: "#bef264", start: [3, 7],
    deco: [[0, 0, "🦁"], [1, 0, "🦒"], [5, 0, "🐘"], [6, 0, "🦓"], [3, 3, "🐒"], [0, 5, "🐧"], [6, 4, "🌴"], [6, 7, "🍦"]],
    spots: [[3, 1], [1, 3], [4, 5]],
    pool: [
      { e: "🧑‍🌾", name: "사육사 선생님", turns: [
        ["Welcome to the zoo! What animal do you like?", "I like elephants.", "I like Mondays.", "I'm a zoo."],
        ["Elephants eat a lot. What do they eat?", "They eat grass and fruit.", "They eat cars.", "It's three o'clock."],
        ["That's right! Do you want to feed them?", "Yes, I'd love to!", "No, I'm an elephant.", "Good night!"]] },
      { e: "🧒", name: "아빠를 잃어버린 아이", turns: [
        ["I can't find my dad...", "Don't worry. Let's go to the information center.", "Bye!", "I like lions."],
        ["He has a blue hat.", "Let's look for a man with a blue hat.", "I have a red hat.", "It's lunch time."],
        ["There he is! Daddy!", "Yay! I'm so happy for you!", "Oh no.", "It's a monkey."]] },
      { e: "👩", name: "사진을 부탁하는 언니", turns: [
        ["Excuse me, can you take a picture of us?", "Sure! Say cheese!", "No, it's my camera.", "I'm a picture."],
        ["Can you take one more, please?", "Okay. One, two, three!", "I'm three.", "It's raining."],
        ["Thank you! It looks great!", "You're welcome!", "Me too.", "Turn left."]] },
      { e: "🧒", name: "원숭이에게 과자 주려는 아이", turns: [
        ["I want to give my cookie to the monkey.", "No! We can't feed the animals.", "Good idea! Give it all!", "I'm a cookie."],
        ["Why not?", "It can make them sick.", "Because it's Tuesday.", "Yes, please."],
        ["Oh, I didn't know that. Thanks!", "Let's just watch them.", "I'm sorry to hear that.", "It's my lunch."]] },
      { e: "🧑‍💼", name: "매표소 직원", turns: [
        ["Hello! How many tickets?", "Two children, please.", "I'm two.", "It's a ticket."],
        ["That's ten dollars.", "Here you are.", "I'm ten years old.", "Good morning."],
        ["Here's a map. Have fun!", "Thank you!", "No, I'm a map.", "See you yesterday!"]] },
      { e: "👦", name: "펭귄을 좋아하는 친구", turns: [
        ["Look at the penguins! They are so cute!", "Yes! They walk so funny!", "No, I'm a penguin.", "It's my pencil."],
        ["Do you know where penguins live?", "They live in cold places.", "They live in my bag.", "I'm hot."],
        ["You know a lot about animals!", "Thanks! I love animals.", "I'm sorry.", "Happy New Year!"]] },
      { e: "👧", name: "다리가 아픈 친구", turns: [
        ["My legs are tired. I can't walk anymore.", "Let's take a rest on that bench.", "Let's run to the lions!", "I like dogs."],
        ["Good idea. Do you have some water?", "Yes, here you go.", "No, I'm water.", "It's a bench."],
        ["Thanks! Now I feel better.", "Great! Let's go see the tigers.", "Oh no!", "Good night!"]] },
      { e: "🧑‍🍳", name: "아이스크림 가게 직원", turns: [
        ["Hi! What flavor would you like?", "Chocolate, please.", "I'm a flavor.", "It's Sunday."],
        ["Cup or cone?", "A cone, please.", "A cup of tigers.", "I'm cold."],
        ["Here you go! That's two dollars.", "Here's two dollars. Thank you!", "I'm two.", "Turn right."]] },
      { e: "🧒", name: "기린을 처음 본 동생", turns: [
        ["Wow, the giraffe is so tall!", "Yes! It's taller than our house!", "No, I'm a house.", "It's green."],
        ["What does it eat?", "It eats leaves from tall trees.", "It eats pizza.", "I'm a giraffe."],
        ["I want to be tall like a giraffe!", "Then eat well and sleep well!", "I'm short.", "See you!"]] },
      { e: "👩", name: "우산이 없는 아주머니", turns: [
        ["Oh, it's starting to rain!", "Let's go inside the building.", "Let's go swimming!", "I'm sunny."],
        ["I don't have an umbrella.", "You can share my umbrella.", "I'm an umbrella.", "It's my birthday."],
        ["You are so kind. Thank you!", "No problem!", "Good night!", "It's a frog."]] }
    ] },

  home: { floor: "#fdf2f8", floor2: "#fbcfe8", start: [3, 7],
    deco: [[0, 0, "🛋️"], [1, 0, "📺"], [5, 0, "🛏️"], [6, 0, "🧸"], [3, 3, "🍽️"], [0, 5, "🚿"], [6, 5, "🪴"], [0, 7, "👟"]],
    spots: [[3, 1], [1, 3], [5, 6]],
    pool: [
      { e: "👩", name: "엄마", turns: [
        ["Good morning! Did you sleep well?", "Yes, I did. Good morning, Mom!", "No, it's morning.", "I'm a bed."],
        ["What do you want for breakfast?", "Toast and milk, please.", "I want a bus.", "It's ten dollars."],
        ["Hurry up! You'll be late for school.", "Okay, I'm coming!", "I'm sorry to hear that.", "Happy birthday!"]] },
      { e: "👨", name: "아빠", turns: [
        ["Can you help me clean the room?", "Sure, Dad! What should I do?", "No, I'm a room.", "It's windy."],
        ["Please put the toys in the box.", "Okay. All done!", "The box is a toy.", "I'm nine."],
        ["Great job! Let's have some snacks.", "Yay! Thank you, Dad!", "Oh, that's too bad.", "Turn left."]] },
      { e: "👶", name: "우는 아기 동생", turns: [
        ["Waaah! Waaah!", "Oh, what's wrong? Are you hungry?", "Be quiet!", "It's my toy."],
        ["(The baby wants the teddy bear.)", "Here's your teddy bear.", "Here's a fork.", "Good night!"],
        ["Hee hee!", "You're smiling now!", "I'm sorry.", "It's Monday."]] },
      { e: "👵", name: "할머니", turns: [
        ["Hello, sweetie! Come give me a hug!", "Hi, Grandma! I missed you!", "Bye, Grandma!", "I'm a hug."],
        ["How's school these days?", "It's fun. I have many friends.", "It's a school bus.", "I'm hungry."],
        ["I made cookies for you.", "Wow, thank you, Grandma!", "No, I'm a cookie.", "It's raining."]] },
      { e: "🧒", name: "놀러 온 친구", turns: [
        ["Hi! Thanks for inviting me.", "Welcome! Come on in.", "Go away.", "It's Monday."],
        ["Wow, your room is so nice!", "Thanks! Let's play a board game.", "It's a room.", "Happy New Year!"],
        ["I have to go home now. Bye!", "Bye! Come again!", "Nice to meet you!", "I'm a game."]] },
      { e: "🧑", name: "택배 기사님", turns: [
        ["Hello! I have a package for your family.", "Thank you! I'll take it.", "No, I'm a package.", "Good night!"],
        ["It's heavy. Can you carry it?", "Yes, I can.", "I'm heavy.", "It's purple."],
        ["Have a nice day!", "You too! Thank you!", "I'm sorry to hear that.", "It's next Tuesday."]] },
      { e: "👧", name: "숙제하는 누나", turns: [
        ["I'm doing my homework. Can you be quiet?", "Sure. Sorry!", "No, let's sing loudly!", "I'm homework."],
        ["Thanks. Can you bring me a pencil?", "Here you are.", "Here's a banana.", "It's cold."],
        ["Thanks! I'll play with you after this.", "Great! I'll wait.", "Oh, that's too bad.", "It's my nose."]] },
      { e: "🐶", name: "밥을 안 먹는 강아지", turns: [
        ["(Dad says) Our dog isn't eating his food.", "Maybe he's sick.", "Maybe he's a cat.", "It's a bone."],
        ["Should we take him to the vet?", "Yes, let's go now.", "No, it's sunny.", "I'm a vet."],
        ["The vet said he's okay now.", "That's a relief!", "That's too bad.", "See you yesterday."]] },
      { e: "👩‍🍳", name: "저녁을 준비하는 엄마", turns: [
        ["Dinner is ready! Wash your hands, please.", "Okay, Mom!", "No, my hands are dinner.", "It's Wednesday."],
        ["Can you set the table?", "Sure. I'll get the spoons.", "I'll get my bike.", "Good morning!"],
        ["How's the soup?", "It's yummy! Thank you, Mom.", "It's my spoon.", "I'm sorry I'm late."]] },
      { e: "👦", name: "게임하는 형", turns: [
        ["Do you want to play a game with me?", "Yes! Can I go first?", "No, I'm a game.", "It's my birthday."],
        ["Okay, you go first.", "Thanks! Here I go!", "Turn left.", "It's yellow."],
        ["Wow, you won! Good game!", "Good game! Let's play again.", "I'm sorry to hear that.", "Good night."]] }
    ] },

  station: { floor: "#eff6ff", floor2: "#bfdbfe", start: [3, 7],
    deco: [[0, 0, "🚆"], [1, 0, "🛤️"], [2, 0, "🛤️"], [3, 0, "🛤️"], [4, 0, "🛤️"], [5, 0, "🛤️"], [6, 0, "🚉"], [0, 3, "🎫"], [6, 3, "🕐"], [3, 4, "🧳"], [0, 7, "🪴"]],
    spots: [[3, 2], [1, 5], [5, 5]],
    pool: [
      { e: "🧑‍💼", name: "매표소 직원", turns: [
        ["Hello! Where are you going?", "One ticket to Busan, please.", "I'm going to bed.", "It's a train."],
        ["One way or round trip?", "Round trip, please.", "Round like a ball.", "Nice to meet you."],
        ["That's forty dollars.", "Here you are.", "I'm forty.", "Happy New Year!"]] },
      { e: "👴", name: "길을 묻는 할아버지", turns: [
        ["Excuse me, where is Platform 3?", "It's over there, next to the stairs.", "It's three o'clock.", "I'm a platform."],
        ["Is there an elevator?", "Yes, it's on your left.", "Yes, I'm an elevator.", "It's blue."],
        ["Thank you very much!", "You're welcome. Have a safe trip!", "Me too!", "I'm hungry."]] },
      { e: "👧", name: "기차를 놓칠까 걱정하는 아이", turns: [
        ["What time does the train leave?", "It leaves at ten thirty.", "It leaves on a tree.", "I'm ten."],
        ["Oh no! It's ten twenty-five now!", "Hurry! Let's run!", "Let's take a nap.", "I'm a clock."],
        ["We made it! Phew!", "That was close!", "I'm sorry to hear that.", "It's my ticket."]] },
      { e: "🧔", name: "자리를 착각한 승객", turns: [
        ["Excuse me, I think you're in my seat.", "Oh, really? Let me check my ticket.", "No, it's my train.", "I'm a seat."],
        ["My seat is 12A.", "Oh, I'm sorry. My seat is 13A.", "My seat is yellow.", "Good morning!"],
        ["No problem. Have a nice trip!", "You too!", "Happy birthday!", "It's raining."]] },
      { e: "🧒", name: "기차 옆자리 친구", turns: [
        ["Where are you going?", "I'm going to visit my grandma.", "I'm a grandma.", "It's a window."],
        ["Me too! Do you want some candy?", "Yes, thank you!", "No, I'm candy.", "I'm sorry."],
        ["Look! We can see the sea!", "Wow, it's so beautiful!", "It's my seat.", "Turn right."]] },
      { e: "👮", name: "역무원", turns: [
        ["Please stand behind the yellow line.", "Oh, okay. Sorry.", "I'm yellow.", "It's a line."],
        ["The train is coming. Be careful!", "Thank you. I'll be careful.", "Let's jump on the tracks!", "I'm hungry."],
        ["Good. Have a safe trip!", "Thank you!", "See you yesterday!", "It's my bag."]] },
      { e: "🧑", name: "가방을 두고 내리는 승객", turns: [
        ["Okay, this is my stop. Goodbye!", "Wait! You forgot your bag!", "Goodbye, bag!", "I like trains."],
        ["Oh my! Thank you so much!", "You're welcome!", "No, it's mine.", "It's cloudy."],
        ["You saved my day!", "I'm glad I could help.", "I'm sorry to hear that.", "It's five o'clock."]] },
      { e: "🧒", name: "표를 잃어버린 아이", turns: [
        ["I lost my ticket!", "Let's check your pockets.", "Let's buy a cake.", "Good morning!"],
        ["It's not in my pocket.", "Is it in your bag?", "Is it in the sky?", "I'm a pocket."],
        ["Yes! Here it is!", "Phew! Keep it safe.", "Oh, that's too bad.", "Nice to meet you."]] },
      { e: "🧑‍🍳", name: "간식 파는 직원", turns: [
        ["Snacks and drinks! Would you like something?", "Can I have some water, please?", "I'm a snack.", "It's Friday."],
        ["Sure. Anything else?", "A bag of chips, too, please.", "I'm a bag.", "Turn left."],
        ["That's three dollars.", "Here you are. Thank you!", "I'm three.", "Good night!"]] },
      { e: "👵", name: "짐이 무거운 할머니", turns: [
        ["Oh, this bag is too heavy for me.", "Let me carry it for you.", "Me too. Bye!", "It's a bag."],
        ["Thank you. Can you put it up there?", "Sure. Done!", "No, I'm up there.", "It's my birthday."],
        ["You're a good kid. Thank you.", "You're welcome. Have a nice trip!", "I'm sorry to hear that.", "It's ten dollars."]] }
    ] },

  // ---- 새 장소 10곳: 상황은 talk/adv/<장소>.js 에 있어요 ----
  pool: { floor: "#e0f2fe", floor2: "#7dd3fc", start: [3, 7],
    deco: [[0, 0, "🏊"], [1, 0, "🌊"], [2, 0, "🌊"], [3, 0, "🌊"], [4, 0, "🌊"], [5, 0, "🌊"], [6, 0, "⛱️"], [0, 4, "🩴"], [6, 4, "🧴"], [3, 5, "🏐"], [6, 7, "🪴"]],
    spots: [[3, 2], [1, 5], [5, 5]], pool: [] },
  camping: { floor: "#ecfccb", floor2: "#a3e635", start: [3, 7],
    deco: [[0, 0, "🌲"], [1, 0, "🌲"], [5, 0, "🌲"], [6, 0, "⛰️"], [3, 3, "🔥"], [0, 5, "⛺"], [6, 5, "⛺"], [0, 7, "🪵"]],
    spots: [[3, 1], [1, 3], [5, 6]], pool: [] },
  cinema: { floor: "#f5f3ff", floor2: "#c4b5fd", start: [3, 7],
    deco: [[0, 0, "🎬"], [1, 0, "🎞️"], [2, 0, "🎞️"], [3, 0, "🎥"], [4, 0, "🎞️"], [5, 0, "🎞️"], [6, 0, "🍿"], [1, 3, "💺"], [5, 3, "💺"], [0, 6, "🎟️"], [6, 6, "🥤"]],
    spots: [[3, 2], [1, 5], [5, 5]], pool: [] },
  salon: { floor: "#fdf4ff", floor2: "#f0abfc", start: [3, 7],
    deco: [[0, 0, "🪞"], [1, 0, "💇"], [2, 0, "🪞"], [4, 0, "🪞"], [5, 0, "💈"], [6, 0, "🪞"], [0, 3, "💺"], [6, 3, "💺"], [3, 5, "🪴"], [6, 7, "🧴"]],
    spots: [[3, 1], [1, 5], [5, 5]], pool: [] },
  bus: { floor: "#fefce8", floor2: "#fde047", start: [3, 7],
    deco: [[0, 0, "🚌"], [3, 0, "🪟"], [6, 0, "🚏"], [0, 2, "💺"], [0, 3, "💺"], [0, 4, "💺"], [6, 2, "💺"], [6, 3, "💺"], [6, 4, "💺"]],
    spots: [[2, 1], [4, 3], [2, 5]], pool: [] },
  museum: { floor: "#f5f5f4", floor2: "#d6d3d1", start: [3, 7],
    deco: [[0, 0, "🏺"], [1, 0, "🖼️"], [2, 0, "🗿"], [4, 0, "🦖"], [5, 0, "🖼️"], [6, 0, "🏺"], [3, 3, "🦕"], [0, 5, "🖼️"], [6, 5, "🗿"], [6, 7, "🪴"]],
    spots: [[3, 1], [1, 3], [5, 6]], pool: [] },
  themepark: { floor: "#fff1f2", floor2: "#fda4af", start: [3, 7],
    deco: [[0, 0, "🎡"], [1, 0, "🎢"], [5, 0, "🎠"], [6, 0, "🎪"], [3, 3, "🎈"], [0, 5, "🍭"], [6, 5, "🍦"], [0, 7, "🎟️"]],
    spots: [[3, 1], [1, 3], [5, 6]], pool: [] },
  beach: { floor: "#fef3c7", floor2: "#fcd34d", start: [3, 7],
    deco: [[0, 0, "🌊"], [1, 0, "🌊"], [2, 0, "🌊"], [3, 0, "🌊"], [4, 0, "🌊"], [5, 0, "🌊"], [6, 0, "🌊"], [0, 3, "⛱️"], [6, 3, "🌴"], [3, 4, "🏰"], [0, 6, "🐚"], [6, 7, "🦀"]],
    spots: [[3, 2], [1, 5], [5, 5]], pool: [] },
  party: { floor: "#fdf2f8", floor2: "#f9a8d4", start: [3, 7],
    deco: [[0, 0, "🎈"], [1, 0, "🎉"], [5, 0, "🎉"], [6, 0, "🎈"], [3, 3, "🎂"], [0, 5, "🎁"], [6, 5, "🎁"], [0, 7, "🪅"]],
    spots: [[3, 1], [1, 3], [5, 6]], pool: [] },
  farm: { floor: "#f7fee7", floor2: "#bef264", start: [3, 7],
    deco: [[0, 0, "🌾"], [1, 0, "🌾"], [5, 0, "🚜"], [6, 0, "🌻"], [3, 3, "🐄"], [0, 5, "🐓"], [6, 5, "🐖"], [0, 7, "🌽"], [6, 7, "🥕"]],
    spots: [[3, 1], [1, 3], [5, 6]], pool: [] }
};

// 장소 고르기 화면 (차례대로)
window.ADV_LEVELS = [
  { id: "classroom", name: "교실", emoji: "🏫", desc: "친구 · 선생님 · 숙제", bg: "#ecfccb", c: "#65a30d" },
  { id: "playground", name: "놀이터", emoji: "🛝", desc: "그네 · 술래잡기 · 강아지", bg: "#dbeafe", c: "#2563eb" },
  { id: "market", name: "마트", emoji: "🛒", desc: "물건 찾기 · 시식 · 계산", bg: "#fef3c7", c: "#d97706" },
  { id: "airport", name: "공항", emoji: "✈️", desc: "여권 · 체크인 · 기내식", bg: "#fce7f3", c: "#db2777" },
  { id: "restaurant", name: "식당", emoji: "🍽️", desc: "주문 · 음식 · 계산", bg: "#ffedd5", c: "#ea580c" },
  { id: "hospital", name: "병원", emoji: "🏥", desc: "아픈 곳 · 약 · 주사", bg: "#ccfbf1", c: "#0d9488" },
  { id: "library", name: "도서관", emoji: "📚", desc: "책 빌리기 · 조용히 · 반납", bg: "#fef9c3", c: "#ca8a04" },
  { id: "zoo", name: "동물원", emoji: "🦁", desc: "동물 · 사진 · 길 잃은 아이", bg: "#dcfce7", c: "#16a34a" },
  { id: "home", name: "우리 집", emoji: "🏠", desc: "가족 · 손님 · 집안일", bg: "#fae8ff", c: "#c026d3" },
  { id: "station", name: "기차역", emoji: "🚉", desc: "표 사기 · 자리 · 안전", bg: "#e0e7ff", c: "#4f46e5" },
  { id: "pool", name: "수영장", emoji: "🏊", desc: "안전 · 수영 · 물놀이", bg: "#e0f2fe", c: "#0284c7" },
  { id: "camping", name: "캠핑장", emoji: "⛺", desc: "텐트 · 모닥불 · 별 보기", bg: "#ecfccb", c: "#4d7c0f" },
  { id: "cinema", name: "영화관", emoji: "🎬", desc: "표 사기 · 팝콘 · 자리", bg: "#ede9fe", c: "#7c3aed" },
  { id: "salon", name: "미용실", emoji: "💇", desc: "머리 자르기 · 기다리기", bg: "#fae8ff", c: "#a21caf" },
  { id: "bus", name: "버스", emoji: "🚌", desc: "타고 내리기 · 자리 양보", bg: "#fef9c3", c: "#a16207" },
  { id: "museum", name: "박물관", emoji: "🏛️", desc: "공룡 · 그림 · 관람 예절", bg: "#f5f5f4", c: "#57534e" },
  { id: "themepark", name: "놀이공원", emoji: "🎡", desc: "놀이기구 · 줄 서기 · 길 찾기", bg: "#ffe4e6", c: "#e11d48" },
  { id: "beach", name: "해변", emoji: "🏖️", desc: "모래성 · 바다 · 햇볕", bg: "#fef3c7", c: "#b45309" },
  { id: "party", name: "생일 파티", emoji: "🎂", desc: "초대 · 선물 · 축하", bg: "#fce7f3", c: "#be185d" },
  { id: "farm", name: "농장", emoji: "🚜", desc: "동물 돌보기 · 수확", bg: "#f7fee7", c: "#65a30d" }
];

// 상황 더하기: 한 줄 = "그림|이름|상대 말1|맞는 대답1|틀린1|틀린1|상대 말2|맞는2|틀린2|틀린2|상대 말3|맞는3|틀린3|틀린3"
window.advAdd = function (id, lines) {
  var A = window.ADV_AREAS[id];
  lines.forEach(function (s) {
    var f = s.split("|");
    A.pool.push({ e: f[0], name: f[1], turns: [f.slice(2, 6), f.slice(6, 10), f.slice(10, 14)] });
  });
};
