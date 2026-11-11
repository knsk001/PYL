
const editor = document.getElementById('code');
const initialCode = editor.value;

 // 入力したPythonコードをブラウザに自動保存
const savedCode = localStorage.getItem('pyl_code');

if (savedCode !== null) {
  editor.value = savedCode;
}

// 入力するたびに保存
editor.addEventListener('input', () => {
  localStorage.setItem('pyl_code', editor.value);
});

const runBtn = document.getElementById('run');
const message = document.getElementById('message');
const textOutput = document.getElementById('text-output');

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

 // 描画する図形を一時的に保存する
let drawingItems = [];

// 図形を登録する
window.addDrawingItem = function(item) {
  drawingItems.push(item);
};

// Pythonから呼び出す図形描画処理

window.drawPolygon = function(points, fillColor) {
  const margin = 30;

  // 座標の最大値・最小値を調べる
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys);

  // 図形が画面に収まる倍率を求める
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  const scale = Math.min(
    (canvas.width - margin * 2) / rangeX,
    (canvas.height - margin * 2) / rangeY,
    50
  );

  ctx.fillStyle = fillColor;
  ctx.beginPath();

  points.forEach((point, index) => {
    const x = margin + (point[0] - minX) * scale;
    const y = canvas.height - margin
            - (point[1] - minY) * scale;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.closePath();
  ctx.fill();
};

 // 円を描く処理
window.drawCircle = function(center, radius, fillColor) {
  const margin = 30;

  const cx = Number(center[0]);
  const cy = Number(center[1]);
  const r = Number(radius);

  if (!Number.isFinite(cx) || !Number.isFinite(cy) ||
      !Number.isFinite(r) || r <= 0) {
    throw new Error("円の中心座標と半径を確認してください");
  }

  // 円全体が画面に収まる倍率
  const scale = Math.min(
    50,
    (canvas.width - margin * 2) / Math.max(cx + r, 2 * r, 1),
    (canvas.height - margin * 2) / Math.max(cy + r, 2 * r, 1)
  );

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  ctx.beginPath();
  ctx.arc(x, y, r * scale, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
};

 // 2点を結ぶ直線（線分）を描く
window.drawLine = function(start, end, lineColor, width = 2) {
  const margin = 30;

  const x1 = Number(start[0]);
  const y1 = Number(start[1]);
  const x2 = Number(end[0]);
  const y2 = Number(end[1]);

  // 描画領域に収まる倍率を計算
  const minX = Math.min(x1, x2, 0);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2, 0);
  const maxY = Math.max(y1, y2);

  const scale = Math.min(
    50,
    (canvas.width - margin * 2) / Math.max(maxX - minX, 1),
    (canvas.height - margin * 2) / Math.max(maxY - minY, 1)
  );

  ctx.beginPath();
  ctx.moveTo(
    margin + (x1 - minX) * scale,
    canvas.height - margin - (y1 - minY) * scale
  );
  ctx.lineTo(
    margin + (x2 - minX) * scale,
    canvas.height - margin - (y2 - minY) * scale
  );

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = width;
  ctx.stroke();
};


let pyodide = null;

// Pythonの読み込み

async function initPython() {
  message.textContent = 'Pythonを読み込んでいます...';

  try {
    pyodide = await loadPyodide();

    // PythonからJavaScriptの描画機能を呼び出す
    

pyodide.registerJsModule("drawing", {
  drawPolygonJS: window.drawPolygon,
  drawCircleJS: window.drawCircle,
  drawLineJS: window.drawLine
});



    await pyodide.runPythonAsync(`

from drawing import drawPolygonJS, drawCircleJS, drawLineJS

from pyodide.ffi import to_js

_current_color = "#000000"

def color(c):
    global _current_color
    _current_color = c

def draw(*points):
    coordinates = [list(p) for p in points]
    drawPolygonJS(to_js(coordinates), _current_color)
    
def circle(center, radius):
    drawCircleJS(to_js(list(center)), radius, _current_color)


def line(start, end, width=2):
    drawLineJS(
        to_js(list(start)),
        to_js(list(end)),
        _current_color,
        width
    )


`);

    runBtn.disabled = false;
    runBtn.textContent = '▶ 実行';
    message.textContent = 'Pythonの準備ができました。';

 // 保存されたコードがあれば、再読み込み時に自動実行
if (savedCode !== null && savedCode.trim() !== '') {
  runBtn.click();
}

  } catch (error) {
    message.textContent = 'Pythonの読み込みに失敗しました。';
    console.error(error);
  }
}


// Pythonコードの実行
runBtn.addEventListener('click', async () => {
  if (!pyodide) return;
 

 
ctx.clearRect(0, 0, canvas.width, canvas.height);


  runBtn.disabled = true;
  message.textContent = '実行中...';

  let output = '';

  pyodide.setStdout({
    batched: (text) => {
      output += text + '\n';
    }
  });

  try {
    await pyodide.runPythonAsync(editor.value);

    textOutput.hidden = false;
    textOutput.textContent =
      output || '実行が完了しました。';

    message.textContent = '実行完了';
  } catch (error) {
    textOutput.hidden = false;
    textOutput.textContent = String(error);
    message.textContent = '実行エラー';
  } finally {
    runBtn.disabled = false;
  }
});

// リセット
document.getElementById('reset').addEventListener('click', () => {
  editor.value = initialCode;
  textOutput.textContent = '';
  textOutput.hidden = true;
  message.textContent = '入力内容を初期状態に戻しました。';
});

 // 全部消す
document.getElementById('clear').addEventListener('click', () => {
  editor.value = '';
  textOutput.textContent = '';
  textOutput.hidden = true;

  const canvas = document.getElementById('preview');
  canvas.getContext('2d').clearRect(
    0, 0, canvas.width, canvas.height
  );

  message.textContent = '入力内容をすべて消しました。';
  editor.focus();
});

initPython();
