const allQuestions = [
  {
    subject: "數學",
    text: "若函數 y = ax² + bx - 3 的圖形通過點 (1,0) 與 (3,0)，則下列何者正確？",
    options: ["a + b = 3", "a - b = 3", "2a + b = 0", "2a - b = 0"]
  },
  {
    subject: "自然",
    text: "下列哪一項最能說明水溶液是否具有導電性？",
    options: ["是否透明", "是否含有可移動離子", "顏色深淺", "溫度是否低於室溫"]
  },
  {
    subject: "數學",
    text: "已知三角形兩邊長分別為 5 與 8，第三邊可能為下列何者？",
    options: ["2", "3", "7", "14"]
  },
  {
    subject: "自然",
    text: "植物行光合作用時，主要吸收下列哪一種氣體？",
    options: ["氧氣", "二氧化碳", "氮氣", "水蒸氣"]
  },
  {
    subject: "數學",
    text: "若 x 與 y 成正比，且 x = 4 時 y = 12，則 x = 7 時 y 為多少？",
    options: ["15", "18", "21", "24"]
  },
  {
    subject: "自然",
    text: "聲音在下列何種介質中通常傳播最快？",
    options: ["空氣", "水", "鋼鐵", "真空"]
  },
  {
    subject: "數學",
    text: "一組資料為 4、6、7、8、10，其中位數為多少？",
    options: ["6", "7", "8", "10"]
  },
  {
    subject: "自然",
    text: "下列哪一種現象最適合用慣性解釋？",
    options: ["影子變長", "煞車時身體向前傾", "鹽溶於水", "鐵生鏽"]
  },
  {
    subject: "數學",
    text: "若 3x - 5 = 16，則 x 的值為多少？",
    options: ["5", "6", "7", "8"]
  },
  {
    subject: "自然",
    text: "電路中若燈泡並聯，增加一顆燈泡後，下列敘述何者較合理？",
    options: ["所有燈泡都必定熄滅", "每顆燈泡仍可各自形成通路", "總電流必定變為零", "電池不再提供能量"]
  }
];

const stateKey = "xuyuan-junior-quiz-state-v3";
const leadPostEndpoint = "https://docs.google.com/spreadsheets/d/1VAUzWG4O6FF6liKJd_h_GZItTSeUQXRIdesS3ziK-3M/edit?usp=sharing";
let quizState = loadQuizState();
let reviewIndex = 0;

const questionText = document.querySelector("#questionText");
const optionsEl = document.querySelector("#options");
const quizCounter = document.querySelector("#quizCounter");
const quizSubject = document.querySelector("#quizSubject");
const quizProgress = document.querySelector("#quizProgress");
const progressText = document.querySelector("#progressText");
const prevQuestion = document.querySelector("#prevQuestion");
const nextQuestion = document.querySelector("#nextQuestion");
const subjectTabs = Array.from(document.querySelectorAll(".subject-tabs .subject"));
const leadForm = document.querySelector("#leadForm");
const submitLead = document.querySelector("#submitLead");
const successCard = document.querySelector("#successCard");
const analysisLock = document.querySelector("#analysisLock");
const analysisEyebrow = document.querySelector("#analysisEyebrow");
const analysisTitle = document.querySelector("#analysis-title");
const analysisPrompt = document.querySelector("#analysisPrompt");
const analysisPendingCopy = document.querySelector("#analysisPendingCopy");
const teacherCardTitle = document.querySelector("#teacherCardTitle");
const teacherIntro = document.querySelector("#teacherIntro");

function createInitialState() {
  return {
    filter: "all",
    indexByFilter: {
      all: 0,
      數學: 0,
      自然: 0
    },
    answersByFilter: {
      all: {},
      數學: {},
      自然: {}
    },
    completedFilters: []
  };
}

function loadQuizState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey));
    if (saved && saved.indexByFilter && saved.answersByFilter) {
      return {
        ...createInitialState(),
        ...saved
      };
    }
  } catch (_error) {
    localStorage.removeItem(stateKey);
  }

  return createInitialState();
}

function saveQuizState() {
  localStorage.setItem(stateKey, JSON.stringify(quizState));
}

function getQuestions() {
  if (quizState.filter === "all") return allQuestions;
  return allQuestions.filter((question) => question.subject === quizState.filter);
}

function getCurrentIndex() {
  const questions = getQuestions();
  const savedIndex = quizState.indexByFilter[quizState.filter] || 0;
  return Math.min(Math.max(savedIndex, 0), Math.max(questions.length - 1, 0));
}

function getAnswerKey(index) {
  const question = getQuestions()[index];
  return quizState.filter === "all" ? String(allQuestions.indexOf(question)) : String(index);
}

function getCurrentAnswers() {
  return quizState.answersByFilter[quizState.filter] || {};
}

function isCurrentQuizComplete() {
  const questions = getQuestions();
  const answers = getCurrentAnswers();
  return questions.length > 0 && questions.every((_question, index) => answers[getAnswerKey(index)]);
}

function updateAnalysisState(forceComplete = false) {
  const completed = forceComplete || quizState.completedFilters.length > 0;
  document.querySelector("#analysis-section")?.classList.toggle("is-complete", completed);

  if (completed) {
    analysisEyebrow.textContent = "初步分析完成";
    analysisTitle.textContent = "孩子目前較需要加強：";
    analysisPendingCopy.hidden = true;
    analysisPrompt.hidden = true;
    teacherCardTitle.textContent = "初步分析完成";
    teacherIntro.hidden = false;
    analysisLock.classList.add("is-unlocked");
    return;
  }

  analysisEyebrow.textContent = "尚未完成測驗";
  analysisTitle.textContent = "完成測驗後解鎖初步分析";
  analysisPendingCopy.hidden = false;
  analysisPrompt.hidden = false;
  teacherCardTitle.textContent = "尚未完成測驗";
  teacherIntro.hidden = true;
  analysisLock.classList.remove("is-unlocked");
}

function renderQuestion() {
  const questions = getQuestions();
  const currentIndex = getCurrentIndex();
  const current = questions[currentIndex];
  const currentNumber = currentIndex + 1;
  const progress = Math.round((currentNumber / questions.length) * 100);
  const answers = getCurrentAnswers();

  quizState.indexByFilter[quizState.filter] = currentIndex;
  questionText.textContent = current.text;
  quizCounter.textContent = `第${currentNumber}題 / 共${questions.length}題`;
  quizSubject.textContent = quizState.filter === "all" ? current.subject : quizState.filter;
  quizProgress.value = progress;
  quizProgress.textContent = `${progress}%`;
  progressText.textContent = `${progress}%`;
  prevQuestion.disabled = currentIndex === 0;
  nextQuestion.textContent = currentIndex === questions.length - 1 ? "送出並查看分析" : "下一題";

  optionsEl.innerHTML = "";
  current.options.forEach((option, optionIndex) => {
    const id = `question-${quizState.filter}-${currentIndex}-option-${optionIndex}`;
    const label = document.createElement("label");
    label.className = "option";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.id = id;
    input.value = option;
    input.checked = answers[getAnswerKey(currentIndex)] === option;
    input.addEventListener("change", () => {
      quizState.answersByFilter[quizState.filter][getAnswerKey(currentIndex)] = option;
      saveQuizState();
    });

    const span = document.createElement("span");
    span.textContent = option;
    label.append(input, span);
    optionsEl.append(label);
  });

  updateAnalysisState();
}

function setSubjectFilter(filter) {
  quizState.filter = filter;
  subjectTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });
  saveQuizState();
  renderQuestion();
}

function goToQuestion(direction) {
  const questions = getQuestions();
  const currentIndex = getCurrentIndex();
  const answers = getCurrentAnswers();

  if (direction > 0 && !answers[getAnswerKey(currentIndex)]) {
    const firstOption = optionsEl.querySelector(".option");
    firstOption.classList.add("field-error");
    setTimeout(() => firstOption.classList.remove("field-error"), 700);
    return;
  }

  if (currentIndex === questions.length - 1 && direction > 0) {
    if (!quizState.completedFilters.includes(quizState.filter)) {
      quizState.completedFilters.push(quizState.filter);
    }
    saveQuizState();
    updateAnalysisState(true);
    document.querySelector("#analysis-section").scrollIntoView({ behavior: "smooth" });
    return;
  }

  quizState.indexByFilter[quizState.filter] = Math.min(Math.max(currentIndex + direction, 0), questions.length - 1);
  saveQuizState();
  renderQuestion();
}

function collectLeadPayload() {
  const formData = new FormData(leadForm);
  const payload = {
    submittedAt: new Date().toISOString(),
    quizMode: quizState.filter,
    quizCompleted: isCurrentQuizComplete(),
    answers: quizState.answersByFilter,
    completedFilters: quizState.completedFilters
  };

  formData.forEach((value, key) => {
    payload[key] = value;
  });

  return payload;
}

async function postLeadPayload(payload) {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    body.append(key, typeof value === "string" ? value : JSON.stringify(value));
  });

  await fetch(leadPostEndpoint, {
    method: "POST",
    mode: "no-cors",
    body
  });
}

function validateForm(form) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^09\d{8}$/;
  let valid = true;

  Array.from(form.elements).forEach((field) => {
    if (!field.name) return;
    const label = field.closest("label");
    label.classList.remove("field-error");

    const empty = !field.value.trim();
    const badEmail = field.name === "email" && !emailPattern.test(field.value.trim());
    const badPhone = field.name === "phone" && !phonePattern.test(field.value.trim());
    if (empty || badEmail || badPhone) {
      label.classList.add("field-error");
      valid = false;
    }
  });

  return valid;
}

async function submitLeadForm(event) {
  event.preventDefault();

  if (!validateForm(leadForm)) return;

  submitLead.disabled = true;
  submitLead.textContent = "送出中...";

  try {
    await postLeadPayload(collectLeadPayload());
    Array.from(leadForm.elements).forEach((field) => {
      if ("disabled" in field) field.disabled = true;
    });

    submitLead.textContent = "已送出";
    submitLead.classList.add("is-sent");
    successCard.hidden = false;
    updateAnalysisState(true);
    successCard.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (_error) {
    submitLead.disabled = false;
    submitLead.textContent = "送出失敗，請再試一次";
  }
}

function setupScrollButtons() {
  document.querySelectorAll(".js-scroll").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function setupSubjectTabs() {
  subjectTabs.forEach((button) => {
    button.addEventListener("click", () => setSubjectFilter(button.dataset.filter || "all"));
  });
  setSubjectFilter(quizState.filter || "all");
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function setupBookTabs() {
  document.querySelectorAll(".book-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".book-tab").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");

      const selected = button.dataset.book;
      document.querySelectorAll("#booksRow img").forEach((img) => {
        const active = img.src.includes(selected);
        img.classList.toggle("selected-book", active);
      });
    });
  });
}

function renderTestimonials() {
  const items = Array.from(document.querySelectorAll(".testimonial"));
  if (window.matchMedia("(max-width: 720px)").matches) {
    items.forEach((item, index) => item.classList.toggle("is-visible", index === reviewIndex));
  } else {
    items.forEach((item) => item.classList.add("is-visible"));
  }
}

function setupTestimonials() {
  document.querySelector("#prevReview").addEventListener("click", () => {
    reviewIndex = (reviewIndex + 2) % 3;
    renderTestimonials();
  });
  document.querySelector("#nextReview").addEventListener("click", () => {
    reviewIndex = (reviewIndex + 1) % 3;
    renderTestimonials();
  });
  window.addEventListener("resize", renderTestimonials);
  renderTestimonials();
}

prevQuestion.addEventListener("click", () => goToQuestion(-1));
nextQuestion.addEventListener("click", () => goToQuestion(1));
leadForm.addEventListener("submit", submitLeadForm);
leadForm.addEventListener("input", (event) => {
  const label = event.target.closest("label");
  if (label) label.classList.remove("field-error");
});

setupScrollButtons();
setupReveal();
setupBookTabs();
setupTestimonials();
setupSubjectTabs();
