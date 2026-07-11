(() => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  if (!q) { show("errorScreen"); return; }

  let questions = null;
  try {
    const text = decodeURIComponent(escape(atob(q)));
    questions = text.split(";").filter(s => s.trim()).map(s => {
      const [idQ, opts, cor] = s.split("|");
      const colon = idQ.indexOf(":");
      return { id: parseInt(idQ.slice(0, colon)), question: idQ.slice(colon + 1), options: opts.split(","), correct: parseInt(cor) };
    });
  } catch {}

  if (!questions || questions.length < 4) { show("errorScreen"); return; }

  const LETTERS = ["A", "B", "C", "D"];
  const TIME = 300;

  const startScreen = document.getElementById("startScreen");
  const quizScreen = document.getElementById("quizScreen");
  const doneScreen = document.getElementById("doneScreen");
  const qNum = document.getElementById("qNum");
  const timerEl = document.getElementById("timer");
  const qText = document.getElementById("qText");
  const optsEl = document.getElementById("opts");
  const dotsEl = document.getElementById("dots");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  let cur = 0, answers = {}, timeLeft = TIME, interval;

  document.getElementById("startBtn").addEventListener("click", () => {
    show("quizScreen");
    render();
    startTimer();
  });

  nextBtn.addEventListener("click", () => {
    if (cur < questions.length - 1) { cur++; render(); }
  });

  submitBtn.addEventListener("click", () => {
    clearInterval(interval);
    show("doneScreen");
  });

  function show(id) {
    [startScreen, quizScreen, doneScreen, document.getElementById("errorScreen")].forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  function render() {
    const q = questions[cur];
    qNum.textContent = "Question " + (cur + 1) + " of " + questions.length;
    qText.textContent = q.question;
    optsEl.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option" + (answers[q.id] === i ? " selected" : "");
      btn.innerHTML = '<span class="letter">' + LETTERS[i] + '</span><span>' + opt + '</span>';
      btn.addEventListener("click", () => { answers[q.id] = i; render(); });
      optsEl.appendChild(btn);
    });
    renderDots();
    const last = cur === questions.length - 1;
    nextBtn.classList.toggle("hidden", last);
    submitBtn.classList.toggle("hidden", !last);
    submitBtn.disabled = !questions.every(q => answers[q.id] !== undefined);
    submitBtn.style.opacity = submitBtn.disabled ? "0.5" : "1";
  }

  function renderDots() {
    dotsEl.innerHTML = "";
    questions.forEach((q, i) => {
      const d = document.createElement("span");
      d.className = "dot" + (answers[q.id] !== undefined ? " done" : "") + (i === cur ? " now" : "");
      dotsEl.appendChild(d);
    });
  }

  function startTimer() {
    timeLeft = TIME;
    updateTimer();
    interval = setInterval(() => { timeLeft--; updateTimer(); if (timeLeft <= 0) { clearInterval(interval); submitBtn.click(); } }, 1000);
  }

  function updateTimer() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    timerEl.classList.toggle("danger", timeLeft <= 60);
  }
})();
