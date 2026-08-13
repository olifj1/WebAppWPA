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
const totalValue = $("#total-value");
const equation = $("#equation");
const multiplyEquation = $("#multiply-equation");
const tapDots = $("#tap-dots");
const tapCount = $("#tap-count");
const numbersReset = $("#numbers-reset");

let chosenNumber = Number(localStorage.getItem("chosenNumber") || 4);
let taps = Number(localStorage.getItem("numberTaps") || 0);

function renderNumbers() {
  chosenNumber = clamp(chosenNumber, 1, 12);
  const total = chosenNumber * taps;

  chosenNumberEl.textContent = chosenNumber;
  totalValue.textContent = total;
  tapCount.textContent = `${taps} ${taps === 1 ? "tap" : "taps"}`;

  if (taps === 0) {
    equation.textContent = "Tap the button to begin";
    multiplyEquation.textContent = "";
  } else if (taps <= 8) {
    equation.textContent = `${Array(taps).fill(chosenNumber).join(" + ")} = ${total}`;
    multiplyEquation.textContent = `${taps} × ${chosenNumber} = ${total}`;
  } else {
    equation.textContent = `${chosenNumber} added ${taps} times = ${total}`;
    multiplyEquation.textContent = `${taps} × ${chosenNumber} = ${total}`;
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

const clockNumbers = $("#clock-numbers");
for (let n = 1; n <= 12; n++) {
  const angle = n * 30 * Math.PI / 180;
  const radius = 98;
  const x = 150 + Math.sin(angle) * radius;
  const y = 150 - Math.cos(angle) * radius;
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y + 1);
  text.textContent = n;
  clockNumbers.appendChild(text);
}

let hour = Number(localStorage.getItem("clockHour") || 12);
let minute = Number(localStorage.getItem("clockMinute") || 0);
hourSlider.value = hour;
minuteSlider.value = minute;

const skyStops = [
  { t: 0.00, c: [5, 8, 14] },
  { t: 0.18, c: [28, 44, 78] },
  { t: 0.24, c: [232, 148, 124] },
  { t: 0.30, c: [247, 199, 118] },
  { t: 0.50, c: [248, 219, 145] },
  { t: 0.70, c: [243, 190, 108] },
  { t: 0.79, c: [224, 120, 102] },
  { t: 0.86, c: [42, 51, 86] },
  { t: 1.00, c: [5, 8, 14] }
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
  return "rgb(5, 8, 14)";
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
  const minuteForHands = minute === 60 ? 0 : minute;
  const carriedHour = minute === 60 ? (hour + 1) % 24 : hour;
  const decimalHour = carriedHour + minuteForHands / 60;

  hourHand.style.transform = `rotate(${(decimalHour % 12) * 30}deg)`;
  minuteHand.style.transform = `rotate(${minute === 60 ? 360 : minute * 6}deg)`;

  const hh = String(carriedHour).padStart(2, "0");
  const mm = String(minute === 60 ? 0 : minute).padStart(2, "0");
  digitalTime.textContent = `${hh}:${mm}`;
  hourReadout.textContent = String(hour).padStart(2, "0");
  minuteReadout.textContent = String(minute).padStart(2, "0");
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
    note: "Mostly + and − to 10, with a little 2, 5 and 10 times-table practice.",
    points: 1
  },
  medium: {
    note: "+ and − to 20, with simple multiplication mixed in.",
    points: 2
  },
  hard: {
    note: "Bigger + and − problems, plus times tables up to 10 × 12.",
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
  const minPart = maxAnswer <= 10 ? 1 : 2;
  const answer = randomInt(minPart * 2, maxAnswer);
  const a = randomInt(minPart, answer - minPart);
  const b = answer - a;
  return { a, b, op: "+", answer };
}

function makeSubtraction(maxStart) {
  const minPart = maxStart <= 10 ? 1 : 2;
  const a = randomInt(Math.max(minPart + 1, 3), maxStart);
  const b = randomInt(minPart, a - minPart);
  return { a, b, op: "−", answer: a - b };
}

function makeMultiplication(maxTable, maxMultiplier) {
  const a = randomInt(2, maxTable);
  const b = randomInt(2, maxMultiplier);
  return { a, b, op: "×", answer: a * b };
}

function generateProblem() {
  let problem;
  const roll = Math.random();

  if (difficulty === "easy") {
    if (roll < 0.16) {
      const tables = [2, 5, 10];
      const a = tables[randomInt(0, tables.length - 1)];
      const b = randomInt(2, 5);
      problem = { a, b, op: "×", answer: a * b };
    } else if (roll < 0.58) {
      problem = makeAddition(10);
    } else {
      problem = makeSubtraction(10);
    }
  } else if (difficulty === "medium") {
    if (roll < 0.28) problem = makeMultiplication(5, 10);
    else if (roll < 0.64) problem = makeAddition(20);
    else problem = makeSubtraction(20);
  } else {
    if (roll < 0.38) problem = makeMultiplication(10, 12);
    else if (roll < 0.69) problem = makeAddition(50);
    else problem = makeSubtraction(50);
  }

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
// Reading
// ----------------------------
const readingModeButtons = $$('[data-reading-mode]');
const readingLevelButtons = $$('[data-reading-level]');
const readingPrompt = $('#reading-prompt');
const wordChoices = $('#word-choices');
const readingFeedback = $('#reading-feedback');
const readingNote = $('#reading-note');
const newReadingButton = $('#new-reading');

const readingLibraries = {
  easy: [
    'The red fox can run fast.',
    'Mia has a blue hat.',
    'The dog sat on the rug.',
    'We can jump in the rain.',
    'Dad made toast for us.',
    'A frog sits by the pond.',
    'The sun is warm today.',
    'Ben can kick the ball.',
    'The cat sleeps on my bed.',
    'I can see three ducks.',
    'The big bus is yellow.',
    'Sam likes milk and toast.'
  ],
  medium: [
    'The little rabbit hopped across the green field.',
    'Maya found a shiny shell beside the sea.',
    'After lunch, we walked to the busy park.',
    'The sleepy kitten curled up inside the basket.',
    'A bright rainbow appeared after the heavy rain.',
    'Tom carried his muddy boots into the kitchen.',
    'We planted tiny seeds in the garden yesterday.',
    'The friendly dragon hid behind the old castle.',
    'Lucy packed an apple and a sandwich for lunch.',
    'The moon looked bright above the quiet houses.',
    'Our class made paper boats and floated them outside.',
    'A small bird landed softly on the wooden fence.'
  ],
  hard: [
    'Although the wind was strong, the children kept flying their colourful kite.',
    'Before bedtime, Oliver carefully placed his favourite book back on the shelf.',
    'The curious squirrel hurried along the branch and disappeared behind the leaves.',
    'When the rain finally stopped, puddles sparkled across the playground.',
    'Sophie whispered quietly because her baby brother was sleeping upstairs.',
    'At the museum, we discovered a huge skeleton from a dinosaur that lived long ago.',
    'The excited puppy chased the rolling ball until it vanished beneath the sofa.',
    'After mixing the flour and eggs, we waited patiently for the cake to bake.',
    'A narrow path twisted through the woods towards a small wooden bridge.',
    'Ella wore her warmest coat because frost covered the grass that morning.',
    'During the journey, we counted red cars, blue lorries and three yellow buses.',
    'The pirate opened the ancient map and searched for the hidden island.'
  ]
};

const readingNotes = {
  easy: 'Short, familiar sentences with simple words.',
  medium: 'Longer sentences with more descriptive words.',
  hard: 'Longer sentences with richer vocabulary and more complex phrasing.'
};

const readingTests = {
  easy: [
    { sentence: 'The cat ___ on the mat.', answer: 'sat', choices: ['sat','sun','red','hop'] },
    { sentence: 'I can see a ___ duck.', answer: 'yellow', choices: ['yellow','run','milk','bed'] },
    { sentence: 'Ben can ___ the ball.', answer: 'kick', choices: ['kick','hat','rain','frog'] },
    { sentence: 'The sun is ___ today.', answer: 'warm', choices: ['warm','bus','three','pond'] },
    { sentence: 'We ___ in the park.', answer: 'play', choices: ['play','blue','toast','fish'] }
  ],
  medium: [
    { sentence: 'The rabbit hopped across the green ___.', answer: 'field', choices: ['field','shell','basket','lunch'] },
    { sentence: 'Maya found a shiny ___ beside the sea.', answer: 'shell', choices: ['shell','field','boots','moon'] },
    { sentence: 'A bright rainbow appeared after the ___.', answer: 'rain', choices: ['rain','garden','castle','book'] },
    { sentence: 'The kitten curled up inside the ___.', answer: 'basket', choices: ['basket','park','fence','seed'] },
    { sentence: 'We planted tiny seeds in the ___.', answer: 'garden', choices: ['garden','kitchen','sea','bus'] }
  ],
  hard: [
    { sentence: 'The curious squirrel hurried along the ___.', answer: 'branch', choices: ['branch','puddle','museum','bridge'] },
    { sentence: 'We waited patiently for the cake to ___.', answer: 'bake', choices: ['bake','whisper','count','twist'] },
    { sentence: 'A narrow path twisted through the ___.', answer: 'woods', choices: ['woods','sofa','shelf','island'] },
    { sentence: 'Frost covered the grass that ___.', answer: 'morning', choices: ['morning','journey','pirate','skeleton'] },
    { sentence: 'The pirate searched for the hidden ___.', answer: 'island', choices: ['island','leaves','coat','flour'] }
  ]
};

let readingMode = localStorage.getItem('readingMode') || 'read';
let readingLevel = localStorage.getItem('readingLevel') || 'easy';
let lastReadingIndex = -1;
let activeReadingTest = null;

function setReadingMode(mode) {
  readingMode = mode;
  localStorage.setItem('readingMode', mode);
  readingModeButtons.forEach(button => button.classList.toggle('active', button.dataset.readingMode === mode));
  generateReading();
}

function setReadingLevel(level) {
  readingLevel = level;
  localStorage.setItem('readingLevel', level);
  readingLevelButtons.forEach(button => button.classList.toggle('active', button.dataset.readingLevel === level));
  readingNote.textContent = readingNotes[level];
  lastReadingIndex = -1;
  generateReading();
}

function generateReading() {
  readingFeedback.classList.remove('good','bad');
  wordChoices.innerHTML = '';

  if (readingMode === 'read') {
    const library = readingLibraries[readingLevel];
    let index = randomInt(0, library.length - 1);
    if (library.length > 1 && index === lastReadingIndex) index = (index + 1) % library.length;
    lastReadingIndex = index;
    readingPrompt.textContent = library[index];
    wordChoices.classList.add('hidden');
    readingFeedback.textContent = 'Read it out loud.';
    newReadingButton.textContent = 'New Sentence';
    return;
  }

  const items = readingTests[readingLevel];
  activeReadingTest = items[randomInt(0, items.length - 1)];
  const parts = activeReadingTest.sentence.split('___');
  readingPrompt.innerHTML = `${parts[0]}<span class="blank">?</span>${parts[1] || ''}`;
  readingFeedback.textContent = 'Choose the word that fits.';
  wordChoices.classList.remove('hidden');
  newReadingButton.textContent = 'New Question';

  const shuffled = [...activeReadingTest.choices].sort(() => Math.random() - 0.5);
  shuffled.forEach(word => {
    const button = document.createElement('button');
    button.className = 'word-choice';
    button.textContent = word;
    button.addEventListener('click', () => checkReadingChoice(button, word));
    wordChoices.appendChild(button);
  });
}

function checkReadingChoice(button, word) {
  if (!activeReadingTest) return;
  const buttons = wordChoices.querySelectorAll('.word-choice');
  buttons.forEach(b => b.disabled = true);
  if (word === activeReadingTest.answer) {
    button.classList.add('correct');
    readingFeedback.classList.add('good');
    readingFeedback.textContent = 'Yes — that fits! ★';
  } else {
    button.classList.add('wrong');
    readingFeedback.classList.add('bad');
    readingFeedback.textContent = `Good try — the word is “${activeReadingTest.answer}”.`;
    buttons.forEach(b => {
      if (b.textContent === activeReadingTest.answer) b.classList.add('correct');
    });
  }
}

readingModeButtons.forEach(button => button.addEventListener('click', () => setReadingMode(button.dataset.readingMode)));
readingLevelButtons.forEach(button => button.addEventListener('click', () => setReadingLevel(button.dataset.readingLevel)));
newReadingButton.addEventListener('click', generateReading);
setReadingLevel(readingLevel);
setReadingMode(readingMode);

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
