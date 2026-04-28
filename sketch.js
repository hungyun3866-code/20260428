let video;
let handPose;
let hands = [];
let statusMsg = "正在初始化系統...";
let isModelLoaded = false;

function preload() {
  if (!window.WebGLRenderingContext) {
    statusMsg = "❌ 您的瀏覽器不支援 WebGL";
    return;
  }
  // 開啟鏡像模式
  handPose = ml5.handPose({ flipped: true }, () => {
    isModelLoaded = true;
    statusMsg = "✅ 模型載入成功！";
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
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

  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let offsetX = (width - imgW) / 2;
  let offsetY = (height - imgH) / 2;

  fill(0);
  textAlign(CENTER);
  text(statusMsg, width / 2, 40);

  if (isModelLoaded) {
    image(video, offsetX, offsetY, imgW, imgH);

    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          
          // 定義手指區間
          let fingerSections = [
            [0, 1, 2, 3, 4],    // 大拇指
            [5, 6, 7, 8],       // 食指
            [9, 10, 11, 12],    // 中指
            [13, 14, 15, 16],   // 無名指
            [17, 18, 19, 20]    // 小拇指
          ];

          // 根據左右手設定顏色
          let c = hand.handedness == "Left" ? color(255, 0, 255) : color(255, 255, 0);

          // 繪製連線
          stroke(c);
          strokeWeight(3);
          noFill();

          for (let section of fingerSections) {
            beginShape(); // 使用 beginShape 讓連線更平滑
            for (let i of section) {
              let pt = hand.keypoints[i];
              
              // 【關鍵修正】：因為攝影機是翻轉的，所以座標也必須對應翻轉
              // 原理：新座標 = 影像寬度 - 原始座標
              let flippedX = video.width - pt.x; 
              
              let mx = map(flippedX, 0, video.width, 0, imgW) + offsetX;
              let my = map(pt.y, 0, video.height, 0, imgH) + offsetY;
              vertex(mx, my);
            }
            endShape();
          }

          // 繪製圓點
          noStroke();
          fill(c);
          for (let pt of hand.keypoints) {
            let flippedX = video.width - pt.x;
            let mx = map(flippedX, 0, video.width, 0, imgW) + offsetX;
            let my = map(pt.y, 0, video.height, 0, imgH) + offsetY;
            circle(mx, my, 8);
          }
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}