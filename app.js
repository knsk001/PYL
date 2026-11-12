
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
  // Pythonから渡された座標を通常の配列に変換
  const coordinates = Array.from(
    points,
    p => [Number(p[0]), Number(p[1])]
  );

  // 多角形の情報を保存
  window.addDrawingItem({
    type: "polygon",
    points: coordinates,
    color: fillColor
  });
};


 // 円を描く処理

window.drawCircle = function(center, radius, fillColor) {
  const cx = Number(center[0]);
  const cy = Number(center[1]);
  const r = Number(radius);

  // 座標と半径を確認
  if (!Number.isFinite(cx) ||
      !Number.isFinite(cy) ||
      !Number.isFinite(r) || r <= 0) {
    throw new Error("円の中心座標と半径を確認してください");
  }

  // 円の情報を保存
  window.addDrawingItem({
    type: "circle",
    center: [cx, cy],
    radius: r,
    color: fillColor
  });
};


 // 2点を結ぶ直線（線分）を描く

window.drawLine = function(start, end, lineColor, width = 2) {
  const x1 = Number(start[0]);
  const y1 = Number(start[1]);
  const x2 = Number(end[0]);
  const y2 = Number(end[1]);

  // 座標と線の太さを確認
  if (![x1, y1, x2, y2].every(Number.isFinite) ||
      !Number.isFinite(Number(width)) || Number(width) <= 0) {
    throw new Error("直線の座標と太さを確認してください");
  }

  // 直線の情報を保存
  window.addDrawingItem({
    type: "line",
    start: [x1, y1],
    end: [x2, y2],
    color: lineColor,
    width: Number(width)
  });
};

 // 保存したすべての図形を共通座標で描画
window.renderDrawings = function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (drawingItems.length === 0) return;

  const xs = [];
  const ys = [];

  // 全図形の座標範囲を調べる
  drawingItems.forEach(item => {
    if (item.type === "polygon") {
      item.points.forEach(p => {
        xs.push(p[0]);
        ys.push(p[1]);
      });
    } else if (item.type === "circle") {
      xs.push(item.center[0] - item.radius,
              item.center[0] + item.radius);
      ys.push(item.center[1] - item.radius,
              item.center[1] + item.radius);
    } else if (item.type === "line") {
      xs.push(item.start[0], item.end[0]);
      ys.push(item.start[1], item.end[1]);
    }
  });

  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);

  const margin = 30;
  const scale = Math.min(
    50,
    (canvas.width - margin * 2) / Math.max(maxX - minX, 1),
    (canvas.height - margin * 2) / Math.max(maxY - minY, 1)
  );

  const X = x => margin + (x - minX) * scale;
  const Y = y => canvas.height - margin - (y - minY) * scale;

  // 登録順に描画する
  drawingItems.forEach(item => {
    if (item.type === "polygon") {
      ctx.beginPath();
      item.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(X(p[0]), Y(p[1]));
        else ctx.lineTo(X(p[0]), Y(p[1]));
      });
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

    } else if (item.type === "circle") {
      ctx.beginPath();
      ctx.arc(
        X(item.center[0]),
        Y(item.center[1]),
        item.radius * scale,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = item.color;
      ctx.fill();

    } else if (item.type === "line") {
      ctx.beginPath();
      ctx.moveTo(X(item.start[0]), Y(item.start[1]));
      ctx.lineTo(X(item.end[0]), Y(item.end[1]));
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.stroke();
    }
  });
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

def invert_color(iro):
    r = 255 - int(iro[1:3], 16)
    g = 255 - int(iro[3:5], 16)
    b = 255 - int(iro[5:7], 16)
    return f"#{r:02X}{g:02X}{b:02X}"

def show_colors(original, changed):
    color(original)
    draw((1, 1), (4, 1), (4, 4), (1, 4))

    color(changed)
    draw((6, 1), (9, 1), (9, 4), (6, 4))
    

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
  // 今回の実行で描く図形だけを記録
  drawingItems = [];

  
await pyodide.runPythonAsync('_current_color = "#000000"');
await pyodide.runPythonAsync(editor.value);


  // 全図形を共通座標で描画
  window.renderDrawings();

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
