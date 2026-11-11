
const editor = document.getElementById('code');
const initialCode = editor.value;
const runBtn = document.getElementById('run');
const message = document.getElementById('message');
const textOutput = document.getElementById('text-output');

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

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


let pyodide = null;

// Pythonの読み込み

async function initPython() {
  message.textContent = 'Pythonを読み込んでいます...';

  try {
    pyodide = await loadPyodide();

    // PythonからJavaScriptの描画機能を呼び出す
    
pyodide.registerJsModule("drawing", {
  drawPolygonJS: window.drawPolygon
});


    await pyodide.runPythonAsync(`

from drawing import drawPolygonJS

from pyodide.ffi import to_js

_current_color = "#000000"

def color(c):
    global _current_color
    _current_color = c

def draw(*points):
    coordinates = [list(p) for p in points]
    drawPolygonJS(to_js(coordinates), _current_color)
`);

    runBtn.disabled = false;
    runBtn.textContent = '▶ 実行';
    message.textContent = 'Pythonの準備ができました。';

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
