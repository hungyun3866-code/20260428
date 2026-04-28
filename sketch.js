let capture;

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 擷取攝影機影像
  capture = createCapture(VIDEO);
  
  // 隱藏預設的 HTML 影片標籤，我們只要顯示在畫布上
  capture.hide();
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 3. 計算顯示尺寸：畫布寬高的 50%
  let imgW = width * 0.5;
  let imgH = height * 0.5;

  // 4. 計算置中座標
  // 起點 x = (畫布寬 - 影像寬) / 2
  // 起點 y = (畫布高 - 影像高) / 2
  let x = (width - imgW) / 2;
  let y = (height - imgH) / 2;

  // 將影像繪製到畫布上
  image(capture, x, y, imgW, imgH);
}

// 加入視窗縮放監聽，確保調整視窗大小時影像依然置中
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}