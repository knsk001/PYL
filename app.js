
const editor = document.getElementById('code');
const initialCode = editor.value;

// 入力するたびに課題ごとのコードを保存
editor.addEventListener('input', () => {
  localStorage.setItem('pyl_code_' + currentTask, editor.value);
});

const runBtn = document.getElementById('run');


const autoPlayBtn = document.getElementById('auto-play');
const stepPlayBtn = document.getElementById('step-play');
const playResetBtn = document.getElementById('play-reset');

const showGridCheckbox = document.getElementById('show-grid');

const playbackInfo = document.getElementById('playback-info');
const loopCount = document.getElementById('loop-count');
const radiusValue = document.getElementById('radius-value');


showGridCheckbox.addEventListener('change', () => {
  // 再生途中なら、その時点までの図形を表示する
  if (playbackIndex > 0 && playbackIndex < playbackItems.length) {
    const allItems = drawingItems;

    drawingItems = playbackItems.slice(0, playbackIndex);
    window.renderDrawings(playbackItems);

    drawingItems = allItems;
  } else {
    // 通常は現在の図形を再描画する
    window.renderDrawings();
  }
});


 // 再生機能の管理
let playbackItems = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackRunning = false;


function resetPlayback() {
  // 自動再生を停止する
  if (playbackTimer !== null) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  playbackRunning = false;
  playbackIndex = 0;

  // 繰り返し表示を初期状態に戻す
  if (currentTask === 5) {
    playbackInfo.hidden = false;
    loopCount.textContent = `0 / ${playbackItems.length}`;
    
    // 最初に描画する円の半径を初期値として表示
    const firstCircle = playbackItems.find(
      item => item.type === "circle_line"
    );

    radiusValue.textContent =
      firstCircle ? firstCircle.radius : "－";
;
  } else {
    playbackInfo.hidden = true;
  }

  // 描画画面を消去する
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ボタンの状態を更新する
  autoPlayBtn.disabled = playbackItems.length === 0;
  stepPlayBtn.disabled = playbackItems.length === 0;
  playResetBtn.disabled = playbackItems.length === 0;
}

function stepPlayback() {
  // すべて表示済みなら終了
  if (playbackIndex >= playbackItems.length) return;

  // 次に表示する図形を取得
  const item = playbackItems[playbackIndex];

  // 表示対象を1個増やす
  playbackIndex++;

  // 課題④の繰り返し回数と半径を表示
  if (currentTask === 5) {
    playbackInfo.hidden = false;

    loopCount.textContent =
      `${playbackIndex} / ${playbackItems.length}`;

    const currentItem = playbackItems[playbackIndex - 1];

    radiusValue.textContent =
      currentItem.type === "circle_line"
        ? currentItem.radius
        : "－";
  }

　
 // 表示済みの図形だけを描画する
const allItems = drawingItems;
drawingItems = playbackItems.slice(0, playbackIndex);

// 縮尺は全図形を基準に固定する
window.renderDrawings(playbackItems);

// 元の図形データに戻す
drawingItems = allItems;


  // ボタンの状態を更新
  
  const finished = playbackIndex >= playbackItems.length;
  stepPlayBtn.disabled = finished || playbackRunning;
  autoPlayBtn.disabled = finished || playbackRunning;


  message.textContent =
    `繰り返し ${playbackIndex} / ${playbackItems.length} 回`;
}

stepPlayBtn.addEventListener('click', () => {
  stepPlayback();
});


autoPlayBtn.addEventListener('click', () => {
  if (playbackRunning) return;
  if (playbackIndex >= playbackItems.length) return;

  playbackRunning = true;
  autoPlayBtn.disabled = true;
  stepPlayBtn.disabled = true;

  playbackTimer = setInterval(() => {
    stepPlayback();

    if (playbackIndex >= playbackItems.length) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      playbackRunning = false;
    }
  }, 1000);
});

playResetBtn.addEventListener('click', () => {
  resetPlayback();
  message.textContent = '最初から再生できます。';
});

const message = document.getElementById('message');
const textOutput = document.getElementById('text-output');

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

 // 課題JSONファイルを読み込む
async function loadTask(taskNumber) {
 
  // 課題を切り替えるときは、変数表示をいったん隠す
  
playbackInfo.hidden = true;
loopCount.textContent = "0 / 0";
radiusValue.textContent = "－";


  try {
    const response = await fetch(
  `tasks/task${taskNumber}.json`,
  { cache: "no-store" }
);

    if (!response.ok) {
      throw new Error("課題ファイルが見つかりません");
    }

    const task = await response.json();

    return task;

  } catch (error) {
    console.error("課題の読み込みエラー:", error);
    message.textContent = "課題の読み込みに失敗しました。";
    return null;
  }
}

 // 課題JSONの内容を画面に表示する

function displayTask(task) {

  if (playbackTimer !== null) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  playbackRunning = false;
  playbackItems = [];
  playbackIndex = 0;

  autoPlayBtn.disabled = true;
  stepPlayBtn.disabled = true;
  playResetBtn.disabled = true;

  document.querySelector('header span').textContent =

    `課題 ${task.id} / 6`;

  const taskSection = document.querySelector('.task');
  taskSection.replaceChildren();

  const title = document.createElement('h2');
  title.textContent = task.title;

  const description = document.createElement('p');
  description.textContent = task.description;

  taskSection.append(title, description);

  if (task.guide && task.guide.length > 0) {
    const table = document.createElement('table');
    table.className = 'shape-guide';

    task.guide.forEach(item => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      const td2 = document.createElement('td');

      td1.textContent = item.name;
      td2.textContent = item.code;

      tr.append(td1, td2);
      table.appendChild(tr);
    });

    taskSection.appendChild(table);
  }

  
const savedTaskCode = localStorage.getItem('pyl_code_' + task.id);
editor.value = savedTaskCode !== null ? savedTaskCode : task.code;


  drawingItems = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  textOutput.textContent = '';
  textOutput.hidden = true;

  message.textContent = `課題${task.id}を表示しました。`;
}

 // 描画する図形を一時的に保存する
let drawingItems = [];

// 図形を登録する
window.addDrawingItem = function(item) {
  drawingItems.push(item);
};

// Pythonから呼び出す図形描画処理


window.drawText = function(x, y, text) {
  window.addDrawingItem({
    type: "text",
    x: Number(x),
    y: Number(y),
    text: String(text)
  });
};


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

 // 円の輪郭を描く処理
window.drawCircleLine = function(center, radius, lineColor) {
  const cx = Number(center[0]);
  const cy = Number(center[1]);
  const r = Number(radius);

  if (!Number.isFinite(cx) ||
      !Number.isFinite(cy) ||
      !Number.isFinite(r) || r <= 0) {
    throw new Error("円の中心座標と半径を確認してください");
  }

  window.addDrawingItem({
    type: "circle_line",
    center: [cx, cy],
    radius: r,
    color: lineColor
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

window.renderDrawings = function(scaleItems = drawingItems) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (drawingItems.length === 0) return;

  const xs = [];
  const ys = [];

  // 全図形の座標範囲を調べる
  scaleItems.forEach(item => {
    if (item.type === "polygon") {
      item.points.forEach(p => {
        xs.push(p[0]);
        ys.push(p[1]);
      });
    } else if (item.type === "circle" || item.type === "circle_line") {
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

  if (showGridCheckbox.checked) {

  // 薄い方眼を表示する
  const gridStep = 5;

  ctx.beginPath();

  // 縦線
  for (
    let x = Math.ceil(minX / gridStep) * gridStep;
    x <= maxX;
    x += gridStep
  ) {
    ctx.moveTo(X(x), 0);
    ctx.lineTo(X(x), canvas.height);
  }

  // 横線
  for (
    let y = Math.ceil(minY / gridStep) * gridStep;
    y <= maxY;
    y += gridStep
  ) {
    ctx.moveTo(0, Y(y));
    ctx.lineTo(canvas.width, Y(y));
  }

  ctx.strokeStyle = "#E6ECF2";
  ctx.lineWidth = 1;
  ctx.stroke();

 
  // X軸・Y軸を表示する
  ctx.beginPath();

  // X軸（y = 0）
  ctx.moveTo(0, Y(0));
  ctx.lineTo(canvas.width, Y(0));

  // Y軸（x = 0）
  ctx.moveTo(X(0), 0);
  ctx.lineTo(X(0), canvas.height);

  ctx.strokeStyle = "#999999";
  ctx.lineWidth = 1;
  ctx.stroke();


  // 座標軸の目盛りを表示する
  ctx.fillStyle = "#666666";
  ctx.font = "12px sans-serif";

  // X軸の目盛り
  ctx.textAlign = "center";
  for (
    let x = Math.ceil(minX / 5) * 5;
    x <= maxX;
    x += 5
  ) {
    ctx.fillText(String(x), X(x), Y(0) + 15);
  }

  // Y軸の目盛り
  ctx.textAlign = "right";
  for (
    let y = Math.ceil(minY / 5) * 5;
    y <= maxY;
    y += 5
  ) {
    if (y !== 0) {
      ctx.fillText(String(y), X(0) - 7, Y(y) + 4);
    }
  }
}
  // 登録順に描画する

drawingItems.forEach(item => {
    
    if (item.type === "text") {
      ctx.save();

      ctx.fillStyle = "#333333";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(item.text, X(item.x), Y(item.y) - 4);

      ctx.restore();


    } else if (item.type === "polygon") {

      ctx.beginPath();
      item.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(X(p[0]), Y(p[1]));
        else ctx.lineTo(X(p[0]), Y(p[1]));
      });
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
     
    } else if (item.type === "circle_line") {
      ctx.beginPath();
      ctx.arc(
        X(item.center[0]),
        Y(item.center[1]),
        item.radius * scale,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.stroke();


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
　　　
    // Pythonのinput()で番号を入力できるようにする
    
    // Pythonのinput()をブラウザの入力画面に接続
    
    // Pythonのinput()をブラウザの入力画面に接続
    pyodide.globals.set(
      "browser_input",
      (message) => window.prompt(message) ?? ""
    );

    await pyodide.runPythonAsync(`
import builtins
builtins.input = browser_input
`);



    // PythonからJavaScriptの描画機能を呼び出す
    
pyodide.registerJsModule("drawing", {
  drawPolygonJS: window.drawPolygon,
  drawCircleJS: window.drawCircle,
  drawCircleLineJS: window.drawCircleLine,
drawLineJS: window.drawLine,
drawTextJS: window.drawText

});




    await pyodide.runPythonAsync(`



from drawing import drawPolygonJS, drawCircleJS, drawCircleLineJS, drawLineJS, drawTextJS


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
    

def bar(values, y=0):
    color("#5087CC")
    for i in range(len(values)):
        x = i * 3
        h = values[i] / 5
        draw((x, y), (x+2, y), (x+2, y+h), (x, y+h))
        drawTextJS(x+1, y+h, str(values[i]))



def circle(center, radius):
    drawCircleJS(to_js(list(center)), radius, _current_color)

def circle_line(center, radius):
    drawCircleLineJS(to_js(list(center)), radius, _current_color)


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

 
// Pythonの準備ができたら、表示中のサンプルを自動実行
if (editor.value.trim() !== '') {
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

  if (playbackTimer !== null) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  playbackRunning = false;

 

 
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

// 描画した図形を再生用に保存
playbackItems = [...drawingItems];
playbackIndex = 0;

// 再生ボタンを有効にする
autoPlayBtn.disabled = playbackItems.length === 0;
stepPlayBtn.disabled = playbackItems.length === 0;
playResetBtn.disabled = playbackItems.length === 0;

// 通常の実行では完成図を表示
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
document.getElementById('reset').addEventListener('click', async () => {
  
  
const task = await loadTask(currentTask);
if (!task) return;
editor.value = task.code;
localStorage.removeItem('pyl_code_' + currentTask);



  textOutput.textContent = '';
  textOutput.hidden = true;
  message.textContent = '現在の課題の初期コードに戻しました。';
});


 // 全部消す

document.getElementById('clear').addEventListener('click', () => {

  drawingItems = [];
  playbackItems = [];
  resetPlayback();

  editor.value = '';

localStorage.setItem('pyl_code_' + currentTask, '');

  textOutput.textContent = '';
  textOutput.hidden = true;

  const canvas = document.getElementById('preview');
  canvas.getContext('2d').clearRect(
    0, 0, canvas.width, canvas.height
  );

  message.textContent = '入力内容をすべて消しました。';
  editor.focus();
});


 // 現在の課題番号
let currentTask = 1;

// 次の課題ボタン
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');

nextBtn.disabled = false;
nextBtn.textContent = '次の課題へ';

// 前の課題に戻る
prevBtn.addEventListener('click', async () => {
  if (currentTask <= 1) return;

  const previousNumber = currentTask - 1;
  const task = await loadTask(previousNumber);

  if (!task) return;

  displayTask(task);
  currentTask = previousNumber;

  prevBtn.disabled = currentTask <= 1;
  nextBtn.disabled = false;

  runBtn.click();
});
// 次の課題へ進む
nextBtn.addEventListener('click', async () => {
  const nextNumber = currentTask + 1;

  // JSONファイルから読み込む
  const task = await loadTask(nextNumber);

  if (!task) return;

  // 課題を画面に表示
  displayTask(task);
  currentTask = nextNumber;
 prevBtn.disabled = currentTask <= 1;
// 新しい課題のサンプルを自動実行

  runBtn.click();

  // 課題⑥で次の課題ボタンを無効にする
  nextBtn.disabled = currentTask >= 6;
});



async function startApp() {
  const task = await loadTask(1);

  if (task) {
    displayTask(task);
  }

  prevBtn.disabled = true;

  await initPython();
}

startApp();

