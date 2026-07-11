/* ==========================================================
   Vera — Anonymous Classroom Quiz Tool
   ========================================================== */

/* ---------- Detect student vs teacher view ---------- */
const params = new URLSearchParams(window.location.search);
const quizParam = params.get("q");

if (quizParam) {
  document.getElementById("teacherView").classList.add("hidden");
  document.getElementById("studentView").classList.remove("hidden");
  initStudent();
} else {
  initTeacher();
}

/* ==========================================================
   TEACHER VIEW
   ========================================================== */
function initTeacher() {
  const slideText = document.getElementById("slideText");
  const generateBtn = document.getElementById("generateBtn");
  const status = document.getElementById("status");
  const qrSection = document.getElementById("qrSection");
  const qrImage = document.getElementById("qrImage");
  const quizCode = document.getElementById("quizCode");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const questionPreview = document.getElementById("questionPreview");
  const questionList = document.getElementById("questionList");

  let currentQuizUrl = "";

  generateBtn.addEventListener("click", () => {
    const text = slideText.value.trim();
    if (text.length < 30) {
      showStatus("error", "Paste at least 30 characters of slide text.");
      return;
    }

    showStatus("loading", "Generating questions...");
    generateBtn.disabled = true;

    setTimeout(() => {
      try {
        const all = buildQuestions(text);
        if (all.length < 4) {
          showStatus("error", "Not enough content to generate questions. Try pasting more text.");
          generateBtn.disabled = false;
          return;
        }

        const picked = shuffle(all).slice(0, 8).map((q, i) => ({
          id: i + 1,
          question: q.question.length > 60 ? q.question.slice(0, 57) + "..." : q.question,
          options: q.options.map(o => o.length > 18 ? o.slice(0, 15) + "..." : o),
          correct: q.correct
        }));

        const encoded = encodeCompact(picked);
        const baseUrl = window.location.origin + window.location.pathname;
        currentQuizUrl = baseUrl + "?q=" + encoded;

        showQrCode(qrImage, currentQuizUrl);
        quizCode.textContent = "Quiz: " + picked.length + " questions";
        qrSection.classList.remove("hidden");

        questionList.innerHTML = "";
        picked.forEach(q => {
          const li = document.createElement("li");
          li.textContent = q.question;
          questionList.appendChild(li);
        });
        questionPreview.classList.remove("hidden");

        showStatus("success", "Quiz ready! Show the QR code to your students.");
      } catch (e) {
        console.error(e);
        showStatus("error", "Something went wrong. Try pasting different text.");
      }
      generateBtn.disabled = false;
    }, 100);
  });

  copyLinkBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentQuizUrl).then(() => {
      copyLinkBtn.textContent = "Copied!";
      setTimeout(() => copyLinkBtn.textContent = "Copy Quiz Link", 2000);
    });
  });
}

function showStatus(type, msg) {
  const el = document.getElementById("status");
  el.className = "status " + type;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function showQrCode(img, url) {
  try {
    const qr = qrcode(0, "L");
    qr.addData(url);
    qr.make();
    img.src = qr.createDataURL(8, 20);
  } catch (e) {
    console.error("QR error:", e);
    img.alt = "QR code too large";
  }
}

/* ==========================================================
   COMPACT ENCODING
   ========================================================== */
function encodeCompact(questions) {
  const compact = questions.map(q =>
    q.id + ":" + q.question + "|" + q.options.join(",") + "|" + q.correct
  ).join(";");
  return btoa(unescape(encodeURIComponent(compact)));
}

function decodeCompact(str) {
  try {
    const text = decodeURIComponent(escape(atob(str)));
    return text.split(";").filter(s => s.trim()).map(q => {
      const [idQ, opts, cor] = q.split("|");
      const colon = idQ.indexOf(":");
      return {
        id: parseInt(idQ.slice(0, colon)),
        question: idQ.slice(colon + 1),
        options: opts.split(","),
        correct: parseInt(cor)
      };
    });
  } catch {
    return null;
  }
}

/* ==========================================================
   QUESTION GENERATOR
   ========================================================== */
function buildQuestions(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  const terms = extractTerms(cleaned);
  const questions = [];
  const used = new Set();

  for (const s of sentences) {
    if (questions.length >= 20) break;
    if (s.length < 25 || s.length > 300 || used.has(s)) continue;
    const term = findTerm(s, terms, questions);
    if (!term) continue;
    const stem = s.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "________");
    if (stem === s) continue;
    const distractors = shuffle(terms.filter(t => t.toLowerCase() !== term.toLowerCase() && t.length > 2)).slice(0, 3);
    if (distractors.length < 3) continue;
    const opts = shuffle([term, ...distractors]);
    questions.push({
      id: questions.length + 1,
      question: stem.charAt(0).toUpperCase() + stem.slice(1),
      options: opts,
      correct: opts.indexOf(term)
    });
    used.add(s);
  }

  if (questions.length < 20) {
    const usedTerms = new Set(questions.map(q => q.options[q.correct]));
    for (const t of terms) {
      if (questions.length >= 20) break;
      if (usedTerms.has(t)) continue;
      const d = shuffle(terms.filter(x => x !== t && x.length > 2)).slice(0, 3);
      if (d.length < 3) continue;
      const opts = shuffle([t, ...d]);
      questions.push({
        id: questions.length + 1,
        question: "Which of the following best describes \"" + t + "\"?",
        options: opts,
        correct: opts.indexOf(t)
      });
      usedTerms.add(t);
    }
  }

  return questions.slice(0, 20);
}

function extractTerms(text) {
  const freq = {};
  text.split(/\s+/).filter(w => w.length > 3).forEach(w => {
    const c = w.replace(/[^a-zA-Z0-9\-]/g, "");
    if (c.length > 3 && !/^\d+$/.test(c)) freq[c] = (freq[c] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([w]) => w);
}

function findTerm(sentence, terms, existing) {
  const used = new Set(existing.map(q => q.options[q.correct]));
  const found = terms.filter(t => sentence.toLowerCase().includes(t.toLowerCase()) && !used.has(t));
  if (found.length) { found.sort((a, b) => b.length - a.length); return found[0]; }
  return null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==========================================================
   STUDENT VIEW
   ========================================================== */
function initStudent() {
  let questions = null;

  try {
    questions = decodeCompact(quizParam);
  } catch {}

  if (!questions || questions.length < 4) {
    document.getElementById("startScreen").innerHTML =
      '<h2>Invalid quiz link</h2><p>Ask your teacher for a new QR code.</p>';
    return;
  }

  const LETTERS = ["A", "B", "C", "D"];
  const TIME_LIMIT = 300;

  const startScreen = document.getElementById("startScreen");
  const quizScreen = document.getElementById("quizScreen");
  const doneScreen = document.getElementById("doneScreen");
  const startBtn = document.getElementById("startBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const questionNum = document.getElementById("questionNum");
  const timerEl = document.getElementById("timer");
  const questionText = document.getElementById("questionText");
  const optionsEl = document.getElementById("options");
  const dotsEl = document.getElementById("dots");

  let current = 0;
  let answers = {};
  let timeLeft = TIME_LIMIT;
  let interval = null;

  function showScreen(s) {
    [startScreen, quizScreen, doneScreen].forEach(el => el.classList.add("hidden"));
    s.classList.remove("hidden");
  }

  function render() {
    const q = questions[current];
    questionNum.textContent = "Question " + (current + 1) + " of " + questions.length;
    questionText.textContent = q.question;
    optionsEl.innerHTML = "";

    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn" + (answers[q.id] === i ? " selected" : "");
      btn.innerHTML =
        '<span class="option-letter">' + LETTERS[i] + '</span>' +
        '<span>' + opt + '</span>';
      btn.addEventListener("click", () => {
        answers[q.id] = i;
        render();
      });
      optionsEl.appendChild(btn);
    });

    renderDots();

    const isLast = current === questions.length - 1;
    nextBtn.classList.toggle("hidden", isLast);
    submitBtn.classList.toggle("hidden", !isLast);

    const allAnswered = questions.every(q => answers[q.id] !== undefined);
    submitBtn.disabled = !allAnswered;
    submitBtn.style.opacity = allAnswered ? "1" : "0.5";
  }

  function renderDots() {
    dotsEl.innerHTML = "";
    questions.forEach((q, i) => {
      const dot = document.createElement("span");
      dot.className = "dot";
      if (answers[q.id] !== undefined) dot.classList.add("answered");
      if (i === current) dot.classList.add("current");
      dotsEl.appendChild(dot);
    });
  }

  function startTimer() {
    timeLeft = TIME_LIMIT;
    updateTimer();
    interval = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        clearInterval(interval);
        submit();
      }
    }, 1000);
  }

  function updateTimer() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    timerEl.classList.toggle("danger", timeLeft <= 60);
  }

  function submit() {
    clearInterval(interval);
    showScreen(doneScreen);
  }

  startBtn.addEventListener("click", () => {
    showScreen(quizScreen);
    render();
    startTimer();
  });

  nextBtn.addEventListener("click", () => {
    if (current < questions.length - 1) {
      current++;
      render();
    }
  });

  submitBtn.addEventListener("click", () => submit());
}
