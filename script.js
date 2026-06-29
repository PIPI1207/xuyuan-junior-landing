const questions = [
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

const stateKey = "xuyuan-junior-quiz-state";
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
const leadForm = document.querySelector("#leadForm");
const submitLead = document.querySelector("#submitLead");
const successCard = document.querySelector("#successCard");
const analysisLock = document.querySelector("#analysisLock");

function loadQuizState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey));
    if (saved && Number.isInteger(saved.index) && Array.isArray(saved.answers)) {
      return {
        index: Math.min(Math.max(saved.index, 0), questions.length - 1),
        answers: saved.answers
      };
    }
  } catch (_error) {
    localStorage.removeItem(stateKey);
  }

  return { index: 0, answers: [] };
}

function saveQuizState() {
  localStorage.setItem(stateKey, JSON.stringify(quizState));
}

function renderQuestion() {
  const current = questions[quizState.index];
  const currentNumber = quizState.index + 1;
  const progress = Math.round((currentNumber / questions.length) * 100);

  questionText.textContent = current.text;
  quizCounter.textContent = `第${currentNumber}題 / 共10題`;
  quizSubject.textContent = current.subject;
  quizProgress.value = progress;
  quizProgress.textContent = `${progress}%`;
  progressText.textContent = `${progress}%`;
  prevQuestion.disabled = quizState.index === 0;
  nextQuestion.textContent = quizState.index === questions.length - 1 ? "送出並查看分析" : "下一題";

  optionsEl.innerHTML = "";
  current.options.forEach((option, optionIndex) => {
    const id = `question-${quizState.index}-option-${optionIndex}`;
    const label = document.createElement("label");
    label.className = "option";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.id = id;
    input.value = option;
    input.checked = quizState.answers[quizState.index] === option;
    input.addEventListener("change", () => {
      quizState.answers[quizState.index] = option;
      saveQuizState();
    });

    const span = document.createElement("span");
    span.textContent = option;
    label.append(input, span);
    optionsEl.append(label);
  });
}

function goToQuestion(direction) {
  if (direction > 0 && !quizState.answers[quizState.index]) {
    const firstOption = optionsEl.querySelector(".option");
    firstOption.classList.add("field-error");
    setTimeout(() => firstOption.classList.remove("field-error"), 700);
    return;
  }

  if (quizState.index === questions.length - 1 && direction > 0) {
    unlockAnalysis();
    document.querySelector("#analysis-section").scrollIntoView({ behavior: "smooth" });
    return;
  }

  quizState.index = Math.min(Math.max(quizState.index + direction, 0), questions.length - 1);
  saveQuizState();
  renderQuestion();
}

function unlockAnalysis() {
  analysisLock.classList.add("is-unlocked");
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

function submitLeadForm(event) {
  event.preventDefault();

  if (!validateForm(leadForm)) return;

  Array.from(leadForm.elements).forEach((field) => {
    if ("disabled" in field) field.disabled = true;
  });

  submitLead.textContent = "已送出";
  submitLead.classList.add("is-sent");
  successCard.hidden = false;
  unlockAnalysis();
  successCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setupScrollButtons() {
  document.querySelectorAll(".js-scroll").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
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
renderQuestion();
