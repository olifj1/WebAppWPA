// ----------------------------
// Small helpers
// ----------------------------
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Prevent iOS gesture zoom and unwanted double-tap zoom in the app shell.
document.addEventListener("gesturestart", event => event.preventDefault(), { passive: false });
let lastTouchEnd = 0;
document.addEventListener("touchend", event => {
  const now = Date.now();
  if (now - lastTouchEnd <= 280) event.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// ----------------------------
// Navigation
// ----------------------------
const tabs = $$(".tab");
const screens = $$(".screen");

function showScreen(target) {
  tabs.forEach(tab => {
    const active = tab.dataset.screen === target;
    tab.classList.toggle("active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  screens.forEach(screen => {
    screen.classList.toggle("active", screen.id === target);
  });

  localStorage.setItem("learningPlayScreen", target);
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});

const savedScreen = localStorage.getItem("learningPlayScreen");
if (savedScreen && document.getElementById(savedScreen)) showScreen(savedScreen);

// ----------------------------
// Numbers / multiplication
// ----------------------------
const numberDown = $("#number-down");
const numberUp = $("#number-up");
const chosenNumberEl = $("#chosen-number");
const tapNumber = $("#tap-number");
const tapValue = $("#tap-value");
const totalValue = $("#total-value");
const equation = $("#equation");
const tapDots = $("#tap-dots");
const tapCount = $("#tap-count");
const numbersReset = $("#numbers-reset");

let chosenNumber = Number(localStorage.getItem("chosenNumber") || 4);
let taps = Number(localStorage.getItem("numberTaps") || 0);

function renderNumbers() {
  chosenNumber = clamp(chosenNumber, 1, 12);
  const total = chosenNumber * taps;

  chosenNumberEl.textContent = chosenNumber;
  tapValue.textContent = chosenNumber;
  totalValue.textContent = total;
  tapCount.textContent = `${taps} ${taps === 1 ? "tap" : "taps"}`;

  if (taps === 0) {
    equation.textContent = "Tap the button to begin";
  } else if (taps <= 8) {
    equation.textContent = `${Array(taps).fill(chosenNumber).join(" + ")} = ${total}`;
  } else {
    equation.textContent = `${chosenNumber} added ${taps} times = ${total}`;
  }

  tapDots.innerHTML = "";
  for (let i = 0; i < Math.min(taps, 24); i++) {
    const dot = document.createElement("span");
    dot.className = "tap-dot";
    tapDots.appendChild(dot);
  }

  if (taps > 24) {
    const more = document.createElement("span");
    more.textContent = `+${taps - 24}`;
    more.style.cssText = "font-size:12px;font-weight:800;opacity:.55;align-self:center";
    tapDots.appendChild(more);
  }

  localStorage.setItem("chosenNumber", chosenNumber);
  localStorage.setItem("numberTaps", taps);
}

function changeChosenNumber(delta) {
  chosenNumber = clamp(chosenNumber + delta, 1, 12);
  taps = 0;
  renderNumbers();
}

numberDown.addEventListener("click", () => changeChosenNumber(-1));
numberUp.addEventListener("click", () => changeChosenNumber(1));
tapNumber.addEventListener("click", () => {
  taps += 1;
  renderNumbers();
});
numbersReset.addEventListener("click", () => {
  taps = 0;
  renderNumbers();
});

renderNumbers();

// ----------------------------
// Clock
// ----------------------------
const hourSlider = $("#hour-slider");
const minuteSlider = $("#minute-slider");
const hourReadout = $("#hour-readout");
const minuteReadout = $("#minute-readout");
const hourHand = $("#hour-hand");
const minuteHand = $("#minute-hand");
const digitalTime = $("#digital-time");
const dayLabel = $("#day-label");
const clockScreen = $("#clock-screen");
const clockTicks = $("#clock-ticks");

for (let i = 0; i < 60; i++) {
  const angle = i * 6 * Math.PI / 180;
  const major = i % 5 === 0;
  const outer = 116;
  const inner = major ? 104 : 110;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", 150 + Math.sin(angle) * inner);
  line.setAttribute("y1", 150 - Math.cos(angle) * inner);
  line.setAttribute("x2", 150 + Math.sin(angle) * outer);
  line.setAttribute("y2", 150 - Math.cos(angle) * outer);
  line.setAttribute("class", major ? "tick major" : "tick");
  clockTicks.appendChild(line);
}

let hour = Number(localStorage.getItem("clockHour") || 12);
let minute = Number(localStorage.getItem("clockMinute") || 0);
hourSlider.value = hour;
minuteSlider.value = minute;

const skyStops = [
  { t: 0.00, c: [48, 72, 116] },
  { t: 0.18, c: [67, 92, 137] },
  { t: 0.24, c: [232, 148, 124] },
  { t: 0.30, c: [247, 199, 118] },
  { t: 0.50, c: [248, 219, 145] },
  { t: 0.70, c: [243, 190, 108] },
  { t: 0.79, c: [224, 120, 102] },
  { t: 0.86, c: [96, 91, 142] },
  { t: 1.00, c: [48, 72, 116] }
];

const lerp = (a, b, t) => a + (b - a) * t;

function skyColor(normalizedDay) {
  for (let i = 0; i < skyStops.length - 1; i++) {
    const a = skyStops[i];
    const b = skyStops[i + 1];
    if (normalizedDay >= a.t && normalizedDay <= b.t) {
      const localT = (normalizedDay - a.t) / (b.t - a.t);
      const rgb = a.c.map((value, j) => Math.round(lerp(value, b.c[j], localT)));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }
  return "rgb(48, 72, 116)";
}

function labelForTime(decimalHour) {
  if (decimalHour < 5) return "Night";
  if (decimalHour < 7) return "Sunrise";
  if (decimalHour < 11.5) return "Morning";
  if (decimalHour < 13.5) return "Midday";
  if (decimalHour < 17.5) return "Afternoon";
  if (decimalHour < 20) return "Sunset";
  if (decimalHour < 22) return "Evening";
  return "Night";
}

function renderClock() {
  const decimalHour = hour + minute / 60;
  hourHand.style.transform = `rotate(${(decimalHour % 12) * 30}deg)`;
  minuteHand.style.transform = `rotate(${minute * 6}deg)`;

  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  digitalTime.textContent = `${hh}:${mm}`;
  hourReadout.textContent = hh;
  minuteReadout.textContent = mm;
  dayLabel.textContent = labelForTime(decimalHour);
  clockScreen.style.backgroundColor = skyColor(decimalHour / 24);

  const page = $("#clock-page");
  const dark = decimalHour < 6 || decimalHour >= 20.5;
  page.style.color = dark ? "#f8fafc" : "#27313c";
  page.querySelector(".subhead").style.color = dark
    ? "rgba(248,250,252,.72)"
    : "rgba(39,49,60,.68)";

  localStorage.setItem("clockHour", hour);
  localStorage.setItem("clockMinute", minute);
}

hourSlider.addEventListener("input", () => {
  hour = Number(hourSlider.value);
  renderClock();
});

minuteSlider.addEventListener("input", () => {
  minute = Number(minuteSlider.value);
  renderClock();
});

renderClock();

// ----------------------------
// Sums
// ----------------------------
const modeButtons = $$("[data-sum-mode]");
const difficultyButtons = $$("[data-difficulty]");
const durationButtons = $$("[data-duration]");
const difficultyNote = $("#difficulty-note");
const testOptions = $("#test-options");
const startTestButton = $("#start-test");
const sumSetup = $("#sum-setup");
const sumPlay = $("#sum-play");
const testTopline = $("#test-topline");
const timerValue = $("#timer-value");
const liveScore = $("#live-score");
const sumQuestion = $("#sum-question");
const answerDisplay = $("#answer-display");
const sumFeedback = $("#sum-feedback");
const digitButtons = $$("[data-digit]");
const answerClear = $("#answer-clear");
const answerCheck = $("#answer-check");
const newSumButton = $("#new-sum");
const passSumButton = $("#pass-sum");
const bestScoreLabel = $("#best-score");
const testResults = $("#test-results");
const resultScore = $("#result-score");
const resultCorrect = $("#result-correct");
const resultPassed = $("#result-passed");
const resultBest = $("#result-best");
const resultMessage = $("#result-message");
const tryAgain = $("#try-again");
const leaveTest = $("#leave-test");

const difficultyInfo = {
  easy: {
    note: "Adding and taking away with answers up to 10.",
    points: 1
  },
  medium: {
    note: "Adding and taking away with answers up to 20.",
    points: 2
  },
  hard: {
    note: "Bigger numbers with answers up to 50.",
    points: 3
  }
};

let sumMode = localStorage.getItem("sumMode") || "practice";
let difficulty = localStorage.getItem("sumDifficulty") || "easy";
let testDuration = Number(localStorage.getItem("sumDuration") || 60);
let currentProblem = null;
let answerText = "";
let feedbackLocked = false;

let testRunning = false;
let testEndAt = 0;
let testTimer = null;
let testScore = 0;
let testCorrect = 0;
let testPassed = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeAddition(maxAnswer) {
  const answer = randomInt(2, maxAnswer);
  const a = randomInt(0, answer);
  const b = answer - a;
  return { a, b, op: "+", answer };
}

function makeSubtraction(maxStart) {
  const a = randomInt(1, maxStart);
  const b = randomInt(0, a);
  return { a, b, op: "−", answer: a - b };
}

function generateProblem() {
  let problem;
  const subtraction = Math.random() < 0.42;

  if (difficulty === "easy") {
    problem = subtraction ? makeSubtraction(10) : makeAddition(10);
  } else if (difficulty === "medium") {
    problem = subtraction ? makeSubtraction(20) : makeAddition(20);
  } else {
    problem = subtraction ? makeSubtraction(50) : makeAddition(50);
  }

  // Avoid repeating exactly the same question twice in a row where possible.
  if (
    currentProblem &&
    problem.a === currentProblem.a &&
    problem.b === currentProblem.b &&
    problem.op === currentProblem.op
  ) {
    return generateProblem();
  }

  currentProblem = problem;
  answerText = "";
  feedbackLocked = false;
  answerDisplay.classList.remove("correct", "wrong");
  sumFeedback.classList.remove("good", "bad");
  sumQuestion.textContent = `${problem.a} ${problem.op} ${problem.b} = ?`;
  sumFeedback.textContent = testRunning ? "Solve it or tap Pass" : "Tap the numbers below";
  renderAnswer();
}

function renderAnswer() {
  answerDisplay.textContent = answerText || "?";
}

function setDifficulty(value) {
  difficulty = value;
  localStorage.setItem("sumDifficulty", difficulty);

  difficultyButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.difficulty === difficulty);
  });

  difficultyNote.textContent = difficultyInfo[difficulty].note;
  updateBestScore();
  generateProblem();
}

function setDuration(seconds) {
  testDuration = Number(seconds);
  localStorage.setItem("sumDuration", testDuration);

  durationButtons.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.duration) === testDuration);
  });

  updateBestScore();
}

function setSumMode(mode) {
  if (testRunning) endTest(false);

  sumMode = mode;
  localStorage.setItem("sumMode", sumMode);

  modeButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.sumMode === sumMode);
  });

  const isTest = sumMode === "test";
  testOptions.classList.toggle("hidden", !isTest);
  testTopline.classList.add("hidden");
  passSumButton.classList.add("hidden");
  newSumButton.classList.toggle("hidden", isTest);
  testResults.classList.add("hidden");
  sumPlay.classList.toggle("hidden", isTest);
  sumSetup.classList.remove("hidden");

  if (!isTest) generateProblem();
  updateBestScore();
}

function bestKey() {
  return `sumBest:${difficulty}:${testDuration}`;
}

function getBestScore() {
  return Number(localStorage.getItem(bestKey()) || 0);
}

function updateBestScore() {
  const best = getBestScore();
  bestScoreLabel.textContent = best ? `Best: ${best} points` : "Best: —";
}

function appendDigit(digit) {
  if (feedbackLocked || (!testRunning && sumMode === "test")) return;
  if (answerText.length >= 3) return;
  if (answerText === "0") answerText = "";
  answerText += digit;
  renderAnswer();
}

function backspaceAnswer() {
  if (feedbackLocked) return;
  answerText = answerText.slice(0, -1);
  renderAnswer();
}

function checkAnswer() {
  if (feedbackLocked || answerText === "" || !currentProblem) return;

  const value = Number(answerText);

  if (value === currentProblem.answer) {
    answerDisplay.classList.remove("wrong");
    answerDisplay.classList.add("correct");
    sumFeedback.classList.remove("bad");
    sumFeedback.classList.add("good");
    sumFeedback.textContent = testRunning ? "Correct! ★" : "You got it! ★";

    if (testRunning) {
      testCorrect += 1;
      testScore += difficultyInfo[difficulty].points;
      liveScore.textContent = testScore;
      feedbackLocked = true;
      setTimeout(() => {
        if (testRunning) generateProblem();
      }, 320);
    } else {
      feedbackLocked = true;
    }
  } else {
    answerDisplay.classList.remove("correct");
    answerDisplay.classList.add("wrong");
    sumFeedback.classList.remove("good");
    sumFeedback.classList.add("bad");
    sumFeedback.textContent = "Not quite — have another go";
    answerText = "";
    setTimeout(() => {
      answerDisplay.classList.remove("wrong");
      renderAnswer();
    }, 320);
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutesPart = Math.floor(safe / 60);
  const secondsPart = String(safe % 60).padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
}

function updateTimer() {
  if (!testRunning) return;
  const remaining = (testEndAt - Date.now()) / 1000;
  timerValue.textContent = formatTime(remaining);

  if (remaining <= 0) endTest(true);
}

function startTest() {
  clearInterval(testTimer);

  testRunning = true;
  testScore = 0;
  testCorrect = 0;
  testPassed = 0;
  testEndAt = Date.now() + testDuration * 1000;

  sumSetup.classList.add("hidden");
  testResults.classList.add("hidden");
  sumPlay.classList.remove("hidden");
  testTopline.classList.remove("hidden");
  passSumButton.classList.remove("hidden");
  newSumButton.classList.add("hidden");

  liveScore.textContent = "0";
  timerValue.textContent = formatTime(testDuration);
  generateProblem();

  testTimer = setInterval(updateTimer, 150);
}

function passProblem() {
  if (!testRunning) return;
  testPassed += 1;
  generateProblem();
}

function endTest(showResults = true) {
  if (!testRunning && !showResults) return;

  clearInterval(testTimer);
  testTimer = null;
  const wasRunning = testRunning;
  testRunning = false;

  if (!showResults) {
    sumSetup.classList.remove("hidden");
    testTopline.classList.add("hidden");
    passSumButton.classList.add("hidden");
    return;
  }

  if (!wasRunning) return;

  const oldBest = getBestScore();
  const newBest = Math.max(oldBest, testScore);
  localStorage.setItem(bestKey(), newBest);

  resultScore.textContent = testScore;
  resultCorrect.textContent = testCorrect;
  resultPassed.textContent = testPassed;
  resultBest.textContent = newBest;

  if (testScore > oldBest && testScore > 0) {
    resultMessage.textContent = "New best score! ★";
  } else if (testCorrect >= 10) {
    resultMessage.textContent = "Brilliant work!";
  } else if (testCorrect >= 5) {
    resultMessage.textContent = "Great work!";
  } else {
    resultMessage.textContent = "Good try — have another go!";
  }

  sumPlay.classList.add("hidden");
  sumSetup.classList.add("hidden");
  testResults.classList.remove("hidden");
  updateBestScore();
}

modeButtons.forEach(button => {
  button.addEventListener("click", () => setSumMode(button.dataset.sumMode));
});

difficultyButtons.forEach(button => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

durationButtons.forEach(button => {
  button.addEventListener("click", () => setDuration(button.dataset.duration));
});

digitButtons.forEach(button => {
  button.addEventListener("click", () => appendDigit(button.dataset.digit));
});

answerClear.addEventListener("click", backspaceAnswer);
answerCheck.addEventListener("click", checkAnswer);
newSumButton.addEventListener("click", generateProblem);
passSumButton.addEventListener("click", passProblem);
startTestButton.addEventListener("click", startTest);
tryAgain.addEventListener("click", startTest);

leaveTest.addEventListener("click", () => {
  setSumMode("practice");
});

setDifficulty(difficulty);
setDuration(testDuration);
setSumMode(sumMode);

// ----------------------------
// PWA service worker / update handling
// ----------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      await registration.update();

      // Check again whenever the installed app becomes active.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update();
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!sessionStorage.getItem("learningPlayReloadedForUpdate")) {
          sessionStorage.setItem("learningPlayReloadedForUpdate", "1");
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
