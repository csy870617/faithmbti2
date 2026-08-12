// core.js
import { storageGet, storageSet } from './utils.js';

// 폰트 조절 기능
export function initFontControl(dom) {
  let currentFontScale = parseFloat(storageGet("ftype_font_scale")) || 1.0;
  if (currentFontScale < 0.7 || currentFontScale > 1.3) currentFontScale = 1.0;

  function applyFontSize(scale) {
    scale = Math.round(scale * 10) / 10;
    document.documentElement.style.fontSize = `${Math.round(scale * 120)}%`;
    storageSet("ftype_font_scale", scale);
    currentFontScale = scale;
  }
  applyFontSize(currentFontScale);

  if (dom.btns.fontUp) dom.btns.fontUp.addEventListener("click", () => { if (currentFontScale < 1.3) applyFontSize(currentFontScale + 0.1); });
  if (dom.btns.fontDown) dom.btns.fontDown.addEventListener("click", () => { if (currentFontScale > 0.7) applyFontSize(currentFontScale - 0.1); });
  if (dom.btns.fontReset) dom.btns.fontReset.addEventListener("click", () => applyFontSize(1.0));
}

// 문항 렌더링
export function renderQuestion(dom, questions, currentIndex, answers, onSelect) {
  const q = questions[currentIndex];
  if (!q) return;
  const idx = currentIndex + 1;
  const total = questions.length;

  if(dom.progress.label) dom.progress.label.textContent = `문항 ${idx} / ${total}`;
  if(dom.progress.fill) dom.progress.fill.style.width = `${(idx / total) * 100}%`;
  if(dom.question.code) dom.question.code.textContent = `Q${idx}`;
  if(dom.question.text) dom.question.text.textContent = q.text;

  renderScale(dom, q.id, answers, onSelect);
  if(dom.btns.back) dom.btns.back.disabled = false; 
}

function renderScale(dom, questionId, answers, onSelect) {
  if (!dom.question.inputs) return;
  const container = dom.question.inputs;
  container.innerHTML = "";
  
  const fragment = document.createDocumentFragment();
  const currentValue = answers[questionId] || null;

  // pill 클릭 핸들러와 label이 전달하는 radio change 이벤트가
  // 한 번의 탭에 모두 발생해 onSelect가 중복 호출(문항 건너뜀)되는 것을 방지
  let selectionLocked = false;

  for (let i = 1; i <= 5; i++) {
    const label = document.createElement("label");
    label.className = "scale-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "scale";
    input.value = String(i);
    input.checked = currentValue === i;

    const pill = document.createElement("div");
    pill.className = "scale-pill";
    pill.textContent = i;

    const handleSelect = () => {
      if (selectionLocked) return;
      selectionLocked = true;
      answers[questionId] = i;
      onSelect(); // 다음으로 이동 콜백
    };

    input.addEventListener("change", handleSelect);
    pill.addEventListener("click", () => {
      input.checked = true;
      handleSelect();
    });

    label.appendChild(input);
    label.appendChild(pill);
    fragment.appendChild(label);
  }
  container.appendChild(fragment);
}

// 결과 계산
export function calculateResult(originalQuestions, answers) {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const axisScores = { EI: 0, SN: 0, TF: 0, JP: 0 };

  if (!originalQuestions) return { type: "ISTJ", scores, axisScores };

  originalQuestions.forEach((q) => {
    const v = answers[q.id];
    if (!v) return;
    scores[q.side] += v;
    const centered = v - 3; 

    if (q.axis === "EI") axisScores.EI += q.side === "E" ? centered : -centered;
    else if (q.axis === "SN") axisScores.SN += q.side === "S" ? centered : -centered;
    else if (q.axis === "TF") axisScores.TF += q.side === "T" ? centered : -centered;
    else if (q.axis === "JP") axisScores.JP += q.side === "J" ? centered : -centered;
  });

  const type =
    (axisScores.EI >= 0 ? "E" : "I") +
    (axisScores.SN >= 0 ? "S" : "N") +
    (axisScores.TF >= 0 ? "T" : "F") +
    (axisScores.JP >= 0 ? "J" : "P");

  return { type, scores, axisScores };
}

// 결과 화면 렌더링
export function renderResultScreen(dom, type, scores, axisScores) {
  // 1. 메인 결과
  renderResultText(dom, type);
  // 2. 그래프
  renderAxisUpgraded(dom, axisScores);
  renderDetailScores(dom, scores);
  // 3. 매칭 카드
  renderMatchCards(dom, type);
}

function renderResultText(dom, type) {
  if (typeof window.typeResults === 'undefined') return;
  const data = window.typeResults[type];
  if (!data) return; // 저장 데이터 손상 등으로 알 수 없는 유형이 들어와도 중단되지 않도록

  if(dom.result.code) dom.result.code.textContent = type;
  if(dom.result.name) dom.result.name.textContent = `${data.nameKo} · ${data.nameEn}`;
  if(dom.result.summary) dom.result.summary.textContent = data.summary;

  if(dom.result.badges) {
    dom.result.badges.innerHTML = "";
    (data.badges || []).forEach(b => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = b;
      dom.result.badges.appendChild(span);
    });
  }

  const renderList = (el, items) => {
    if(!el) return;
    el.innerHTML = "";
    (items || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      el.appendChild(li);
    });
  };

  renderList(dom.result.features, data.features);
  renderList(dom.result.growth, data.growth);
  renderList(dom.result.ministries, data.ministries);

  if(dom.result.strength) dom.result.strength.textContent = `강점: ${data.strengthShort}`;
  if(dom.result.weakness) dom.result.weakness.textContent = `약점: ${data.weaknessShort}`;
  if(dom.result.warning) dom.result.warning.textContent = data.warningShort;

  // 성경 인물 & 말씀 (처음엔 숨김)
  if(dom.bible.charEl) dom.bible.charEl.textContent = `${data.bibleCharacter} – ${data.bibleCharacterDesc}`;
  if(dom.bible.verseEl) dom.bible.verseEl.textContent = `${data.verseRef} ${data.verseText}`;
  if(dom.bible.box) dom.bible.box.classList.add("hidden");
  if(dom.btns.bibleToggle) dom.btns.bibleToggle.textContent = "📖 성경 인물 보기";
  
  if(dom.verse.box) dom.verse.box.classList.add("hidden");
  if(dom.character.emoji) dom.character.emoji.textContent = data.characterEmoji;
  if(dom.character.title) dom.character.title.textContent = data.characterTitle;
  if(dom.character.text) dom.character.text.textContent = data.characterStory;
}

function renderAxisUpgraded(dom, axisScores) {
  if(!dom.result.axis) return;
  axisScores = axisScores || {}; // 구버전 저장 데이터에는 축 점수가 없을 수 있음
  const defs = [
    { key: "EI", left: "E", right: "I", label: "에너지 방향" },
    { key: "SN", left: "S", right: "N", label: "정보 인식" },
    { key: "TF", left: "T", right: "F", label: "판단 기준" },
    { key: "JP", left: "J", right: "P", label: "생활 방식" }
  ];
  const MAX = 20;
  
  let html = "";
  defs.forEach(d => {
    const v = axisScores[d.key] || 0;
    let leftPercent = Math.max(0, Math.min(100, Math.round(50 + (v / (2 * MAX)) * 100)));
    const rightPercent = 100 - leftPercent;

    html += `
      <div class="axis-row">
        <div class="axis-label">
          <span>${d.label}</span>
          <span class="axis-sub-label">${d.left} ${leftPercent}% · ${d.right} ${rightPercent}%</span>
        </div>
        <div class="axis-bar-bg"><div class="axis-bar-fill" style="width:${leftPercent}%"></div></div>
      </div>`;
  });
  dom.result.axis.innerHTML = html;
}

function renderDetailScores(dom, scores) {
  if(!dom.result.detail) return;
  scores = scores || {}; // 구버전 저장 데이터에는 세부 점수가 없을 수 있음
  const maxScore = 25;
  let html = "";
  ["E", "I", "S", "N", "T", "F", "J", "P"].forEach(k => {
    const v = scores[k] || 0;
    const percent = Math.min(100, Math.round((v / maxScore) * 100));
    html += `
      <div class="detail-score-row">
        <div class="detail-score-label">${k} (${v})</div>
        <div class="detail-score-bar-bg"><div class="detail-score-bar-fill" style="width:${percent}%"></div></div>
      </div>`;
  });
  dom.result.detail.innerHTML = html;
}

function similarityScore(a, b) {
  let s = 0;
  for (let i = 0; i < 4; i++) if (a[i] === b[i]) s++;
  return s;
}

function renderMatchCards(dom, type) {
  if (typeof window.typeResults === 'undefined') return;
  const entries = Object.entries(window.typeResults);
  const all = entries
    .filter(([code]) => code !== type)
    .map(([code, data]) => ({ code, data, sim: similarityScore(type, code) }));

  const top2 = [...all].sort((a, b) => b.sim - a.sim).slice(0, 2);
  const opposite = [...all].sort((a, b) => a.sim - b.sim)[0];
  if (!opposite) return;

  if (dom.result.matchTop2) {
    dom.result.matchTop2.innerHTML = top2.map(t => `
      <div class="match-item">
        <div class="match-item-title">${t.data.nameKo} (${t.code})</div>
        <div class="match-item-sub">${t.data.strengthShort}</div>
      </div>`).join('');
  }

  if (dom.result.matchOpposite) {
    dom.result.matchOpposite.innerHTML = `
      <div class="match-item match-item-opposite">
        <div class="match-item-title">${opposite.data.nameKo} (${opposite.code})</div>
        <div class="match-item-sub">${opposite.data.strengthShort}</div>
      </div>`;
  }
}