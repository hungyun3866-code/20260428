let video;
let handPose;
let hands = [];
let bubbles = []; 
let statusMsg = "正在初始化系統...";
let isModelLoaded = false;

function preload() {
  if (!window.WebGLRenderingContext) {
    statusMsg = "❌ 您的瀏覽器不支援 WebGL";
    return;
  }
  // 保持 flipped: false，由我們統一映射座標以確保方向正確
  handPose = ml5.handPose({ flipped: false }, () => {
    isModelLoaded = true;
    statusMsg = "✅ 模型載入成功！";
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 攝影機開啟鏡像，讓畫面像照鏡子一樣直覺
  video = createCapture(VIDEO, { flipped: true }, (stream) => {
    if (stream) statusMsg = isModelLoaded ? "✅ 準備就緒" : "⏳ 載入中...";
  });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#e7c6ff');

  // --- 文字位置修正：置中上方 ---
  fill(0);
  noStroke();
  textSize(28); // 稍微加大字體讓它更明顯
  textAlign(CENTER, TOP); 
  // 水平位置在畫布寬度的一半，垂直距離頂端 20 像素
  text("414730860洪千涵", width / 2, 20);

  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let offsetX = (width - imgW) / 2;
  let offsetY = (height - imgH) / 2;

  if (isModelLoaded) {
    // 繪製攝影機影像
    image(video, offsetX, offsetY, imgW, imgH);

    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          
          // --- 骨架繪製 (確保方向與手型一致) ---
          let sections = [[0,1,2,3,4], [5,6,7,8], [9,10,11,12], [13,14,15,16], [17,18,19,20]];
          let c = hand.handedness == "Left" ? color(255, 0, 255) : color(255, 255, 0);

          stroke(c);
          strokeWeight(3);
          noFill();

          for (let s of sections) {
            beginShape();
            for (let i of s) {
              let pt = hand.keypoints[i];
              // 直接映射座標，使線條完美貼合鏡像後的影像
              let mx = map(pt.x, 0, video.width, 0, imgW) + offsetX;
              let my = map(pt.y, 0, video.height, 0, imgH) + offsetY;
              vertex(mx, my);
            }
            endShape();
          }

          // --- 圓點與水泡產生 ---
          noStroke();
          for (let i = 0; i < hand.keypoints.length; i++) {
            let pt = hand.keypoints[i];
            let mx = map(pt.x, 0, video.width, 0, imgW) + offsetX;
            let my = map(pt.y, 0, video.height, 0, imgH) + offsetY;
            
            fill(c);
            circle(mx, my, 8);

            // 在指尖 (4, 8, 12, 16, 20) 產生水泡
            if ([4, 8, 12, 16, 20].includes(i) && random(1) > 0.9) {
              bubbles.push(new Bubble(mx, my));
            }
          }
        }
      }
    }
  }

  // 更新並繪製所有水泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].display();
    if (bubbles[i].isPopped()) {
      bubbles.splice(i, 1);
    }
  }
}

// 水泡類別
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = random(8, 16);
    this.speed = random(2, 5);
    this.life = random(50, 90); // 水泡壽命
  }
  move() {
    this.y -= this.speed; // 向上飄移
    this.x += sin(frameCount * 0.1) * 1.5; // 左右蛇行
    this.life--;
  }
  display() {
    stroke(255, 180);
    strokeWeight(1);
    fill(255, 100);
    circle(this.x, this.y, this.r);
    // 增加一個小高光點
    noStroke();
    fill(255, 200);
    circle(this.x - this.r * 0.2, this.y - this.r * 0.2, this.r * 0.2);
  }
  isPopped() {
    return this.life <= 0 || this.y < 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}