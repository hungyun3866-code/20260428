let video;
let handPose;
let hands = [];
let statusMsg = "正在初始化系統...";
let isModelLoaded = false;

function preload() {
  // 檢查 WebGL 支援
  if (!window.WebGLRenderingContext) {
    statusMsg = "❌ 您的瀏覽器不支援 WebGL，無法執行辨識。";
    return;
  }

  // 初始化 HandPose 模型 (flipped 對應攝影機鏡像)
  handPose = ml5.handPose({ flipped: true }, () => {
    isModelLoaded = true;
    statusMsg = "✅ 模型載入成功！";
  });
}

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 建立攝影機並檢查是否支援
  video = createCapture(VIDEO, { flipped: true }, (stream) => {
    if (stream) {
      statusMsg = isModelLoaded ? "✅ 系統準備就緒" : "⏳ 正在載入模型...";
    }
  });

  video.size(640, 480); // 設定攝影機擷取解析度
  video.hide();

  // 錯誤處理：如果攝影機無法開啟
  video.elt.onerror = () => {
    statusMsg = "❌ 無法讀取攝影機，請檢查權限。";
  };

  if (handPose) {
    // 3. 開始偵測手勢
    handPose.detectStart(video, gotHands);
  }
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 設定背景顏色 e7c6ff
  background('#e7c6ff');

  // 計算顯示尺寸（畫布寬高的 50%）
  let imgW = width * 0.5;
  let imgH = height * 0.5;
  // 計算置中座標
  let offsetX = (width - imgW) / 2;
  let offsetY = (height - imgH) / 2;

  // 顯示狀態文字
  fill(0);
  textAlign(CENTER);
  textSize(16);
  text(statusMsg, width / 2, 40);

  // 只有在模型準備好時才顯示影像與骨架
  if (isModelLoaded) {
    image(video, offsetX, offsetY, imgW, imgH);

    // --- 手勢偵測骨架繪製邏輯 ---
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.confidence > 0.1) {
          
          // 定義五根手指的關鍵點編號範圍
          let fingers = [
            { start: 0, end: 4 },   // 大拇指 (含手腕 0)
            { start: 5, end: 8 },   // 食指
            { start: 9, end: 12 },  // 中指
            { start: 13, end: 16 }, // 無名指
            { start: 17, end: 20 }  // 小拇指
          ];

          // 判斷左右手設定顏色 (設定線條與圓點顏色)
          if (hand.handedness == "Left") {
            stroke(255, 0, 255); // 洋紅色線條
            fill(255, 0, 255, 150);    // 洋紅色圓點 (稍微透明)
          } else {
            stroke(255, 255, 0); // 黃色線條
            fill(255, 255, 0, 150);    // 黃色圓點 (稍微透明)
          }

          // 1. 繪製線條 (line)
          strokeWeight(4); // 線條粗細
          for (let fingerRange of fingers) {
            // 從範圍的第二個點開始 (例如食指從 6 開始連回 5)
            for (let i = fingerRange.start + 1; i <= fingerRange.end; i++) {
              let pt1 = hand.keypoints[i-1];
              let pt2 = hand.keypoints[i];

              // 座標轉換 (mapped)
              let x1 = map(pt1.x, 0, video.width, 0, imgW) + offsetX;
              let y1 = map(pt1.y, 0, video.height, 0, imgH) + offsetY;
              let x2 = map(pt2.x, 0, video.width, 0, imgW) + offsetX;
              let y2 = map(pt2.y, 0, video.height, 0, imgH) + offsetY;

              // 畫線
              line(x1, y1, x2, y2);
            }
          }

          // (選擇性) 2. 額外：連接所有手指根部 (0, 5, 9, 13, 17) 到 0 讓骨架更完整
          // 這部分不在你的要求內，但我通常會加，視覺上更好。
          // 如果只要手指連線，可將下面幾行註解掉。
          // ... 略過 ... 保持你要求的乾淨手指即可

          // 3. 繪製關鍵點 (circle) - 放在線條後面繪製，圓點會在線條上面
          noStroke(); // 圓點不加邊框
          for (let keypoint of hand.keypoints) {
            let mappedX = map(keypoint.x, 0, video.width, 0, imgW) + offsetX;
            let mappedY = map(keypoint.y, 0, video.height, 0, imgH) + offsetY;
            circle(mappedX, mappedY, 12); // 使用轉換後的座標畫圓
          }

        }
      }
    }
  } else {
    // 模型沒載入前，畫一個虛線框示意
    noFill();
    stroke(150);
    strokeWeight(1);
    rect(offsetX, offsetY, imgW, imgH);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}