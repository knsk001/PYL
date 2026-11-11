// 外枠の段階では、Pythonの実行処理はまだ追加しません。
const editor = document.getElementById('code');
const initialCode = editor.value;
document.getElementById('reset').addEventListener('click', () => {
  editor.value = initialCode;
  document.getElementById('message').textContent = '入力内容を初期状態に戻しました。';
});
