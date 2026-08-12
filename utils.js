// utils.js
// localStorage 안전 접근 래퍼
// (사생활 보호 모드/쿠키 차단 환경에서는 localStorage 접근만으로 예외가 발생해
//  스크립트 전체가 중단될 수 있으므로 항상 try/catch로 감싼다)
export function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}

export function storageRemove(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// 배열 섞기 함수
export function shuffle(array) {
  if (!array) return [];
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 클립보드 복사 함수
export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
  } else {
    return Promise.resolve(fallbackCopyText(text));
  }
}

function fallbackCopyText(text) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("복사 실패", err);
    return false;
  }
}