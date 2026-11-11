
const editor = document.getElementById('code');
const initialCode = editor.value;
const runBtn = document.getElementById('run');
const message = document.getElementById('message');
const textOutput = document.getElementById('text-output');

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

// Pythonから呼び出す図形描画処理
window.drawPolygon = function(points, fillColor) {
  const scale = 50;

  ctx.fillStyle = fillColor;
  ctx.beginPath();

  points.forEach((point, index) => {
    const x = point[0] * scale;
    const y = canvas.height - point[1] * scale;

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
  // PythonからJavaScriptの描画機能を呼び出す
  pyodide.globals.set('drawPolygonJS', window.drawPolygon);

  await pyodide.runPythonAsync(`
from js import drawPolygonJS
from pyodide.ffi import to_js

_current_color = "#000000"

def color(c):
    global _current_color
    _current_color = c

def draw(*points):
    coordinates = [list(p) for p in points]
    drawPolygonJS(to_js(coordinates), _current_color)
`);

  await pyodide.runPythonAsync(editor.value);

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
