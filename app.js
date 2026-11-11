
const editor = document.getElementById('code');
const initialCode = editor.value;
const runBtn = document.getElementById('run');
const message = document.getElementById('message');
const textOutput = document.getElementById('text-output');

let pyodide = null;

// Pythonの読み込み
async function initPython() {
  message.textContent = 'Pythonを読み込んでいます...';

  try {
    pyodide = await loadPyodide();
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

initPython();
