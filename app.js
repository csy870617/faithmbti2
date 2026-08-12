// app.js - 인앱브라우저 호환성 및 그룹 고유 ID 로직 적용

import * as Utils from './utils.js';
import * as Core from './core.js';
import * as Church from './church.js';

document.addEventListener('DOMContentLoaded', () => {

  // 인앱브라우저 터치 활성화를 위한 더미 리스너
  document.addEventListener('touchstart', function() {}, {passive: true});

  function scrollToTop() {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  /* =========================================
     1. DOM 요소 캐싱
     ========================================= */
  const dom = {
    sections: {
      intro: document.getElementById("intro-section"),
      test: document.getElementById("test-section"),
      result: document.getElementById("result-section"),
      church: document.getElementById("church-section")
    },
    btns: {
      start: document.getElementById("start-btn"),
      back: document.getElementById("back-btn"),
      skip: document.getElementById("skip-btn"),
      restart: document.getElementById("restart-btn"),
      share: document.getElementById("share-btn"),
      goResult: document.getElementById("go-result-btn"),
      bibleToggle: document.getElementById("bible-toggle-btn"),
      todayVerse: document.getElementById("today-verse-btn"),
      church: document.getElementById("church-btn"),
      churchMainClose: document.getElementById("church-main-close-btn"), 
      memberSave: document.getElementById("member-save-btn"),
      churchSummary: document.getElementById("church-summary-btn"),
      churchAnalysis: document.getElementById("church-analysis-btn"), 
      inviteBottom: document.getElementById("invite-btn-bottom"),
      churchCopy: document.getElementById("church-copy-btn"),
      fontUp: document.getElementById("font-up"),
      fontDown: document.getElementById("font-down"),
      fontReset: document.getElementById("font-reset"),
      
      groupCreate: document.getElementById("group-create-btn"),
      groupLogin: document.getElementById("group-login-btn"),
      groupAuthClose: document.getElementById("church-auth-close-btn")
    },
    progress: {
      label: document.getElementById("progress-label"),
      fill: document.getElementById("progress-fill")
    },
    question: {
      code: document.getElementById("question-code"),
      text: document.getElementById("question-text"),
      inputs: document.getElementById("scale-inputs")
    },
    result: {
      code: document.getElementById("result-code"),
      name: document.getElementById("result-name"),
      summary: document.getElementById("result-summary"),
      badges: document.getElementById("result-badges"),
      features: document.getElementById("result-features"),
      growth: document.getElementById("result-growth"),
      strength: document.getElementById("result-strength"),
      weakness: document.getElementById("result-weakness"),
      warning: document.getElementById("result-warning"),
      ministries: document.getElementById("result-ministries"),
      axis: document.getElementById("axis-upgraded"),
      detail: document.getElementById("detail-score-list"),
      matchTop2: document.getElementById("match-top2"),
      matchOpposite: document.getElementById("match-opposite"),
      otherTypes: document.getElementById("other-types-grid")
    },
    bible: {
      charEl: document.getElementById("bible-character"),
      verseEl: document.getElementById("bible-verse"),
      box: document.getElementById("bible-box")
    },
    character: {
      emoji: document.getElementById("character-emoji"),
      title: document.getElementById("character-title"),
      text: document.getElementById("character-text")
    },
    verse: {
      box: document.getElementById("today-verse-box"),
      ref: document.getElementById("today-verse-box-ref"),
      text: document.getElementById("today-verse-box-text"),
      apply: document.getElementById("today-verse-box-apply")
    },
    inputs: {
      memberName: document.getElementById("member-name-input"),
      memberChurch: document.getElementById("member-church-input"),
      memberPw: document.getElementById("member-password-input"),
      viewChurch: document.getElementById("view-church-input"),
      viewPw: document.getElementById("view-password-input"),
      setupChurch: document.getElementById("setup-church-input"),
      setupPw: document.getElementById("setup-password-input"),
      autoLogin: document.getElementById("auto-login-check") 
    },
    churchList: document.getElementById("church-result-list"),
    churchAnalysisResult: document.getElementById("church-analysis-result"),
    churchCommunityArea: document.getElementById("church-community-area"),
    churchAfterActions: document.getElementById("church-after-actions"),
    churchAuthCard: document.getElementById("church-auth-card"),
    churchMainContent: document.getElementById("church-main-content")
  };

  let currentIndex = 0;
  let questions = [];
  const answers = {};
  let myResultType = null;
  let currentViewType = null;
  let currentChurchMembers = [];
  // 본인 실제 점수/축점수를 보관 (다른 유형 보기 중에도 유지)
  let myScores = null;
  let myAxisScores = null;

  Core.initFontControl(dom);

  /* =========================================
     2. 브라우저 뒤로가기(popstate) 핸들링
     ========================================= */
  window.addEventListener('popstate', (event) => {
    if (!dom.sections.test.classList.contains("hidden")) {
      if (currentIndex > 0) {
        currentIndex--;
        Core.renderQuestion(dom, questions, currentIndex, answers, goNextOrResult);
        history.pushState({ page: "test" }, "", "#test");
      } else {
        dom.sections.test.classList.add("hidden");
        dom.sections.intro.classList.remove("hidden");
        scrollToTop(); 
      }
    } 
    else if (!dom.sections.result.classList.contains("hidden")) {
      dom.sections.result.classList.add("hidden");
      dom.sections.intro.classList.remove("hidden");
      scrollToTop();
    }
    else if (!dom.sections.church.classList.contains("hidden")) {
      dom.sections.church.classList.add("hidden");
      if (myResultType) {
        dom.sections.result.classList.remove("hidden");
      } else {
        dom.sections.intro.classList.remove("hidden");
      }
      scrollToTop();
    }
  });

  /* =========================================
     3. 로직 함수들
     ========================================= */

  // 비동기 처리 중 같은 버튼이 다시 눌려 중복 요청/중복 저장(또는 중복 그룹 생성)이
  // 발생하는 것을 막는 재진입 가드. 외형 변화 없이 처리 완료 전 재실행만 차단한다.
  function runExclusive(btn, fn) {
    if (btn && btn.dataset.busy === "1") return;
    if (btn) btn.dataset.busy = "1";
    Promise.resolve().then(fn).finally(() => { if (btn) btn.dataset.busy = "0"; });
  }

  // 한 번의 입력(합성 클릭, pill·skip 동시 입력 등)으로 여러 문항이 한꺼번에
  // 넘어가는 것을 막는 가드. 다음 매크로태스크에서 풀리므로 일반 클릭 속도엔 영향 없음.
  let isTransitioning = false;

  function goNextOrResult() {
    if (isTransitioning) return;
    isTransitioning = true;
    setTimeout(() => { isTransitioning = false; }, 0);

    if (currentIndex < questions.length - 1) {
      history.pushState({ page: "test" }, "", "#test");
      currentIndex++;
      Core.renderQuestion(dom, questions, currentIndex, answers, goNextOrResult);
    } else {
      dom.sections.test.classList.add("hidden");
      dom.sections.result.classList.remove("hidden");
      scrollToTop(); 
      history.pushState({ page: "result" }, "", "#result");

      const { type, scores, axisScores } = Core.calculateResult(window.originalQuestions, answers);
      const resultData = { type, scores, axisScores, date: new Date().getTime() };
      Utils.storageSet('ftype_result_v1', JSON.stringify(resultData));

      myResultType = type;
      currentViewType = type;
      myScores = scores;
      myAxisScores = axisScores;

      Core.renderResultScreen(dom, type, scores, axisScores);
      buildOtherTypesGrid();
    }
  }

  function buildOtherTypesGrid() {
    if(!dom.result.otherTypes) return;
    if (typeof window.typeResults === 'undefined') return;

    dom.result.otherTypes.innerHTML = "";
    Object.keys(window.typeResults).sort().forEach(t => {
      const btn = document.createElement("button");
      btn.className = "btn-type";
      btn.dataset.type = t;
      btn.innerHTML = `<strong>${t}</strong>`;
      btn.addEventListener("click", () => {
        currentViewType = t;
        // 다른 유형을 볼 때에도 성향 분포/세부 점수는 '내 점수'를 유지한다.
        // 점수 정보가 없는 경우(저장 데이터가 없거나 데모 진입)에만 0으로 표시한다.
        const scoresForView = myScores || { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };
        const axisForView = myAxisScores || { EI:0,SN:0,TF:0,JP:0 };
        Core.renderResultScreen(dom, t, scoresForView, axisForView);
        scrollToTop();
        updateTypeButtonsActive();
      });
      dom.result.otherTypes.appendChild(btn);
    });
    updateTypeButtonsActive();
  }

  function updateTypeButtonsActive() {
    document.querySelectorAll(".btn-type").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === currentViewType);
    });
  }

  function proceedToGroup(cName, cPw) {
    dom.inputs.memberChurch.value = cName;
    dom.inputs.memberPw.value = cPw;
    dom.inputs.viewChurch.value = cName;
    dom.inputs.viewPw.value = cPw;

    if (dom.inputs.autoLogin && dom.inputs.autoLogin.checked) {
      Utils.storageSet('ftype_church_name', cName);
      Utils.storageSet('ftype_church_pw', cPw);
    } else {
      Utils.storageRemove('ftype_church_name');
      Utils.storageRemove('ftype_church_pw');
    }

    dom.churchAuthCard.classList.add("hidden");
    dom.churchMainContent.classList.remove("hidden");
    dom.churchCommunityArea.classList.add("hidden");
    
    scrollToTop(); 
  }

  /* =========================================
     4. 이벤트 리스너 설정
     ========================================= */

  if (dom.btns.groupCreate) {
    dom.btns.groupCreate.addEventListener("click", () => runExclusive(dom.btns.groupCreate, async () => {
      // 띄어쓰기를 구분하기 위해 원본 값을 가져오고 trim은 검증용으로만 씁니다.
      const cName = dom.inputs.setupChurch.value;
      const cPw = dom.inputs.setupPw.value;

      if (!cName.trim() || !cPw.trim()) return alert("그룹명과 비밀번호를 모두 입력해 주세요.");
      if (cName === cPw) return alert("비밀번호를 다르게 입력해주세요.");

      try {
        const created = await Church.createChurchGroup(cName, cPw);
        if (!created) {
          alert("이미 동일한 설정으로 생성된 그룹이 있습니다.\n입장하기를 이용하거나 설정을 바꿔주세요.");
          return;
        }
        alert(`'${cName}' 그룹이 생성되었습니다!`);
        proceedToGroup(cName, cPw);
      } catch (e) { console.error(e); alert("오류: " + e.message); }
    }));
  }

  if (dom.btns.groupLogin) {
    dom.btns.groupLogin.addEventListener("click", () => runExclusive(dom.btns.groupLogin, async () => {
      const cName = dom.inputs.setupChurch.value;
      const cPw = dom.inputs.setupPw.value;
      if (!cName.trim() || !cPw.trim()) return alert("그룹명과 비밀번호를 입력해 주세요.");

      try {
        const ok = await Church.loginChurchGroup(cName, cPw);
        if (!ok) { alert("존재하지 않는 그룹이거나 비밀번호가 틀렸습니다."); return; }
        proceedToGroup(cName, cPw);
      } catch (e) { console.error(e); alert("오류 발생"); }
    }));
  }

  if (dom.btns.groupAuthClose) {
    dom.btns.groupAuthClose.addEventListener("click", () => {
      if (location.hash === "#church") history.back();
      else {
         dom.sections.church.classList.add("hidden");
         if (myResultType) dom.sections.result.classList.remove("hidden");
         else dom.sections.intro.classList.remove("hidden");
         scrollToTop();
      }
    });
  }

  if (dom.btns.start) {
    dom.btns.start.addEventListener("click", () => {
      history.pushState({ page: "test" }, "", "#test");
      Utils.storageRemove('ftype_result_v1');
      if (typeof window.originalQuestions === 'undefined') { alert("데이터 로딩 중..."); return; }
      questions = Utils.shuffle(window.originalQuestions);
      for (let k in answers) delete answers[k];
      currentIndex = 0; myResultType = null; currentViewType = null;
      dom.verse.box.classList.add("hidden");
      dom.bible.box.classList.add("hidden");
      dom.sections.intro.classList.add("hidden");
      dom.sections.test.classList.remove("hidden");
      dom.sections.result.classList.add("hidden");
      scrollToTop(); 
      Core.renderQuestion(dom, questions, currentIndex, answers, goNextOrResult);
    });
  }

  if (dom.btns.back) dom.btns.back.addEventListener("click", () => history.back());
  if (dom.btns.skip) dom.btns.skip.addEventListener("click", goNextOrResult);

  if (dom.btns.restart) {
    dom.btns.restart.addEventListener("click", () => {
      if(confirm("초기화 하시겠습니까?")) {
        Utils.storageRemove('ftype_result_v1');
        myResultType = null; currentViewType = null;
        dom.sections.result.classList.add("hidden");
        dom.sections.intro.classList.remove("hidden");
        scrollToTop(); 
        history.replaceState(null, "", location.pathname);
      }
    });
  }

  if (dom.btns.share) {
    dom.btns.share.addEventListener("click", () => runExclusive(dom.btns.share, async () => {
      const targetType = myResultType || currentViewType;
      if (!targetType) return alert("공유할 유형이 없습니다.");
      const baseUrl = "https://csy870617.github.io/faithmbti2/";
      // 데이터 스크립트가 아직 로드되지 않았어도 공유 자체는 동작하도록 처리
      const data = (typeof window.typeResults !== 'undefined') ? window.typeResults[targetType] : null;
      const shareTitle = "신앙 유형 검사";
      const shareDesc = data ? `나의 유형은 ${targetType} (${data.nameKo}) 입니다.` : `나의 유형은 ${targetType} 입니다.`;

      // 기본공유(OS 네이티브 공유) 우선
      if (navigator.share) { try { await navigator.share({ title: shareTitle, text: shareDesc, url: baseUrl }); return; } catch(e) { if (e && e.name === "AbortError") return; } }
      const success = await Utils.copyToClipboard(`${shareTitle}\n${shareDesc}\n${baseUrl}`);
      alert(success ? "링크가 복사되었습니다." : "실패했습니다.");
    }));
  }

  if (dom.btns.church && dom.sections.church) {
    dom.btns.church.addEventListener("click", () => {
      history.pushState({ page: "church" }, "", "#church");
      dom.sections.intro.classList.add("hidden");
      dom.sections.test.classList.add("hidden");
      dom.sections.result.classList.add("hidden");
      dom.sections.church.classList.remove("hidden");
      scrollToTop(); 
      dom.churchAuthCard.classList.remove("hidden");
      dom.churchMainContent.classList.add("hidden");
    });
  }

  if (dom.btns.churchMainClose) {
    dom.btns.churchMainClose.addEventListener("click", () => {
      if (location.hash === "#church") history.back();
      else {
         dom.sections.church.classList.add("hidden");
         if (myResultType) dom.sections.result.classList.remove("hidden");
         else dom.sections.intro.classList.remove("hidden");
         scrollToTop();
      }
    });
  }

  if (dom.btns.memberSave) {
    dom.btns.memberSave.addEventListener("click", () => runExclusive(dom.btns.memberSave, async () => {
      try {
        // 저장은 반드시 '내 결과'로 수행. (다른 유형을 보는 중이면 본인 결과를 사용)
        const saveType = myResultType || currentViewType;
        await Church.saveMyResultToChurch(
          dom.inputs.memberName.value,
          dom.inputs.memberChurch.value,
          dom.inputs.memberPw.value,
          saveType
        );
        alert("저장되었습니다."); dom.inputs.memberName.value = "";
      } catch (e) { alert(e.message); }
    }));
  }

  if (dom.btns.churchSummary) {
    dom.btns.churchSummary.addEventListener("click", () => runExclusive(dom.btns.churchSummary, async () => {
      if (!dom.churchCommunityArea.classList.contains("hidden")) {
        dom.churchCommunityArea.classList.add("hidden");
        return;
      }
      try {
        const { churchName, members } = await Church.loadChurchMembers(dom.inputs.viewChurch.value, dom.inputs.viewPw.value);
        currentChurchMembers = members;
        dom.churchCommunityArea.classList.remove("hidden");

        Church.renderChurchList(dom, churchName, members, handleMemberDelete);
        if (dom.churchAfterActions) dom.churchAfterActions.classList.remove("hidden");
      } catch (e) {
        alert(e.message);
        dom.churchCommunityArea.classList.add("hidden");
      }
    }));
  }

  // 멤버 삭제 콜백 (재렌더 후에도 동일한 함수 참조를 재사용)
  async function handleMemberDelete(btn) {
    if (btn && btn.dataset.busy === "1") return; // 삭제 처리 중 재클릭 방지
    if (btn) btn.dataset.busy = "1";
    const pw = prompt("비밀번호를 입력해 주세요.");
    if (!pw) { if (btn) btn.dataset.busy = "0"; return; }
    try {
      await Church.deleteChurchMember(btn.dataset.church, pw, btn.dataset.id);
      alert("삭제되었습니다.");
      const refreshed = await Church.loadChurchMembers(btn.dataset.church, pw);
      currentChurchMembers = refreshed.members;
      // 목록을 다시 그리면 이 btn 노드는 사라지므로 busy 플래그를 따로 해제할 필요가 없다.
      Church.renderChurchList(dom, refreshed.churchName, refreshed.members, handleMemberDelete);
    } catch (e) {
      if (btn) btn.dataset.busy = "0"; // 실패 시 동일 버튼으로 재시도 가능하도록 해제
      alert(e.message);
    }
  }

  if (dom.btns.churchAnalysis) {
    dom.btns.churchAnalysis.addEventListener("click", () => {
      Church.analyzeAndRenderCommunity(dom, currentChurchMembers);
    });
  }

  if (dom.btns.inviteBottom) {
    dom.btns.inviteBottom.addEventListener("click", () => runExclusive(dom.btns.inviteBottom, async () => {
      const baseUrl = "https://csy870617.github.io/faithmbti2/";
      const gName = dom.inputs.viewChurch.value || "우리교회";
      // 기본공유(OS 네이티브 공유) 우선
      if (navigator.share) { try { await navigator.share({ title: `${gName} 초대`, text: "함께해요!", url: baseUrl }); return; } catch(e) { if (e && e.name === "AbortError") return; } }
      const success = await Utils.copyToClipboard(`${gName} 초대\n${baseUrl}`);
      alert(success ? "초대 링크가 복사되었습니다." : "복사 실패");
    }));
  }

  if (dom.btns.churchCopy) {
    dom.btns.churchCopy.addEventListener("click", () => runExclusive(dom.btns.churchCopy, async () => {
      const members = currentChurchMembers;
      if (!members || !members.length) return alert("데이터가 없습니다.");
      let body = "";
      members.forEach(m => {
        const tData = (typeof window.typeResults !== 'undefined') ? window.typeResults[m.type] : null;
        body += `이름: ${m.name}\n유형: ${m.type}\n설명: ${tData ? tData.strengthShort : (m.shortText || "")}\n\n`;
      });
      const success = await Utils.copyToClipboard(`우리교회 결과\n\n${body}`);
      alert(success ? "결과가 복사되었습니다." : "복사 실패");
    }));
  }

  if (dom.btns.todayVerse) {
    dom.btns.todayVerse.addEventListener("click", () => {
      const type = currentViewType || myResultType;
      if (!type) return;
      const data = (typeof window.typeResults !== 'undefined') ? window.typeResults[type] : null;
      if (!data) return;
      dom.verse.ref.textContent = data.verseRef;
      dom.verse.text.textContent = data.verseText;
      dom.verse.apply.textContent = data.verseApply || "";
      dom.verse.box.classList.toggle("hidden");
    });
  }
  
  if (dom.btns.bibleToggle) {
    dom.btns.bibleToggle.addEventListener("click", () => {
      const isHidden = dom.bible.box.classList.contains("hidden");
      dom.bible.box.classList.toggle("hidden");
      dom.btns.bibleToggle.textContent = isHidden ? "📖 성경 인물 닫기" : "📖 성경 인물 보기";
    });
  }
  
  if (dom.btns.goResult) {
    dom.btns.goResult.addEventListener("click", () => {
      Utils.storageRemove('ftype_result_v1');
      myResultType = null; currentViewType = "ENFJ";
      dom.sections.intro.classList.add("hidden");
      dom.sections.test.classList.add("hidden");
      dom.sections.result.classList.remove("hidden");
      scrollToTop(); 
      history.pushState({ page: "result" }, "", "#result");
      const sampleScores = { E: 20, I: 5, S: 20, N: 5, T: 20, F: 5, J: 20, P: 5 };
      const sampleAxis = { EI: 15, SN: 15, TF: 15, JP: 15 };
      myScores = sampleScores;
      myAxisScores = sampleAxis;
      Core.renderResultScreen(dom, "ENFJ", sampleScores, sampleAxis);
      buildOtherTypesGrid();
    });
  }

  const savedData = Utils.storageGet('ftype_result_v1');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      // 알 수 없는 유형(손상된 저장 데이터)이면 무시하여 빈 결과 화면 노출 방지
      if (data.type && typeof window.typeResults !== 'undefined' && window.typeResults[data.type]) {
        myResultType = data.type; currentViewType = data.type;
        myScores = data.scores || null;
        myAxisScores = data.axisScores || null;
        dom.sections.intro.classList.add("hidden");
        dom.sections.test.classList.add("hidden");
        dom.sections.result.classList.remove("hidden");
        scrollToTop();
        if (location.hash !== "#result") history.replaceState({ page: "result" }, "", "#result");
        Core.renderResultScreen(dom, data.type, data.scores, data.axisScores);
        buildOtherTypesGrid();
      }
    } catch (e) { Utils.storageRemove('ftype_result_v1'); }
  }

  const savedChurch = Utils.storageGet('ftype_church_name');
  const savedPw = Utils.storageGet('ftype_church_pw');
  if (savedChurch && savedPw) {
    if (dom.inputs.setupChurch) dom.inputs.setupChurch.value = savedChurch;
    if (dom.inputs.setupPw) dom.inputs.setupPw.value = savedPw;
    if (dom.inputs.autoLogin) dom.inputs.autoLogin.checked = true;
  }
});