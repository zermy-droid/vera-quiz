const FALLBACK_QUESTIONS = [
  { id:1, question:"What is the primary function of the mitochondria?", options:["Protein synthesis","ATP production","DNA replication","Lipid storage"], correct:1 },
  { id:2, question:"Which enzyme is responsible for unwinding DNA during replication?", options:["DNA polymerase","Ligase","Helicase","Primase"], correct:2 },
  { id:3, question:"What is the main product of the Calvin cycle?", options:["Glucose","ATP","NADPH","Oxygen"], correct:0 },
  { id:4, question:"Which of the following is a noble gas?", options:["Oxygen","Nitrogen","Argon","Chlorine"], correct:2 },
  { id:5, question:"What type of bond holds complementary DNA strands together?", options:["Ionic bond","Covalent bond","Hydrogen bond","Peptide bond"], correct:2 },
  { id:6, question:"Which organelle modifies, sorts, and packages proteins?", options:["Ribosome","Golgi apparatus","Lysosome","Endoplasmic reticulum"], correct:1 },
  { id:7, question:"What is the pH of a neutral solution at 25°C?", options:["1","5","7","14"], correct:2 },
  { id:8, question:"Which vitamin is synthesized by the skin when exposed to sunlight?", options:["Vitamin A","Vitamin C","Vitamin D","Vitamin B12"], correct:2 },
  { id:9, question:"In which phase of mitosis do chromosomes align at the equator?", options:["Prophase","Metaphase","Anaphase","Telophase"], correct:1 },
  { id:10, question:"What is the molecular formula of glucose?", options:["C6H12O6","C12H22O11","C6H12O2","CH4"], correct:0 },
  { id:11, question:"Which element is the most abundant in the Earth's crust?", options:["Iron","Oxygen","Silicon","Aluminum"], correct:1 },
  { id:12, question:"What type of RNA carries amino acids to the ribosome?", options:["mRNA","rRNA","tRNA","snRNA"], correct:2 },
  { id:13, question:"Which of the following is an example of a polysaccharide?", options:["Glucose","Sucrose","Cellulose","Maltose"], correct:2 },
  { id:14, question:"What is the main function of red blood cells?", options:["Fight infection","Transport oxygen","Clot blood","Produce antibodies"], correct:1 },
  { id:15, question:"What is the charge of a neutron?", options:["Positive","Negative","Neutral","Variable"], correct:2 },
  { id:16, question:"Which gas is produced during photosynthesis?", options:["Carbon dioxide","Oxygen","Nitrogen","Hydrogen"], correct:1 },
  { id:17, question:"What structure surrounds the cell membrane in plant cells?", options:["Cytoskeleton","Cell wall","Capsule","Flagellum"], correct:1 },
  { id:18, question:"What is the smallest unit of life?", options:["Atom","Molecule","Cell","Tissue"], correct:2 },
  { id:19, question:"Which of the following is a strong acid?", options:["Acetic acid","Hydrochloric acid","Citric acid","Carbonic acid"], correct:1 },
  { id:20, question:"What is the primary pigment involved in photosynthesis?", options:["Carotene","Xanthophyll","Chlorophyll","Phycobilin"], correct:2 },
];

function loadQuestionsFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("q");
    if (encoded) {
      const json = atob(decodeURIComponent(encoded));
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
    }
  } catch {}
  return null;
}

let QUESTIONS = loadQuestionsFromUrl() || FALLBACK_QUESTIONS;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D"];
const QUIZ_LENGTH = 8;

const STATE = {
  allQuestions: [],
  currentIndex: 0,
  answers: {},
  timerInterval: null,
  timeRemaining: 300,
};

const $ = (id) => document.getElementById(id);
const startScreen = $("startScreen");
const quizScreen = $("quizScreen");
const confirmScreen = $("confirmScreen");
const thanksScreen = $("thanksScreen");
const questionNum = $("questionNum");
const timerDisplay = $("timerDisplay");
const questionText = $("questionText");
const optionsContainer = $("optionsContainer");
const progressDots = $("progressDots");
const nextBtn = $("nextBtn");
const submitBtn = $("submitBtn");
const startQuizBtn = $("startQuizBtn");
const confirmSubmitBtn = $("confirmSubmitBtn");
const cancelSubmitBtn = $("cancelSubmitBtn");

function showScreen(screen) {
  [startScreen, quizScreen, confirmScreen, thanksScreen].forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function renderQuestion(index) {
  const q = STATE.allQuestions[index];
  questionNum.textContent = `Question ${index + 1} of ${QUIZ_LENGTH}`;
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.index = i;
    if (STATE.answers[q.id] === i) btn.classList.add("selected");
    const letterSpan = document.createElement("span");
    letterSpan.className = "option-letter";
    letterSpan.textContent = LETTERS[i];
    const textSpan = document.createElement("span");
    textSpan.textContent = opt;
    btn.appendChild(letterSpan);
    btn.appendChild(textSpan);
    btn.addEventListener("click", () => selectOption(q.id, i));
    optionsContainer.appendChild(btn);
  });
  renderDots(index);
  updateFooter(index);
}

function selectOption(qId, optIndex) {
  STATE.answers[qId] = optIndex;
  document.querySelectorAll(".option-btn").forEach((btn, i) => btn.classList.toggle("selected", i === optIndex));
  renderDots(STATE.currentIndex);
  updateFooter(STATE.currentIndex);
}

function renderDots(current) {
  progressDots.innerHTML = "";
  for (let i = 0; i < QUIZ_LENGTH; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    if (STATE.answers[STATE.allQuestions[i].id] !== undefined) dot.classList.add("answered");
    if (i === current) dot.classList.add("current");
    progressDots.appendChild(dot);
  }
}

function updateFooter(index) {
  const isLast = index === QUIZ_LENGTH - 1;
  nextBtn.classList.toggle("hidden", isLast);
  submitBtn.classList.toggle("hidden", !isLast);
  const allAnswered = STATE.allQuestions.every(q => STATE.answers[q.id] !== undefined);
  submitBtn.disabled = !allAnswered;
  submitBtn.style.opacity = allAnswered ? "1" : "0.5";
}

function startTimer() {
  STATE.timeRemaining = 300;
  updateTimerDisplay();
  STATE.timerInterval = setInterval(() => {
    STATE.timeRemaining--;
    updateTimerDisplay();
    if (STATE.timeRemaining <= 0) { clearInterval(STATE.timerInterval); handleSubmit(); }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(STATE.timeRemaining / 60);
  const s = STATE.timeRemaining % 60;
  timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  timerDisplay.style.color = STATE.timeRemaining <= 60 ? "#d63031" : "";
}

function handleSubmit() {
  clearInterval(STATE.timerInterval);
  showScreen(thanksScreen);
}

function goToNext() {
  if (STATE.currentIndex < QUIZ_LENGTH - 1) { STATE.currentIndex++; renderQuestion(STATE.currentIndex); }
}

startQuizBtn.addEventListener("click", () => {
  QUESTIONS = loadQuestionsFromUrl() || QUESTIONS;
  STATE.allQuestions = shuffle(QUESTIONS).slice(0, QUIZ_LENGTH);
  STATE.answers = {};
  STATE.currentIndex = 0;
  showScreen(quizScreen);
  renderQuestion(0);
  startTimer();
});

nextBtn.addEventListener("click", goToNext);
submitBtn.addEventListener("click", () => showScreen(confirmScreen));
confirmSubmitBtn.addEventListener("click", handleSubmit);
cancelSubmitBtn.addEventListener("click", () => showScreen(quizScreen));
