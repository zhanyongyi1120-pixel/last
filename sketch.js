let bgImg;
let spriteRight;
let spriteLeft;
let currentSprite;
const FRAME_COUNT = 4;
const ANIM_SPEED = 6; // frames per animation step
let posX;
let posY;
let speed = 4; // pixels per frame
let scaleX = 1; // 1 = normal direction, -1 = flipped



// 貓相關變數
let catSprite;
const CAT_FRAME_COUNT = 6; // all_貓.png 有 6 幀
const CAT_ANIM_SPEED = 5; // frames per animation step for cat
let catX, catY;
let catSpeedX, catSpeedY;
let catScaleX = 1;
let isCatActive = false; // 控制貓是否在主畫面活動

// 狗相關變數
let dogSprite;
const DOG_FRAME_COUNT = 6;
const DOG_ANIM_SPEED = 5;
let dogX, dogY;
let dogSpeedX, dogSpeedY;
let dogScaleX = 1;
let isDogActive = true; // 控制狗是否在主畫面活動

// 鑰匙相關變數
let keySprite;
const KEY_FRAME_COUNT = 3;
const KEY_ANIM_SPEED = 8;
let keyX, keyY;
let isKeyActive = false; // 控制鑰匙是否在主畫面活動


// 遊戲狀態
let currentScreen = 'main'; // 'main' 或 'courtyard' 或 'quiz'
let courtyardBg;
let forestBg;
let homeBg;
let homeSound;
let courtyardSound;
// 已使用過的不重複題目列表（儲存 question 文字）
let usedQuestions = [];
let courtyardSoundActive = false;
let showAudioPermissionButton = false;
const audioBtnW = 220;
const audioBtnH = 48;
// 猴子精靈
let monkeySprite;
const MONKEY_FRAME_COUNT = 12;
const MONKEY_ANIM_SPEED = 6;
let isHome = false; // 當切換到家背景時為 true，可顯示家中特殊物件
let collisionCooldown = 0; // 碰撞冷卻時間，防止重複觸發

// Q&A UI
let cnv; // 全域 canvas 變數
let quizInput = null;
let quizNextButton = null;
let currentNPC = null; // 'dog' | 'cat' | 'key'
let lastAnswerWrong = false;
let currentHint = '';

// 題目系統
let mathQuizzes = []; // 數學題庫
let commonKnowledgeQuizzes = []; // 生活常識題庫
let safetyQuizzes = []; // 安全題庫
let quizData = [];
let currentQuiz = 0;
let correctAnswer = 0;
let answers = [];
const BUTTON_WIDTH = 120;
const BUTTON_HEIGHT = 50;
const BUTTON_GAP = 20;

function preload() {
  spriteRight = loadImage('人右/all_人右.png');
  spriteLeft = loadImage('人左/all_人左.png');
  forestBg = loadImage('森林.jpg');
  courtyardBg = forestBg;
  homeBg = loadImage('家.png');
  // 載入家背景音效（放在專案根目錄或相對路徑）
  soundFormats('wav', 'mp3');
  try {
    homeSound = loadSound('5082.wav');
  } catch (e) {
    // 若載入失敗，忽略以免中斷程式
    console.warn('home sound load failed', e);
  }
  try {
    courtyardSound = loadSound('11303.wav');
  } catch (e) {
    console.warn('courtyard sound load failed', e);
  }
  // 載入猴子精靈（精靈圖檔包含 12 張橫向幀）
  monkeySprite = loadImage('猴子/猴子_all.png');
  catSprite = loadImage('貓/all_貓.png');
  dogSprite = loadImage('狗/all_狗.png');
  keySprite = loadImage('鑰匙/all_鑰匙.png');
  
  // 初始化題目庫
  initializeQuizzes();
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  // 允許 canvas 獲取鍵盤焦點，避免方向鍵無法作用
  cnv.elt.tabIndex = 0;
  cnv.elt.style.outline = 'none';
  // 點擊 canvas 時自動取得焦點
  cnv.elt.addEventListener('click', () => cnv.elt.focus());
  // 初始讓 canvas 取得焦點
  cnv.elt.focus();
  imageMode(CENTER);
  noSmooth();
  currentSprite = spriteRight; // 預設朝右
  posX = width / 2;
  posY = height * 0.6; // 放在畫面偏下的「地面」位置

  // 初始化狗的位置和速度
  dogX = random(width);
  dogY = random(height);
  dogSpeedX = random(-1, 1); // 降低最大速度
  dogSpeedY = random(-1, 1); // 降低最大速度

}

function draw() {
  if (currentScreen === 'main') {
    drawMainScreen();
  } else if (currentScreen === 'quiz') {
    drawQuizScreen();
  } else if (currentScreen === 'courtyard') {
    drawCourtyardScreen();
  }
  // 管理森林背景的循環音效（11303.wav）：只要目前的背景是 forestBg 就循環播放
  if (courtyardSound) {
    try {
      if (courtyardBg === forestBg) {
        if (!courtyardSoundActive) {
          // 嘗試先恢復 audio context（若尚未）
          if (typeof getAudioContext === 'function') {
            try { if (getAudioContext().state !== 'running') getAudioContext().resume(); } catch (e) {}
          }
          // 啟動循環播放（使用 loop() 或 setLoop + play())
          if (typeof courtyardSound.setLoop === 'function') courtyardSound.setLoop(true);
          if (typeof courtyardSound.loop === 'function') courtyardSound.loop();
          else if (typeof courtyardSound.play === 'function') courtyardSound.play();
          // 檢查是否成功開始播放；若成功就設 flag，否則顯示允許聲音按鈕
          try {
            const isPlaying = (typeof courtyardSound.isPlaying === 'function') ? courtyardSound.isPlaying() : false;
            if (isPlaying) {
              courtyardSoundActive = true;
              showAudioPermissionButton = false;
            } else {
              // 可能被瀏覽器阻擋，自動要求使用者允許
              courtyardSoundActive = false;
              showAudioPermissionButton = true;
            }
          } catch (e) {
            courtyardSoundActive = false;
            showAudioPermissionButton = true;
          }
        }
      } else {
        if (courtyardSoundActive) {
          if (typeof courtyardSound.stop === 'function') courtyardSound.stop();
          courtyardSoundActive = false;
        }
      }
    } catch (e) {
      // 忽略播放控制錯誤（例如自動播放限制）
      showAudioPermissionButton = true;
    }
  }

  // 若需要，繪製允許聲音的按鈕（置中下方，或覆蓋在畫面上）
  if (showAudioPermissionButton) {
    push();
    rectMode(CENTER);
    fill(255, 230);
    stroke(0);
    strokeWeight(2);
    const bx = width / 2;
    const by = height - 80;
    rect(bx, by, audioBtnW, audioBtnH, 8);
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('允許播放聲音', bx, by);
    pop();
  }
}

function drawMainScreen() {
  // Handle continuous key press for movement (左右/上下)
  let moving = false;
  // 左右移動（維持原本行為：水平直立）
  if (keyIsDown(RIGHT_ARROW)) {
    posX += speed;
    currentSprite = spriteRight;
    scaleX = 1;
    moving = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    posX -= speed;
    currentSprite = spriteLeft;
    scaleX = 1;
    moving = true;
  }
  // 上下移動（同時設定翻轉與使用的精靈）
  if (keyIsDown(UP_ARROW)) {
    posY -= speed;
    currentSprite = spriteRight; // 上使用人右
    scaleX = -1; // 向左翻轉
    moving = true;
  }
  if (keyIsDown(DOWN_ARROW)) {
    posY += speed;
    currentSprite = spriteLeft; // 下使用人左
    scaleX = 1; // 向右維持原向
    moving = true;
  }

  // Draw background stretched to cover the entire canvas
  if (courtyardBg) {
    image(courtyardBg, width / 2, height / 2, width, height);
    // 若為家場景，在角落繪製猴子精靈
    if (isHome && monkeySprite) {
      const sw = monkeySprite.width / MONKEY_FRAME_COUNT;
      const sh = monkeySprite.height;
      const frameIndex = floor(frameCount / MONKEY_ANIM_SPEED) % MONKEY_FRAME_COUNT;
      const sx = frameIndex * sw;

      const desiredHeight = min(width, height) * 0.12; // 以視窗大小決定猴子顯示高度
      const displayScale = desiredHeight / sh;
      const dw = sw * displayScale;
      const dh = sh * displayScale;

      const padding = 20;
      const monkeyX = width - dw / 2 - padding; // 右下角
      const monkeyY = height - dh / 2 - padding;

      push();
      translate(monkeyX, monkeyY);
      image(monkeySprite, 0, 0, dw, dh, sx, 0, sw, sh);
      pop();
      // 在猴子的左上角顯示白底黑字對話框
      {
        const bubbleW = min(300, width * 0.35);
        const bubbleH = 60;
        // 計算猴子左上角座標（以畫面座標為準）
        const monkeyTopLeftX = monkeyX - dw / 2;
        const monkeyTopLeftY = monkeyY - dh / 2;
        // 將對話框放在猴子左上方（偏左偏上）
        const bubbleX = monkeyTopLeftX - bubbleW - 12; // 對話框右下與猴子左上有小間距
        const bubbleY = monkeyTopLeftY - bubbleH - 8;

        push();
        rectMode(CORNER);
        noStroke();
        fill(255);
        // 若超出畫面邊界，調整位置
        const bx = max(8, bubbleX);
        const by = max(8, bubbleY);
        rect(bx, by, bubbleW, bubbleH, 10);
        fill(0);
        textSize(20);
        textAlign(LEFT, TOP);
        text('歡迎你回家!', bx + 12, by + 12);
        pop();
      }
    }
  } else {
    background(220);
  }

  // 根據狀態繪製狗或貓
  if (isDogActive) {
    drawAndUpdateDog();
  } else if (isCatActive) {
    drawAndUpdateCat();
  } else if (isKeyActive) {
    drawAndUpdateKey();
  }

  if (currentSprite) {
    const sw = currentSprite.width / FRAME_COUNT;
    const sh = currentSprite.height;

    const frameIndex = moving ? (floor(frameCount / ANIM_SPEED) % FRAME_COUNT) : 0;
    const sx = frameIndex * sw;

    // scale sprite so它在不同視窗大小下看起來合理
    const maxSpriteHeight = min(width, height) * 0.25; // 25% of smaller dimension
    const displayScale = maxSpriteHeight / sh;
    const dw = sw * displayScale;
    const dh = sh * displayScale;

    // clamp posX/posY so sprite 不會跑出畫面邊界（以顯示寬高為準）
    const halfW = dw / 2;
    const halfH = dh / 2;
    posX = constrain(posX, halfW, width - halfW);
    posY = constrain(posY, halfH, height - halfH);

    // 以水平翻轉方式繪製精靈：translate 到 pos，scale(scaleX, 1)，再在 0,0 繪製
    push();
    translate(posX, posY);
    scale(scaleX, 1);
    image(currentSprite, 0, 0, dw, dh, sx, 0, sw, sh);
    pop();

    // 碰撞偵測與問答觸發
    if (collisionCooldown > 0) {
      collisionCooldown--; // 冷卻計時
    }

    // 根據當前活動的角色進行碰撞偵測
    if (isDogActive && dogSprite) {
      const dog_sw = dogSprite.width / DOG_FRAME_COUNT;
      const dog_sh = dogSprite.height;
      const dog_maxSpriteHeight = min(width, height) * 0.1;
      const dog_displayScale = dog_maxSpriteHeight / dog_sh;
      const dog_dw = dog_sw * dog_displayScale;
      const collisionDistance = (dw / 2) + (dog_dw / 2);

      if (dist(posX, posY, dogX, dogY) < collisionDistance && collisionCooldown === 0) {
        currentNPC = 'dog';
        quizData = selectTwoQuizzes(mathQuizzes, 2); // 狗觸發兩題
        console.log('選到的題目 (dog):', quizData.map(q => q.id || q.question));
        currentQuiz = 0;
        answers = [];
        lastAnswerWrong = false;
        currentHint = '';
        currentScreen = 'quiz';
      }
    } else if (isCatActive && catSprite) {
      const cat_sw = catSprite.width / CAT_FRAME_COUNT;
      const cat_sh = catSprite.height;
      const cat_maxSpriteHeight = min(width, height) * 0.1;
      const cat_displayScale = cat_maxSpriteHeight / cat_sh;
      const cat_dw = cat_sw * cat_displayScale;
      const collisionDistance = (dw / 2) + (cat_dw / 2);

      if (dist(posX, posY, catX, catY) < collisionDistance && collisionCooldown === 0) {
        currentNPC = 'cat';
        quizData = selectTwoQuizzes(commonKnowledgeQuizzes, 2); // 貓觸發兩題
        console.log('選到的題目 (cat):', quizData.map(q => q.id || q.question));
        currentQuiz = 0;
        answers = [];
        lastAnswerWrong = false;
        currentHint = '';
        currentScreen = 'quiz';
      }
    } else if (isKeyActive && keySprite) {
      // 與鑰匙的碰撞偵測
      const key_sw = keySprite.width / KEY_FRAME_COUNT;
      const key_sh = keySprite.height;
      const key_maxSpriteHeight = min(width, height) * 0.08; // 鑰匙小一點
      const key_displayScale = key_maxSpriteHeight / key_sh;
      const key_dw = key_sw * key_displayScale;
      const collisionDistance = (dw / 2) + (key_dw / 2);

      if (dist(posX, posY, keyX, keyY) < collisionDistance && collisionCooldown === 0) {
        // 碰到鑰匙，觸發安全問答
        currentNPC = 'key';
        quizData = selectTwoQuizzes(safetyQuizzes, 1); // 鑰匙觸發一題
        console.log('選到的題目 (key):', quizData.map(q => q.id || q.question));
        currentQuiz = 0;
        answers = [];
        lastAnswerWrong = false;
        currentHint = '';
        currentScreen = 'quiz';
        // 鑰匙暫時不會消失，答對問題後才會消失
      }
    }
  }


}

function drawAndUpdateDog() {
  if (!dogSprite || !isDogActive) return;

  // 根據速度更新位置
  dogX += dogSpeedX;
  dogY += dogSpeedY;

  const sw = dogSprite.width / DOG_FRAME_COUNT; // 253 / 6
  const sh = dogSprite.height; // 34

  // 縮放精靈使其在不同視窗大小下看起來合理
  const maxSpriteHeight = min(width, height) * 0.1; // 10% of smaller dimension
  const displayScale = maxSpriteHeight / sh;
  const dw = sw * displayScale;
  const dh = sh * displayScale;

  // 碰撞迴避：檢查與玩家的距離
  const avoidanceDistance = (dw + dh) / 2 + 50; // 設定一個安全距離
  const distanceToPlayer = dist(dogX, dogY, posX, posY);

  // 檢查狗是否正在朝玩家移動
  // 向量：從狗到玩家
  const vectorToPlayerX = posX - dogX;
  const vectorToPlayerY = posY - dogY;
  // 點積：判斷狗的速度向量和到玩家的向量是否同向
  const dotProduct = dogSpeedX * vectorToPlayerX + dogSpeedY * vectorToPlayerY;

  // 只有當狗靠近玩家，並且是朝著玩家移動時，才觸發迴避
  if (distanceToPlayer < avoidanceDistance && dotProduct > 0) {
    // 計算從玩家到狗的推開向量
    const pushVectorX = dogX - posX;
    const pushVectorY = dogY - posY;
    const magnitude = dist(0, 0, pushVectorX, pushVectorY);
    // 施加一個小的反向推力，讓狗轉向
    dogSpeedX += (pushVectorX / magnitude) * 0.5;
    dogSpeedY += (pushVectorY / magnitude) * 0.5;
  }

  // 邊界碰撞檢測
  const halfW = dw / 2;
  const halfH = dh / 2;
  if (dogX < halfW || dogX > width - halfW) {
    dogSpeedX *= -1; // 反轉水平速度
    dogScaleX *= -1; // 翻轉圖片
  }
  if (dogY < halfH || dogY > height - halfH) {
    dogSpeedY *= -1; // 反轉垂直速度
  }
  dogX = constrain(dogX, halfW, width - halfW);
  dogY = constrain(dogY, halfH, height - halfH);

  // 限制狗的最大速度，避免被推得太快
  dogSpeedX = constrain(dogSpeedX, -1.5, 1.5);
  dogSpeedY = constrain(dogSpeedY, -1.5, 1.5);

  // 計算動畫幀
  const frameIndex = floor(frameCount / DOG_ANIM_SPEED) % DOG_FRAME_COUNT;
  const sx = frameIndex * sw;

  // 繪製狗
  push();
  translate(dogX, dogY);
  scale(dogScaleX, 1);
  image(dogSprite, 0, 0, dw, dh, sx, 0, sw, sh);
  pop();
}

function drawAndUpdateCat() {
  if (!catSprite || !isCatActive) return;

  // 根據速度更新位置
  catX += catSpeedX;
  catY += catSpeedY;

  const sw = catSprite.width / CAT_FRAME_COUNT; // 241 / 6
  const sh = catSprite.height; // 36

  // 縮放精靈使其在不同視窗大小下看起來合理
  const maxSpriteHeight = min(width, height) * 0.1; // 10% of smaller dimension
  const displayScale = maxSpriteHeight / sh;
  const dw = sw * displayScale;
  const dh = sh * displayScale;

  // 碰撞迴避：檢查與玩家的距離
  const avoidanceDistance = (dw + dh) / 2 + 50; // 設定一個安全距離
  const distanceToPlayer = dist(catX, catY, posX, posY);

  // 檢查貓是否正在朝玩家移動
  const vectorToPlayerX = posX - catX;
  const vectorToPlayerY = posY - catY;
  const dotProduct = catSpeedX * vectorToPlayerX + catSpeedY * vectorToPlayerY;

  // 只有當貓靠近玩家，並且是朝著玩家移動時，才觸發迴避
  if (distanceToPlayer < avoidanceDistance && dotProduct > 0) {
    const pushVectorX = catX - posX;
    const pushVectorY = catY - posY;
    const magnitude = dist(0, 0, pushVectorX, pushVectorY);
    catSpeedX += (pushVectorX / magnitude) * 0.5;
    catSpeedY += (pushVectorY / magnitude) * 0.5;
  }

  // 邊界碰撞檢測
  const halfW = dw / 2;
  const halfH = dh / 2;
  if (catX < halfW || catX > width - halfW) {
    catSpeedX *= -1; // 反轉水平速度
    catScaleX *= -1; // 翻轉圖片
  }
  if (catY < halfH || catY > height - halfH) {
    catSpeedY *= -1; // 反轉垂直速度
  }
  catX = constrain(catX, halfW, width - halfW);
  catY = constrain(catY, halfH, height - halfH);

  // 限制貓的最大速度
  catSpeedX = constrain(catSpeedX, -1.5, 1.5);
  catSpeedY = constrain(catSpeedY, -1.5, 1.5);

  // 計算動畫幀
  const frameIndex = floor(frameCount / CAT_ANIM_SPEED) % CAT_FRAME_COUNT;
  const sx = frameIndex * sw;

  // 繪製貓
  push();
  translate(catX, catY);
  scale(catScaleX, 1);
  image(catSprite, 0, 0, dw, dh, sx, 0, sw, sh);
  pop();
}

function drawAndUpdateKey() {
  if (!keySprite || !isKeyActive) return;

  const sw = keySprite.width / KEY_FRAME_COUNT; // 94 / 3
  const sh = keySprite.height; // 14

  // 縮放精靈
  const maxSpriteHeight = min(width, height) * 0.08; // 鑰匙顯示得小一點
  const displayScale = maxSpriteHeight / sh;
  const dw = sw * displayScale;
  const dh = sh * displayScale;

  // 計算動畫幀
  const frameIndex = floor(frameCount / KEY_ANIM_SPEED) % KEY_FRAME_COUNT;
  const sx = frameIndex * sw;

  // 繪製鑰匙 (原地播放動畫)
  push();
  translate(keyX, keyY);
  image(keySprite, 0, 0, dw, dh, sx, 0, sw, sh);
  pop();

  // 可以在這裡加上一點上下浮動的效果
  keyY += sin(frameCount * 0.05) * 0.2;

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    currentSprite = spriteRight;
    scaleX = 1;
  } else if (keyCode === LEFT_ARROW) {
    currentSprite = spriteLeft;
    scaleX = 1;
  }
  // 上／下鍵切換翻轉及精靈
  if (keyCode === UP_ARROW) {
    scaleX = -1; // 向左翻轉
    currentSprite = spriteRight; // 使用人右精靈
  } else if (keyCode === DOWN_ARROW) {
    scaleX = 1; // 向右維持原向（使用人左會自然看起來向右）
    currentSprite = spriteLeft; // 使用人左精靈
  }
}

// 題目系統函式
function initializeQuizzes() {
  // ADDIE 模型相關題庫（6 題）
  // 問答題格式：出五題，對應 ADDIE 各字母代表的意思（中文答案）
  mathQuizzes = [
    { id: 'A', question: '在 ADDIE 中，字母 A 代表什麼？', answer: '分析', hint: 'A 為分析（Analysis），用來識別學習需求與目標。' },
    { id: 'D1', question: '在 ADDIE 中，第一個 D（Design）代表什麼？', answer: '設計', hint: 'Design 階段用來規劃教學目標、策略與評量。' },
    { id: 'D2', question: '在 ADDIE 中，第二個 D（Development）代表什麼？', answer: '發展', hint: 'Development 階段負責製作教材與教學資源。' },
    { id: 'I', question: '在 ADDIE 中，字母 I 代表什麼？', answer: '實施', hint: 'I 為 Implementation，指課程部署與執行。' },
    { id: 'E', question: '在 ADDIE 中，字母 E 代表什麼？', answer: '評鑑', hint: 'E 為 Evaluation，包含形成性與總結性評估。' }
  ];
  // 將貓與鑰匙的題庫也改為 ADDIE 問答題（複製 mathQuizzes，包含 id）
  commonKnowledgeQuizzes = mathQuizzes.map(q => ({ id: q.id, question: q.question, answer: q.answer, hint: q.hint }));
  safetyQuizzes = mathQuizzes.map(q => ({ id: q.id, question: q.question, answer: q.answer, hint: q.hint }));
}

function selectTwoQuizzes(quizPool, count = 2) {
  // 隨機選擇 count 題，且避免與 previously used questions 重複
  const available = quizPool.filter(q => !usedQuestions.includes(q.question));
  let pick = [];
  // 如果可用題目不足，則從原池取（避免無法選題）
  const source = (available.length >= count) ? available : quizPool;
  let attempts = 0;
  while (pick.length < count && pick.length < source.length && attempts < 200) {
    attempts++;
    const idx = floor(random(source.length));
    // 深複製題目物件以避免引用錯誤
    const q = JSON.parse(JSON.stringify(source[idx]));
    // 如果已被加入（以 id 或 question 判斷）跳過
    const exists = pick.some(p => (p.id && q.id && p.id === q.id) || p.question === q.question);
    if (!exists) pick.push(q);
  }
  // 標記為已使用，避免未來重複
  for (let q of pick) {
    if (!usedQuestions.includes(q.question)) usedQuestions.push(q.question);
  }
  return pick;
}



function drawQuizScreen() {
  if (courtyardBg) {
    image(courtyardBg, width / 2, height / 2, width, height);
    noStroke();
    fill(0, 140); // 半透明遮罩增加文字可讀性
    rect(0, 0, width, height);
  } else {
    background(50); // 暗色背景備用
  }
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  
  if (currentQuiz < quizData.length) {
    // 問答題模式：在 NPC 旁顯示問題對話框，玩家旁顯示輸入框與「下一題」按鍵
    let quiz = quizData[currentQuiz];
    
    // 除錯：打印當前題目的完整信息
    if (!quiz._debugPrinted) {
      console.log('=== 第 ' + (currentQuiz + 1) + ' 題 ===');
      console.log('完整題目物件:', quiz);
      console.log('題目ID:', quiz.id);
      console.log('題目:', quiz.question);
      console.log('答案:', quiz.answer);
      quiz._debugPrinted = true;
    }
    
    rectMode(CORNER);
    textAlign(LEFT, TOP);

    // 繪製 NPC 與場景基礎（讓玩家與 NPC 仍可見）
    if (isDogActive) drawAndUpdateDog();
    if (isCatActive) drawAndUpdateCat();
    if (isKeyActive) drawAndUpdateKey();
    // 繪製玩家（靜態或簡單動畫）
    if (currentSprite) {
      const sw = currentSprite.width / FRAME_COUNT;
      const sh = currentSprite.height;
      const frameIndex = 0;
      const sx = frameIndex * sw;
      const maxSpriteHeight = min(width, height) * 0.25;
      const displayScale = maxSpriteHeight / sh;
      const dw = sw * displayScale;
      const dh = sh * displayScale;
      push();
      translate(posX, posY);
      scale(scaleX, 1);
      image(currentSprite, 0, 0, dw, dh, sx, 0, sw, sh);
      pop();
    }

    // 取得當前 NPC 座標
    let npcX = width / 2;
    let npcY = height / 2;
    if (currentNPC === 'dog') {
      npcX = dogX; npcY = dogY;
    } else if (currentNPC === 'cat') {
      npcX = catX; npcY = catY;
    } else if (currentNPC === 'key') {
      npcX = keyX; npcY = keyY;
    }

    // 對話框位置（NPC 右上方）
    const bubbleW = min(340, width * 0.35);
    const bubbleH = 80;
    const bubbleX = constrain(npcX + 40, 8, width - bubbleW - 8);
    const bubbleY = constrain(npcY - bubbleH - 20, 8, height - bubbleH - 8);
    push();
    rectMode(CORNER);
    fill(255);
    stroke(0);
    rect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    noStroke();
    fill(0);
    textSize(18);
    textAlign(LEFT, TOP);
    // 自動換行顯示問題
    text(quiz.question, bubbleX + 10, bubbleY + 10, bubbleW - 20, bubbleH - 20);
    pop();

    // 若顯示 hint（答錯時），在 NPC 下方顯示提示
    if (lastAnswerWrong && currentHint) {
      const hintW = min(300, width * 0.28);
      const hintH = 56;
      const hx = constrain(npcX + 40, 8, width - hintW - 8);
      const hy = constrain(npcY + 20, 8, height - hintH - 8);
      push();
      fill(255, 250);
      stroke(0);
      rect(hx, hy, hintW, hintH, 6);
      noStroke();
      fill(0);
      textSize(16);
      textAlign(LEFT, TOP);
      text('提示：' + (currentHint || ''), hx + 8, hy + 8, hintW - 16, hintH - 16);
      pop();
    }

    // 建立輸入框與下一題按鈕（如果尚未建立）
    if (!quizInput) {
      // 取得 canvas 在頁面的絕對位置以便放置 DOM 元素
      let rect = cnv.elt.getBoundingClientRect();
      quizInput = createInput('');
      quizInput.size(200, 28);
      quizInput.attribute('placeholder', '在此輸入答案');
      // 將輸入框放在玩家旁邊（右側）
      let ix = rect.left + posX + 40;
      let iy = rect.top + posY - 20;
      // 若超出畫面，調整位置
      if (ix + 220 > window.innerWidth) ix = rect.left + posX - 240;
      quizInput.position(ix, iy);

      quizNextButton = createButton('下一題');
      quizNextButton.size(100, 28);
      quizNextButton.position(ix + 210, iy);
      quizNextButton.mousePressed(() => {
        const userAns = quizInput.value().trim();
        // 只保留中文字符
        const normalize = s => s.replace(/[^\u4e00-\u9fff]/g, '');
        const userInput = normalize(userAns);
        const correctAns = normalize(quiz.answer || '');
        
        console.log('題目ID:', quiz.id);
        console.log('用戶答案:', userAns);
        console.log('規範化用戶答案:', userInput);
        console.log('正確答案:', quiz.answer);
        console.log('規範化正確答案:', correctAns);
        console.log('是否正確:', userInput === correctAns);
        
        const ok = (userInput === correctAns);
        
        if (ok) {
          // 答對
          console.log('答對！');
          lastAnswerWrong = false;
          currentHint = '';
          currentQuiz++;
          
          // 立即清除輸入框與按鈕（無論是否還有下一題）
          try { quizInput.remove(); } catch (e) {}
          try { quizNextButton.remove(); } catch (e) {}
          quizInput = null; 
          quizNextButton = null;
          
          if (currentQuiz >= quizData.length) {
            // 完成此次 NPC 的題目
            if (currentNPC === 'dog') {
              isDogActive = false;
              isCatActive = true;
              catX = random(width);
              catY = random(height);
              catSpeedX = random(-1, 1);
              catSpeedY = random(-1, 1);
            } else if (currentNPC === 'cat') {
              isCatActive = false;
              isKeyActive = true;
              keyX = random(width * 0.2, width * 0.8);
              keyY = random(height * 0.2, height * 0.8);
            } else if (currentNPC === 'key') {
              isKeyActive = false;
              if (homeBg) { courtyardBg = homeBg; isHome = true; }
              if (homeSound && typeof homeSound.play === 'function') {
                try { homeSound.play(); } catch (e) {}
              }
            }
            currentScreen = 'main';
            collisionCooldown = 120;
            currentNPC = null;
          }
        } else {
          // 答錯
          console.log('答錯！題目ID:', quiz.id);
          lastAnswerWrong = true;
          
          // 根據當前問題的ID給予對應的提示
          if (quiz.id === 'A') {
            currentHint = '【分析 Analysis】';
          } else if (quiz.id === 'D1') {
            currentHint = '【設計 design】';
          } else if (quiz.id === 'D2') {
            currentHint = '【發展 Development】';
          } else if (quiz.id === 'I') {
            currentHint = '【實施 implementation】';
          } else if (quiz.id === 'E') {
            currentHint = '【評鑑 evaluation】';
          } else {
            currentHint = '再想想看，可以試著回答關鍵字。';
          }
        }
      });
    }
  } else {
    // 所有題目完成
    textAlign(CENTER, CENTER);
    text('恭喜！進入庭院', width / 2, height / 2);
    fill(200);
    rect(width / 2, height * 0.75, 150, 50);
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text('進入庭院', width / 2, height * 0.75);
  }
}

function drawCourtyardScreen() {
  // 繪製庭院背景
  if (courtyardBg) {
    image(courtyardBg, width / 2, height / 2, width, height);
  } else {
    background(100, 200, 100); // 綠色背景作為備用
  }
  
  // 貓的移動邏輯（類似人物）
  let catMoving = false;
  let catScaleX = 1; // 貓的朝向
  
  if (keyIsDown(RIGHT_ARROW)) {
    catX += speed;
    catScaleX = 1;
    catMoving = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    catX -= speed;
    catScaleX = -1;
    catMoving = true;
  }
  if (keyIsDown(UP_ARROW)) {
    catY -= speed;
    catMoving = true;
  }
  if (keyIsDown(DOWN_ARROW)) {
    catY += speed;
    catMoving = true;
  }
  
  // 繪製貓動畫
  if (catSprite) {
    const catSw = catSprite.width / CAT_FRAME_COUNT;
    const catSh = catSprite.height;
    
    const catFrameIndex = catMoving ? (floor(frameCount / CAT_ANIM_SPEED) % CAT_FRAME_COUNT) : 0;
    const catSx = catFrameIndex * catSw;
    
    // 貓的縮放（適合庭院）
    const catMaxHeight = min(width, height) * 0.2;
    const catDisplayScale = catMaxHeight / catSh;
    const catDw = catSw * catDisplayScale;
    const catDh = catSh * catDisplayScale;
    
    // 限制貓的位置在畫面內
    const catHalfW = catDw / 2;
    const catHalfH = catDh / 2;
    catX = constrain(catX, catHalfW, width - catHalfW);
    catY = constrain(catY, catHalfH, height - catHalfH);
    
    // 繪製貓（支持水平翻轉）
    push();
    translate(catX, catY);
    scale(catScaleX, 1);
    image(catSprite, 0, 0, catDw, catDh, catSx, 0, catSw, catSh);
    pop();
  }
  
  // 返回按鈕
  fill(200);
  rect(width - 60, 30, 100, 50);
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text('返回', width - 10, 55);
}

function mousePressed() {
  // 嘗試解除瀏覽器自動播放限制：恢復 audio context
  if (typeof getAudioContext === 'function') {
    try { getAudioContext().resume(); } catch (e) {}
  } else if (typeof userStartAudio === 'function') {
    try { userStartAudio(); } catch (e) {}
  }
  // 若顯示允許聲音按鈕且使用者點擊按鈕區域，則嘗試啟動音效
  if (showAudioPermissionButton) {
    const bx = width / 2 - audioBtnW / 2;
    const by = height - 80 - audioBtnH / 2;
    if (mouseX > bx && mouseX < bx + audioBtnW && mouseY > by && mouseY < by + audioBtnH) {
      try {
        if (typeof getAudioContext === 'function') getAudioContext().resume();
      } catch (e) {}
      try {
        if (courtyardSound) {
          if (typeof courtyardSound.setLoop === 'function') courtyardSound.setLoop(true);
          if (typeof courtyardSound.loop === 'function') courtyardSound.loop();
          else if (typeof courtyardSound.play === 'function') courtyardSound.play();
          // 檢查是否成功
          const isPlaying = (typeof courtyardSound.isPlaying === 'function') ? courtyardSound.isPlaying() : true;
          if (isPlaying) {
            courtyardSoundActive = true;
            showAudioPermissionButton = false;
          }
        }
      } catch (e) {}
    }
  }
  if (currentScreen === 'quiz') {
    // Quiz 由輸入框與按鈕處理；mousePressed 不再處理舊版選項點擊
    return;
    if (currentQuiz < quizData.length) {
      let quiz = quizData[currentQuiz];
      let gridStartX = width / 2;
      let gridStartY = height / 2;
      let buttonW = 250;
      let buttonH = 80;
      let buttonGap = 30;
      let gridWidth = 2 * buttonW + buttonGap;
      let gridHeight = 2 * buttonH + buttonGap;
      let startX = gridStartX - gridWidth / 2;
      let startY = gridStartY - gridHeight / 2;
      
      for (let i = 0; i < quiz.options.length; i++) {
        let col = i % 2;
        let row = floor(i / 2);
        let buttonX = startX + col * (buttonW + buttonGap) + buttonW / 2;
        let buttonY = startY + row * (buttonH + buttonGap) + buttonH / 2;
        
        if (mouseX > buttonX - buttonW / 2 && mouseX < buttonX + buttonW / 2 &&
            mouseY > buttonY - buttonH / 2 && mouseY < buttonY + buttonH / 2) {
          
          if (i === quiz.correct) {
            currentQuiz++;
            if (currentQuiz >= quizData.length) {
              // 答對所有題目
              if (isDogActive) {
                // 答對狗的問題，狗消失，貓出現
                isDogActive = false;
                isCatActive = true;
                // 初始化貓的位置和速度
                catX = random(width);
                catY = random(height);
                catSpeedX = random(-1, 1);
                catSpeedY = random(-1, 1);
              } else if (isCatActive) {
                // 答對貓的問題，貓消失，鑰匙出現
                isCatActive = false;
                isKeyActive = true;
                keyX = random(width * 0.2, width * 0.8); // 鑰匙出現在畫面中間區域
                keyY = random(height * 0.2, height * 0.8);
              } else if (isKeyActive) {
                // 答對鑰匙的問題，鑰匙消失，可以觸發遊戲結束
                isKeyActive = false;
                // 答完所有題目後，切換為「家」背景
                if (homeBg) {
                  courtyardBg = homeBg;
                  isHome = true;
                  if (homeSound && typeof homeSound.play === 'function') {
                    try {
                      if (!homeSound.isPlaying || !homeSound.isPlaying()) {
                        homeSound.play();
                      } else {
                        homeSound.play();
                      }
                    } catch (e) {
                      // play 可能因瀏覽器自動播放限制失敗，忽略
                      console.warn('homeSound play error', e);
                    }
                  }
                }
              }
              currentScreen = 'main'; // 返回主畫面
              collisionCooldown = 120; // 給予冷卻時間，避免馬上又觸發
            }
          } else {
            // 答錯，返回主畫面
            currentScreen = 'main';
            answers = [];
            collisionCooldown = 120; // 答錯後給予 2 秒冷卻時間 (60fps * 2)
          }
        }
      }
    } else {
      // 進入庭院按鈕
      if (mouseX > width / 2 - 75 && mouseX < width / 2 + 75 &&
          mouseY > height * 0.75 - 25 && mouseY < height * 0.75 + 25) {
        // 此按鈕在當前邏輯下不會顯示，但保留以備將來使用
      }
    }
    } else if (currentScreen === 'courtyard') {
    // 返回按鈕
    if (mouseX > width - 110 && mouseX < width - 10 &&
        mouseY > 5 && mouseY < 55) {
      currentScreen = 'main';
      currentQuiz = 0; // 重置題目進度
      answers = [];
    }
  }
}
