(() => {
  "use strict";

  const questionForm = document.querySelector("#question-form");
  const titleInput = document.querySelector("#quiz-title");
  const teacherInput = document.querySelector("#teacher-name");
  const questionInput = document.querySelector("#question-text");
  const optionInputs = Array.from(document.querySelectorAll(".option-input"));
  const correctInputs = Array.from(document.querySelectorAll(".correct-radio"));
  const questionList = document.querySelector("#question-list");
  const questionCount = document.querySelector("#question-count");
  const countBadge = document.querySelector("#count-badge");
  const emptyState = document.querySelector("#empty-state");
  const feedback = document.querySelector("#question-feedback");
  const downloadButton = document.querySelector("#download-quiz");
  const questions = [];

  questionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    feedback.textContent = "";

    const question = questionInput.value.trim();
    const options = optionInputs.map((input) => input.value.trim());
    const correctAnswer = correctInputs.findIndex((input) => input.checked);

    if (!question) {
      feedback.textContent = "Please enter a question.";
      questionInput.focus();
      return;
    }
    if (options.some((option) => !option)) {
      feedback.textContent = "Please fill in all four answer choices.";
      optionInputs[options.findIndex((option) => !option)].focus();
      return;
    }
    if (correctAnswer < 0) {
      feedback.textContent = "Please select the correct answer.";
      correctInputs[0].focus();
      return;
    }

    questions.push({ question, options, answer: correctAnswer });
    renderQuestions();
    questionForm.reset();
    questionInput.focus();
  });

  function renderQuestions() {
    questionList.replaceChildren();
    emptyState.hidden = questions.length > 0;
    questionCount.textContent = questions.length === 1
      ? "1 question ready to go"
      : `${questions.length} questions ready to go`;
    countBadge.textContent = String(questions.length);
    countBadge.setAttribute("aria-label", `${questions.length} ${questions.length === 1 ? "question" : "questions"}`);

    questions.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "question-item";

      const number = document.createElement("span");
      number.className = "question-index";
      number.textContent = String(index + 1).padStart(2, "0");

      const summary = document.createElement("div");
      summary.className = "question-summary";
      const prompt = document.createElement("strong");
      prompt.textContent = item.question;
      const answer = document.createElement("div");
      answer.className = "question-answer";
      const check = document.createElement("span");
      check.className = "answer-check";
      check.textContent = "✓";
      answer.append(check, document.createTextNode(item.options[item.answer]));
      summary.append(prompt, answer);

      const removeButton = document.createElement("button");
      removeButton.className = "btn-remove";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove question ${index + 1}`);
      removeButton.addEventListener("click", () => {
        questions.splice(index, 1);
        renderQuestions();
      });

      row.append(number, summary, removeButton);
      questionList.append(row);
    });
  }

  downloadButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity("Please enter a title for your quiz.");
      titleInput.reportValidity();
      titleInput.focus();
      titleInput.addEventListener("input", () => titleInput.setCustomValidity(""), { once: true });
      return;
    }
    if (questions.length === 0) {
      feedback.textContent = "Add at least one question before generating your quiz.";
      questionInput.focus();
      return;
    }

    const quiz = {
      title,
      teacher: teacherInput.value.trim(),
      questions
    };
    const html = buildStudentQuiz(quiz);
    const file = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${makeFileName(title)}.html`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function makeFileName(title) {
    const fileName = title
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70);
    return fileName || "quizee-quiz";
  }

  function buildStudentQuiz(quiz) {
    // Escaping "<" keeps quiz text from ever closing the embedded script element.
    const quizData = JSON.stringify(quiz).replace(/</g, "\\u003c");
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#001510">
  <title>${escapeHtml(quiz.title)} — Quizee</title>
  <style>
    :root{color-scheme:light;--forest:#001510;--mint:#00bf8f;--ink:#172821;--muted:#72817a;--line:#e5eeea}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;background:#f3f8f5;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .topbar{height:64px;background:var(--forest);color:#fff}
    .topbar-inner{display:flex;width:min(760px,calc(100% - 36px));height:100%;align-items:center;justify-content:space-between;margin:auto}
    .brand{display:flex;align-items:center;gap:9px;font-size:19px;font-weight:800;letter-spacing:-.7px}
    .brand-mark{display:grid;width:29px;height:29px;place-items:center;border-radius:9px;background:linear-gradient(145deg,#1ae0a8,#00a979);color:#00261d}
    .brand-period{color:var(--mint)}
    .file-note{color:#a9bcb6;font-size:11px}
    main{width:min(700px,calc(100% - 32px));margin:35px auto 55px}
    .quiz-header,.question-card,.result-card{border:1px solid var(--line);border-radius:15px;background:#fff;box-shadow:0 6px 22px rgba(10,45,32,.045)}
    .quiz-header{padding:25px 27px;margin-bottom:16px}
    .eyebrow{color:#008c65;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
    h1{margin:8px 0 5px;font-size:clamp(25px,5vw,34px);letter-spacing:-1px;line-height:1.18;overflow-wrap:anywhere}
    .teacher{margin:0;color:var(--muted);font-size:12px}
    .progress-row{display:flex;align-items:center;justify-content:space-between;margin-top:20px;color:#63736b;font-size:11px;font-weight:650}
    .progress-track{height:6px;margin-top:8px;overflow:hidden;border-radius:6px;background:#eaf2ee}
    .progress-fill{width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#00bf8f,#5ce3b9);transition:width .2s}
    form{display:grid;gap:12px}
    .question-card{padding:20px 22px}
    .question-top{display:flex;gap:11px;align-items:flex-start;margin-bottom:15px}
    .question-number{display:grid;flex:0 0 28px;width:28px;height:28px;place-items:center;border-radius:9px;background:#eaf9f3;color:#00865f;font-size:10px;font-weight:800}
    .question-text{padding-top:3px;font-size:14px;font-weight:720;line-height:1.5;overflow-wrap:anywhere}
    .options{display:grid;gap:8px}
    .option{display:flex;min-height:43px;align-items:center;gap:10px;padding:9px 12px;border:1px solid #e7eeea;border-radius:9px;cursor:pointer;transition:border-color .15s,background .15s}
    .option:hover{border-color:#a2dfc8;background:#f6fcf9}
    .option input{width:15px;height:15px;flex:0 0 15px;margin:0;accent-color:#00a978}
    .option span{font-size:12px;line-height:1.45;overflow-wrap:anywhere}
    .option:has(input:checked){border-color:#57d6ae;background:#f1fcf7}
    .option input:disabled{cursor:default}
    .option.is-correct{border-color:#61c99f;background:#effaf4}
    .option.is-wrong{border-color:#e9a7a1;background:#fff5f3}
    .option.is-correct span:after{content:"  ✓ Correct answer";color:#08764f;font-size:10px;font-weight:750}
    .option.is-wrong span:after{content:"  ✕ Your answer";color:#b34138;font-size:10px;font-weight:750}
    .actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px}
    .helper{color:var(--muted);font-size:11px}
    button{min-height:43px;padding:10px 17px;border:0;border-radius:9px;background:linear-gradient(110deg,#13c895,#00aa7a);color:#00271e;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer}
    button:hover{filter:brightness(1.04)}
    button:focus-visible,input:focus-visible{outline:3px solid rgba(0,191,143,.3);outline-offset:2px}
    button:disabled{cursor:default;opacity:.65}
    .result-card{margin-top:15px;padding:24px;text-align:center}
    .score-circle{display:grid;width:94px;height:94px;margin:0 auto 12px;place-items:center;border:6px solid #d9f5e9;border-radius:50%;background:#f3fcf7;color:#087b57;font-size:25px;font-weight:850;letter-spacing:-1px}
    .result-card h2{margin:0 0 6px;font-size:20px;letter-spacing:-.4px}
    .result-card p{margin:0;color:var(--muted);font-size:12px}
    .result-card .result-detail{margin-top:8px;color:#53645c}
    .copyright{margin-top:24px;color:#819088;font-size:10px;text-align:center}
    .visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    [hidden]{display:none!important}
    @media(max-width:520px){main{margin-top:20px}.quiz-header{padding:21px}.question-card{padding:17px}.actions{align-items:stretch;flex-direction:column}.actions button{width:100%}.helper{text-align:center}.file-note{font-size:10px}}
    @media print{body{background:#fff}.topbar{background:#fff;color:var(--ink)}.file-note,.actions{display:none}.quiz-header,.question-card,.result-card{box-shadow:none;break-inside:avoid}}
  </style>
</head>
<body>
  <header class="topbar"><div class="topbar-inner"><div class="brand"><span class="brand-mark">Q</span><span>quizee<span class="brand-period">.</span></span></div><span class="file-note">Student quiz</span></div></header>
  <main>
    <section class="quiz-header" aria-labelledby="quiz-title">
      <span class="eyebrow">Your quiz</span>
      <h1 id="quiz-title"></h1>
      <p class="teacher" id="teacher"></p>
      <div class="progress-row"><span id="progress-label"></span><span id="progress-percent"></span></div>
      <div class="progress-track" role="progressbar" aria-label="Quiz completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-fill"></div></div>
    </section>
    <form id="quiz-form">
      <div id="questions"></div>
      <div class="actions"><span class="helper">Choose one answer for every question.</span><button id="submit-button" type="submit">Submit my answers <span aria-hidden="true">→</span></button></div>
    </form>
    <section id="result" class="result-card" aria-live="polite" hidden>
      <div class="score-circle" id="score"></div>
      <h2 id="result-heading"></h2>
      <p id="result-message"></p>
      <p class="result-detail" id="result-detail"></p>
    </section>
    <footer class="copyright">© 2026 Quizee. All rights reserved. Created by Yousseif Elshenawy.</footer>
  </main>
  <script>
    "use strict";
    const quiz = ${quizData};
    const form = document.querySelector("#quiz-form");
    const questionsElement = document.querySelector("#questions");
    const progressLabel = document.querySelector("#progress-label");
    const progressPercent = document.querySelector("#progress-percent");
    const progressTrack = document.querySelector(".progress-track");
    const progressFill = document.querySelector(".progress-fill");
    const total = quiz.questions.length;
    document.title = quiz.title + " — Quizee";
    document.querySelector("#quiz-title").textContent = quiz.title;
    const teacher = document.querySelector("#teacher");
    if (quiz.teacher) teacher.textContent = "Created by " + quiz.teacher;
    else teacher.hidden = true;

    quiz.questions.forEach((item, questionIndex) => {
      const card = document.createElement("section");
      card.className = "question-card";
      const top = document.createElement("div");
      top.className = "question-top";
      const number = document.createElement("span");
      number.className = "question-number";
      number.textContent = String(questionIndex + 1).padStart(2, "0");
      const prompt = document.createElement("div");
      prompt.className = "question-text";
      prompt.id = "question-" + questionIndex;
      prompt.textContent = item.question;
      top.append(number, prompt);

      const options = document.createElement("div");
      options.className = "options";
      item.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");
        label.className = "option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "question-" + questionIndex;
        input.value = String(optionIndex);
        input.required = true;
        input.setAttribute("aria-label", option);
        input.addEventListener("change", updateProgress);
        const text = document.createElement("span");
        text.textContent = option;
        label.append(input, text);
        options.append(label);
      });
      card.append(top, options);
      questionsElement.append(card);
    });

    function updateProgress() {
      const answered = quiz.questions.reduce((count, _item, index) =>
        count + (form.querySelector('input[name="question-' + index + '"]:checked') ? 1 : 0), 0);
      const percent = Math.round((answered / total) * 100);
      progressLabel.textContent = answered + " of " + total + " answered";
      progressPercent.textContent = percent + "%";
      progressFill.style.width = percent + "%";
      progressTrack.setAttribute("aria-valuenow", String(percent));
    }

    updateProgress();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      let correct = 0;
      quiz.questions.forEach((item, questionIndex) => {
        const selected = form.querySelector('input[name="question-' + questionIndex + '"]:checked');
        const selectedIndex = Number(selected.value);
        if (selectedIndex === item.answer) correct += 1;
        const options = form.querySelectorAll('input[name="question-' + questionIndex + '"]');
        options.forEach((input, optionIndex) => {
          input.disabled = true;
          if (optionIndex === item.answer) input.parentElement.classList.add("is-correct");
          if (optionIndex === selectedIndex && selectedIndex !== item.answer) input.parentElement.classList.add("is-wrong");
        });
      });

      const percent = Math.round((correct / total) * 100);
      document.querySelector("#score").textContent = percent + "%";
      document.querySelector("#result-heading").textContent =
        percent === 100 ? "Perfect score!" : percent >= 70 ? "Great work!" : percent >= 40 ? "Good effort!" : "Keep practicing!";
      document.querySelector("#result-message").textContent =
        "You got " + correct + " out of " + total + (total === 1 ? " question correct." : " questions correct.");
      document.querySelector("#result-detail").textContent =
        percent === 100 ? "You answered every question correctly." : "Review the highlighted answers above to see what to revisit.";
      document.querySelector("#result").hidden = false;
      document.querySelector("#submit-button").disabled = true;
      document.querySelector("#submit-button").textContent = "Quiz submitted";
      document.querySelector("#result").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  </script>
</body>
</html>`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }
})();
