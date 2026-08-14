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
// Coding / rover programming
// ----------------------------
const codingBoard = $("#coding-board");
const codingStatus = $("#coding-status");
const codingLevelButtons = $$("[data-coding-level]");
const commandButtons = $$("[data-command]");
const programTimeline = $("#program-timeline");
const programCount = $("#program-count");
const codingRun = $("#coding-run");
const codingClear = $("#coding-clear");
const codingUndo = $("#coding-undo");
const newCodingPuzzle = $("#new-coding-puzzle");
const codingGuideToggle = $("#coding-guide-toggle");
const codingWinOverlay = $("#coding-win-overlay");
const codingWinStars = $("#coding-win-stars");
const codingWinText = $("#coding-win-text");

const CODING_ROWS = 7;
const CODING_COLS = 6;

const codingLevelInfo = {
  easy: {
    minCommands: 7,
    minTurns: 2,
    extraOpenCells: 13,
    maxCommands: 18
  },
  medium: {
    minCommands: 10,
    minTurns: 3,
    extraOpenCells: 7,
    maxCommands: 22
  },
  hard: {
    minCommands: 13,
    minTurns: 4,
    extraOpenCells: 2,
    maxCommands: 28
  }
};

const directionVectors = [
  [-1, 0], // north
  [0, 1],  // east
  [1, 0],  // south
  [0, -1]  // west
];

const commandGlyphs = {
  forward: "↑",
  back: "↓",
  left: "↶",
  right: "↷"
};

const absoluteMoveGlyph = {
  "0,-1": "←",
  "0,1": "→",
  "-1,0": "↑",
  "1,0": "↓"
};

let codingLevel = localStorage.getItem("codingLevel") || "easy";
let codingGuideOn = localStorage.getItem("codingGuideOn") !== "false";
let codingPuzzle = null;
let codingProgram = [];
let codingRunning = false;
let codingRunToken = 0;

codingGuideToggle.checked = codingGuideOn;

function cellKey(row, col) {
  return `${row},${col}`;
}

function codingInBounds(row, col) {
  return row >= 0 && row < CODING_ROWS && col >= 0 && col < CODING_COLS;
}

function codingBlocked(row, col, puzzle = codingPuzzle) {
  return puzzle.obstacles.has(cellKey(row, col));
}

function nextCodingState(state, command, puzzle = codingPuzzle) {
  let { row, col, dir } = state;

  if (command === "left") {
    return { row, col, dir: (dir + 3) % 4, collision: false };
  }

  if (command === "right") {
    return { row, col, dir: (dir + 1) % 4, collision: false };
  }

  const [dr, dc] = directionVectors[dir];
  const sign = command === "back" ? -1 : 1;
  const nr = row + dr * sign;
  const nc = col + dc * sign;

  if (!codingInBounds(nr, nc) || codingBlocked(nr, nc, puzzle)) {
    return { row, col, dir, collision: true };
  }

  return { row: nr, col: nc, dir, collision: false };
}

function codingShortestProgram(puzzle) {
  const start = { row: puzzle.start.row, col: puzzle.start.col, dir: 0 };
  const queue = [{ state: start, path: [] }];
  const seen = new Set([`${start.row},${start.col},${start.dir}`]);
  const commands = ["forward", "back", "left", "right"];

  while (queue.length) {
    const current = queue.shift();
    const s = current.state;

    if (s.row === puzzle.goal.row && s.col === puzzle.goal.col) {
      return current.path;
    }

    for (const command of commands) {
      const n = nextCodingState(s, command, puzzle);
      if (n.collision) continue;

      const key = `${n.row},${n.col},${n.dir}`;
      if (seen.has(key)) continue;

      seen.add(key);
      queue.push({ state: n, path: [...current.path, command] });
    }
  }

  return null;
}

function countProgramTurns(program) {
  return program.filter(command => command === "left" || command === "right").length;
}

// Make one long, self-avoiding route first, then turn most other cells into blocks.
// This produces much more maze-like layouts than simply scattering random blocks.
function makeWindingRoute(start, goal, minimumCells) {
  const path = [{ ...start }];
  const visited = new Set([cellKey(start.row, start.col)]);

  function dfs(row, col) {
    if (
      row === goal.row &&
      col === goal.col &&
      path.length >= minimumCells
    ) {
      return true;
    }

    const candidates = [
      [-1, 0], [0, 1], [0, -1], [1, 0]
    ].map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
     .filter(cell =>
       codingInBounds(cell.row, cell.col) &&
       !visited.has(cellKey(cell.row, cell.col)) &&
       // Do not touch the top row until we enter the goal.
       (cell.row !== 0 || (cell.row === goal.row && cell.col === goal.col))
     );

    // Prefer sideways moves often enough to create bends.
    candidates.sort(() => Math.random() - .5);
    candidates.sort((a, b) => {
      const aSide = a.row === row ? -0.25 : 0;
      const bSide = b.row === row ? -0.25 : 0;
      return (Math.random() + aSide) - (Math.random() + bSide);
    });

    for (const next of candidates) {
      visited.add(cellKey(next.row, next.col));
      path.push(next);

      if (dfs(next.row, next.col)) return true;

      path.pop();
      visited.delete(cellKey(next.row, next.col));
    }

    return false;
  }

  return dfs(start.row, start.col) ? path : null;
}

function buildMazeCandidate(level) {
  const info = codingLevelInfo[level];

  const start = {
    row: CODING_ROWS - 1,
    col: randomInt(0, CODING_COLS - 1)
  };

  let goalCol = randomInt(0, CODING_COLS - 1);
  if (CODING_COLS > 2) {
    while (Math.abs(goalCol - start.col) < 2) {
      goalCol = randomInt(0, CODING_COLS - 1);
    }
  }

  const goal = { row: 0, col: goalCol };

  const routeMinimum =
    level === "easy" ? 9 :
    level === "medium" ? 12 : 15;

  const route = makeWindingRoute(start, goal, routeMinimum);
  if (!route) return null;

  const routeSet = new Set(route.map(cell => cellKey(cell.row, cell.col)));
  const obstacles = new Set();

  for (let row = 0; row < CODING_ROWS; row++) {
    for (let col = 0; col < CODING_COLS; col++) {
      const key = cellKey(row, col);
      if (!routeSet.has(key)) obstacles.add(key);
    }
  }

  // Open a few extra spaces. Easy has more freedom; Hard is closer to a corridor maze.
  const obstacleArray = [...obstacles].sort(() => Math.random() - .5);
  let opened = 0;

  for (const key of obstacleArray) {
    if (opened >= info.extraOpenCells) break;

    const [row, col] = key.split(",").map(Number);
    if (row === 0 || row === CODING_ROWS - 1) continue;

    obstacles.delete(key);
    opened += 1;
  }

  const puzzle = { start, goal, obstacles };
  const solution = codingShortestProgram(puzzle);
  if (!solution) return null;

  const turns = countProgramTurns(solution);

  if (
    solution.length < info.minCommands ||
    solution.length > info.maxCommands ||
    turns < info.minTurns
  ) {
    return null;
  }

  puzzle.solution = solution;
  return puzzle;
}

function buildCodingPuzzle() {
  codingRunToken += 1;
  codingRunning = false;
  codingProgram = [];
  codingWinOverlay.classList.add("hidden");

  let puzzle = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    puzzle = buildMazeCandidate(codingLevel);
    if (puzzle) break;
  }

  // Guaranteed fallback.
  if (!puzzle) {
    const start = { row: 6, col: 1 };
    const goal = { row: 0, col: 4 };
    const open = new Set([
      "6,1","5,1","4,1","4,2","4,3","3,3","2,3","2,4","1,4","0,4",
      "5,0","3,2","1,3"
    ]);
    const obstacles = new Set();

    for (let row = 0; row < CODING_ROWS; row++) {
      for (let col = 0; col < CODING_COLS; col++) {
        const key = cellKey(row, col);
        if (!open.has(key)) obstacles.add(key);
      }
    }

    puzzle = { start, goal, obstacles };
    puzzle.solution = codingShortestProgram(puzzle);
  }

  codingPuzzle = puzzle;
  resetCodingRover(false);

  codingStatus.classList.remove("good", "bad", "resetting");
  codingStatus.textContent = `Can you reach the flag? Best route: ${puzzle.solution.length} commands.`;

  renderCodingBoard();
  renderCodingProgram();
  setCodingControlsEnabled(true);
}

function addGuideMarker(cell, glyph, stepNumber, kind = "") {
  const marker = document.createElement("span");
  marker.className = `guide-marker ${kind}`.trim();
  marker.textContent = glyph;

  const number = document.createElement("span");
  number.className = "guide-step-number";
  number.textContent = stepNumber;
  marker.appendChild(number);

  cell.appendChild(marker);
}

function simulateCodingGuide() {
  const preview = [];
  let state = {
    row: codingPuzzle.start.row,
    col: codingPuzzle.start.col,
    dir: 0
  };

  codingProgram.forEach((command, index) => {
    if (preview.some(item => item.collision)) return;

    const before = { ...state };
    const next = nextCodingState(state, command);

    if (command === "left" || command === "right") {
      preview.push({
        row: before.row,
        col: before.col,
        glyph: command === "left" ? "↶" : "↷",
        step: index + 1,
        kind: "guide-turn",
        collision: false
      });
    } else if (next.collision) {
      const [dr, dc] = directionVectors[before.dir];
      const sign = command === "back" ? -1 : 1;
      preview.push({
        row: before.row,
        col: before.col,
        glyph: "×",
        step: index + 1,
        kind: "guide-collision",
        collision: true
      });
    } else {
      const dr = next.row - before.row;
      const dc = next.col - before.col;
      preview.push({
        row: next.row,
        col: next.col,
        glyph: absoluteMoveGlyph[`${dr},${dc}`] || "•",
        step: index + 1,
        kind: "",
        collision: false
      });
    }

    if (!next.collision) {
      state = { row: next.row, col: next.col, dir: next.dir };
    }
  });

  return preview;
}

function renderCodingBoard() {
  codingBoard.innerHTML = "";
  const guide = codingGuideOn && !codingRunning ? simulateCodingGuide() : [];

  for (let row = 0; row < CODING_ROWS; row++) {
    for (let col = 0; col < CODING_COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";

      if (codingPuzzle.obstacles.has(cellKey(row, col))) {
        cell.classList.add("obstacle");
      }

      const isStart = row === codingPuzzle.start.row && col === codingPuzzle.start.col;
      const isGoal = row === codingPuzzle.goal.row && col === codingPuzzle.goal.col;

      if (isStart) {
        cell.classList.add("start-cell");
        const label = document.createElement("span");
        label.className = "cell-label";
        label.textContent = "START";
        cell.appendChild(label);
      }

      if (isGoal) {
        cell.classList.add("goal-cell");
        const flag = document.createElement("span");
        flag.className = "goal-flag";
        flag.textContent = "🏁";
        cell.appendChild(flag);
      }

      guide
        .filter(item => item.row === row && item.col === col)
        .forEach((item, markerIndex) => {
          const wrapper = document.createElement("span");
          wrapper.style.position = "absolute";
          wrapper.style.inset = "0";
          wrapper.style.display = "grid";
          wrapper.style.placeItems = "center";
          wrapper.style.transform = `translate(${(markerIndex % 2) * 15 - 7}%, ${Math.floor(markerIndex / 2) * 15 - 7}%)`;
          addGuideMarker(wrapper, item.glyph, item.step, item.kind);
          cell.appendChild(wrapper);
        });

      if (row === codingPuzzle.state.row && col === codingPuzzle.state.col) {
        const rover = document.createElement("span");
        rover.className = `rover dir-${codingPuzzle.state.dir}`;
        rover.id = "coding-rover";
        cell.appendChild(rover);
      }

      codingBoard.appendChild(cell);
    }
  }
}

function renderCodingProgram(activeIndex = -1, doneThrough = -1) {
  programCount.textContent = codingProgram.length;
  programTimeline.innerHTML = "";

  if (!codingProgram.length) {
    const empty = document.createElement("span");
    empty.className = "program-empty";
    empty.textContent = "Tap a command below";
    programTimeline.appendChild(empty);
    return;
  }

  codingProgram.forEach((command, index) => {
    const step = document.createElement("span");
    step.className = "program-step";
    step.textContent = commandGlyphs[command];
    step.title = command;

    if (index === activeIndex) step.classList.add("running");
    else if (index <= doneThrough) step.classList.add("done");

    programTimeline.appendChild(step);
  });

  if (activeIndex >= 0 && programTimeline.children[activeIndex]) {
    programTimeline.children[activeIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }
}

function addCodingCommand(command) {
  if (codingRunning || codingProgram.length >= 32) return;

  codingProgram.push(command);
  codingWinOverlay.classList.add("hidden");
  codingStatus.classList.remove("good", "bad", "resetting");
  codingStatus.textContent = codingProgram.length >= 32
    ? "Program full — press Run or remove a step."
    : "Build your program, then press Run.";

  renderCodingProgram();
  renderCodingBoard();
  programTimeline.scrollLeft = programTimeline.scrollWidth;
}

function setCodingControlsEnabled(enabled) {
  commandButtons.forEach(button => button.disabled = !enabled);
  codingUndo.disabled = !enabled;
  codingClear.disabled = !enabled;
  codingRun.disabled = !enabled;
  newCodingPuzzle.disabled = !enabled;
  codingLevelButtons.forEach(button => button.disabled = !enabled);
  codingGuideToggle.disabled = !enabled;
}

function resetCodingRover(render = true) {
  codingPuzzle.state = {
    row: codingPuzzle.start.row,
    col: codingPuzzle.start.col,
    dir: 0
  };

  if (render) renderCodingBoard();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function returnRoverToStart(token) {
  codingStatus.classList.add("resetting");
  await wait(520);

  if (token !== codingRunToken) return;

  resetCodingRover();
  renderCodingProgram();
  codingStatus.classList.remove("resetting");
  codingRunning = false;
  setCodingControlsEnabled(true);
}

async function runCodingProgram() {
  if (codingRunning || !codingProgram.length) {
    if (!codingProgram.length) {
      codingStatus.classList.remove("good");
      codingStatus.classList.add("bad");
      codingStatus.textContent = "Add some commands first.";
    }
    return;
  }

  codingRunning = true;
  const token = ++codingRunToken;
  codingWinOverlay.classList.add("hidden");
  setCodingControlsEnabled(false);
  resetCodingRover();
  renderCodingBoard();

  let completedIndex = -1;

  for (let i = 0; i < codingProgram.length; i++) {
    if (token !== codingRunToken) return;

    renderCodingProgram(i, completedIndex);
    const next = nextCodingState(codingPuzzle.state, codingProgram[i]);

    if (next.collision) {
      codingStatus.classList.remove("good");
      codingStatus.classList.add("bad");
      codingStatus.textContent = "Bonk! The rover hit something.";

      const rover = $("#coding-rover");
      if (rover) rover.classList.add("bump");

      await returnRoverToStart(token);
      return;
    }

    codingPuzzle.state = {
      row: next.row,
      col: next.col,
      dir: next.dir
    };

    renderCodingBoard();
    completedIndex = i;
    await wait(360);

    if (
      codingPuzzle.state.row === codingPuzzle.goal.row &&
      codingPuzzle.state.col === codingPuzzle.goal.col
    ) {
      finishCodingSuccess(i + 1);
      return;
    }
  }

  renderCodingProgram(-1, completedIndex);
  codingStatus.classList.remove("good");
  codingStatus.classList.add("bad");
  codingStatus.textContent = "Not there yet — try changing your program.";
  await returnRoverToStart(token);
}

function finishCodingSuccess(usedCommands) {
  codingRunning = false;
  renderCodingProgram(-1, usedCommands - 1);
  renderCodingBoard();

  codingStatus.classList.remove("bad", "resetting");
  codingStatus.classList.add("good");
  codingStatus.textContent = "You reached the flag!";

  const optimal = codingPuzzle.solution.length;
  const extra = usedCommands - optimal;
  const stars = extra <= 1 ? 3 : extra <= 4 ? 2 : 1;

  codingWinStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  codingWinText.textContent =
    usedCommands === optimal
      ? `Perfect route — ${usedCommands} commands.`
      : `${usedCommands} commands. Best possible is ${optimal}.`;

  codingWinOverlay.classList.remove("hidden");
  setCodingControlsEnabled(true);
}

commandButtons.forEach(button => {
  button.addEventListener("click", () => addCodingCommand(button.dataset.command));
});

codingUndo.addEventListener("click", () => {
  if (codingRunning || !codingProgram.length) return;
  codingProgram.pop();
  codingWinOverlay.classList.add("hidden");
  renderCodingProgram();
  renderCodingBoard();
});

codingClear.addEventListener("click", () => {
  if (codingRunning) return;

  codingProgram = [];
  codingWinOverlay.classList.add("hidden");
  resetCodingRover(false);

  codingStatus.classList.remove("good", "bad", "resetting");
  codingStatus.textContent = "Build your program, then press Run.";

  renderCodingProgram();
  renderCodingBoard();
});

codingRun.addEventListener("click", runCodingProgram);
newCodingPuzzle.addEventListener("click", buildCodingPuzzle);

codingGuideToggle.addEventListener("change", () => {
  codingGuideOn = codingGuideToggle.checked;
  localStorage.setItem("codingGuideOn", codingGuideOn ? "true" : "false");
  renderCodingBoard();
});

codingLevelButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (codingRunning) return;

    codingLevel = button.dataset.codingLevel;
    localStorage.setItem("codingLevel", codingLevel);

    codingLevelButtons.forEach(b => {
      b.classList.toggle("active", b.dataset.codingLevel === codingLevel);
    });

    buildCodingPuzzle();
  });
});

codingLevelButtons.forEach(button => {
  button.classList.toggle("active", button.dataset.codingLevel === codingLevel);
});

buildCodingPuzzle();


// ----------------------------
// Laser Lab
// ----------------------------
const laserBoard = $("#laser-board");
const laserBeamLayer = $("#laser-beam-layer");
const laserStatus = $("#laser-status");
const laserLevelButtons = $$("[data-laser-level]");
const laserPieceButtons = $$("[data-laser-piece]");
const laserNewButton = $("#laser-new");
const laserMirrorCount = $("#laser-mirror-count");
const laserCheckpointCount = $("#laser-checkpoint-count");
const laserResult = $("#laser-result");
const laserResultStars = $("#laser-result-stars");
const laserResultText = $("#laser-result-text");

const laserLevelInfo = {
  easy: {
    rows: 10,
    cols: 8,
    mirrors: 3,
    checkpoints: 1,
    extraOpen: 18
  },
  medium: {
    rows: 12,
    cols: 9,
    mirrors: 5,
    checkpoints: 2,
    extraOpen: 10
  },
  hard: {
    rows: 14,
    cols: 10,
    mirrors: 7,
    checkpoints: 3,
    extraOpen: 4
  }
};

// Direction indices clockwise in 45° steps:
// 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW.
const laserDirVectors = [
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1]
];

let laserLevel = localStorage.getItem("laserLevel") || "easy";
let laserSelectedPiece = "mirror";
let laserPuzzle = null;
let laserPlaced = new Map();

function laserInfo() {
  return laserLevelInfo[laserLevel];
}

function laserRows() {
  return laserInfo().rows;
}

function laserCols() {
  return laserInfo().cols;
}

function laserKey(row, col) {
  return `${row},${col}`;
}

function laserInBounds(row, col) {
  return row >= 0 && row < laserRows() && col >= 0 && col < laserCols();
}

function laserDirAngle(dir) {
  return (dir * 45 - 90 + 360) % 360;
}

function mirrorLineAngle(orientation) {
  return orientation * 22.5;
}

function normalizeAngle(angle) {
  angle %= 360;
  if (angle < 0) angle += 360;
  return angle;
}

function angleToLaserDir(angle) {
  const normalized = normalizeAngle(angle);
  const dir = Math.round((normalized + 90) / 45);
  return ((dir % 8) + 8) % 8;
}

function laserReflect(dir, orientation) {
  const incoming = laserDirAngle(dir);
  const mirror = mirrorLineAngle(orientation);
  return angleToLaserDir(2 * mirror - incoming);
}

function mirrorOrientationForTurn(inDir, outDir) {
  for (let orientation = 0; orientation < 8; orientation++) {
    if (laserReflect(inDir, orientation) === outDir) return orientation;
  }
  return null;
}

function laserDirectionBetween(a, b) {
  const dr = Math.sign(b.row - a.row);
  const dc = Math.sign(b.col - a.col);
  return laserDirVectors.findIndex(([r, c]) => r === dr && c === dc);
}

function addStraightSegment(route, from, to) {
  let row = from.row;
  let col = from.col;
  const dr = Math.sign(to.row - row);
  const dc = Math.sign(to.col - col);

  while (row !== to.row || col !== to.col) {
    row += dr;
    col += dc;
    route.push({ row, col });
  }
}

function rotateTemplatePoint(point, rows, cols, rotation) {
  const r = point.row;
  const c = point.col;

  if (rotation === 0) return { row: r, col: c };
  if (rotation === 1) return { row: c, col: rows - 1 - r };
  if (rotation === 2) return { row: rows - 1 - r, col: cols - 1 - c };
  return { row: cols - 1 - c, col: r };
}

// Constructive generator: builds a known-good route directly from a few safe templates.
// No recursive search, no repeated brute-force retries.
function buildConstructiveLaserPuzzle() {
  const info = laserInfo();
  const rows = info.rows;
  const cols = info.cols;

  // Template lives in current board coordinates. We deliberately use mostly
  // orthogonal travel with a couple of diagonals so reflection stays readable.
  let waypoints;

  if (laserLevel === "easy") {
    waypoints = [
      { row: rows - 1, col: 1 },
      { row: rows - 5, col: 1 },
      { row: rows - 7, col: 3 },
      { row: 2, col: 3 },
      { row: 0, col: cols - 2 }
    ];
  } else if (laserLevel === "medium") {
    waypoints = [
      { row: rows - 1, col: 1 },
      { row: rows - 5, col: 1 },
      { row: rows - 7, col: 3 },
      { row: rows - 7, col: cols - 3 },
      { row: rows - 10, col: cols - 3 },
      { row: 2, col: 3 },
      { row: 0, col: cols - 2 }
    ];
  } else {
    waypoints = [
      { row: rows - 1, col: 1 },
      { row: rows - 5, col: 1 },
      { row: rows - 7, col: 3 },
      { row: rows - 7, col: cols - 3 },
      { row: rows - 10, col: cols - 3 },
      { row: rows - 10, col: 3 },
      { row: 4, col: 3 },
      { row: 2, col: cols - 3 },
      { row: 0, col: cols - 2 }
    ];
  }

  // Horizontal mirror for variety.
  if (Math.random() < 0.5) {
    waypoints = waypoints.map(p => ({ row: p.row, col: cols - 1 - p.col }));
  }

  // Small vertical variation on internal waypoints, clamped to safe interior cells.
  for (let i = 1; i < waypoints.length - 1; i++) {
    if (Math.random() < 0.35) {
      const delta = Math.random() < 0.5 ? -1 : 1;
      waypoints[i].row = Math.max(1, Math.min(rows - 2, waypoints[i].row + delta));
    }
  }

  const route = [{ ...waypoints[0] }];
  for (let i = 1; i < waypoints.length; i++) {
    addStraightSegment(route, waypoints[i - 1], waypoints[i]);
  }

  // Remove accidental duplicate cells from waypoint joins.
  const compactRoute = [];
  const seen = new Set();
  for (const cell of route) {
    const key = laserKey(cell.row, cell.col);
    if (seen.has(key)) continue;
    seen.add(key);
    compactRoute.push(cell);
  }

  // Work out the emitter direction from first move.
  const emitter = {
    row: compactRoute[0].row,
    col: compactRoute[0].col,
    dir: laserDirectionBetween(compactRoute[0], compactRoute[1])
  };

  const target = {
    row: compactRoute[compactRoute.length - 1].row,
    col: compactRoute[compactRoute.length - 1].col
  };

  const mirrorCells = [];
  let inDir = emitter.dir;

  for (let i = 1; i < compactRoute.length - 1; i++) {
    const outDir = laserDirectionBetween(compactRoute[i], compactRoute[i + 1]);
    if (outDir !== inDir) {
      const orientation = mirrorOrientationForTurn(inDir, outDir);
      if (orientation !== null) {
        mirrorCells.push({
          row: compactRoute[i].row,
          col: compactRoute[i].col,
          orientation
        });
      }
      inDir = outDir;
    }
  }

  // If a random variation shortened the number of corners, supplement with
  // route corners only up to the level target. Never exceed the actual route.
  const desiredMirrors = info.mirrors;
  const usableMirrors = mirrorCells.slice(0, desiredMirrors);

  // Choose checkpoints from straight cells and spread them evenly across the route.
  const mirrorKeys = new Set(usableMirrors.map(m => laserKey(m.row, m.col)));

  const straightCandidates = compactRoute
    .map((cell, index) => ({ ...cell, index }))
    .filter(item => {
      if (item.index <= 1 || item.index >= compactRoute.length - 2) return false;
      if (mirrorKeys.has(laserKey(item.row, item.col))) return false;

      const prev = compactRoute[item.index - 1];
      const next = compactRoute[item.index + 1];
      return laserDirectionBetween(prev, item) === laserDirectionBetween(item, next);
    });

  const checkpoints = [];
  for (let i = 0; i < info.checkpoints; i++) {
    const targetIndex = Math.round(
      ((i + 1) / (info.checkpoints + 1)) * (compactRoute.length - 1)
    );

    let best = null;
    for (const candidate of straightCandidates) {
      if (checkpoints.some(cp => cp.row === candidate.row && cp.col === candidate.col)) continue;
      const distance = Math.abs(candidate.index - targetIndex);
      if (!best || distance < best.distance) {
        best = { candidate, distance };
      }
    }

    if (best) {
      checkpoints.push({
        row: best.candidate.row,
        col: best.candidate.col
      });
    }
  }

  const routeKeys = new Set(compactRoute.map(cell => laserKey(cell.row, cell.col)));
  const obstacles = new Set();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = laserKey(row, col);
      if (!routeKeys.has(key)) obstacles.add(key);
    }
  }

  // Open a limited number of decoy cells. We choose deterministically-ish from
  // shuffled candidates, but this is cheap and never retries generation.
  const obstacleList = [...obstacles].sort(() => Math.random() - .5);
  let opened = 0;

  for (const key of obstacleList) {
    if (opened >= info.extraOpen) break;

    const [row, col] = key.split(",").map(Number);
    const onEdge =
      row === 0 || row === rows - 1 ||
      col === 0 || col === cols - 1;

    if (onEdge) continue;

    obstacles.delete(key);
    opened++;
  }

  return {
    emitter,
    target,
    checkpoints,
    obstacles,
    solutionMirrors: usableMirrors,
    mirrorLimit: usableMirrors.length,
    route: compactRoute
  };
}

function buildLaserPuzzle() {
  laserPlaced = new Map();
  laserResult.classList.add("hidden");

  laserPuzzle = buildConstructiveLaserPuzzle();

  const info = laserInfo();
  laserBoard.style.setProperty("--laser-cols", info.cols);
  laserBoard.style.setProperty("--laser-rows", info.rows);
  laserBoard.style.aspectRatio = `${info.cols} / ${info.rows}`;

  renderLaserBoard();
  traceLaser();
}

function emitterClassFromDir(dir) {
  if (dir === 2) return "dir-right";
  if (dir === 6) return "dir-left";
  if (dir === 0) return "dir-up";
  if (dir === 4) return "dir-down";
  return "dir-right";
}

function renderLaserBoard() {
  laserBoard.innerHTML = "";

  for (let row = 0; row < laserRows(); row++) {
    for (let col = 0; col < laserCols(); col++) {
      const key = laserKey(row, col);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "laser-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (laserPuzzle.obstacles.has(key)) {
        cell.classList.add("obstacle");
        cell.disabled = true;
      }

      const isEmitter =
        row === laserPuzzle.emitter.row &&
        col === laserPuzzle.emitter.col;

      const isTarget =
        row === laserPuzzle.target.row &&
        col === laserPuzzle.target.col;

      const checkpoint = laserPuzzle.checkpoints.find(
        cp => cp.row === row && cp.col === col
      );

      if (isEmitter) {
        cell.classList.add("emitter-cell");
        const emitter = document.createElement("span");
        emitter.className = `laser-emitter ${emitterClassFromDir(laserPuzzle.emitter.dir)}`;
        cell.appendChild(emitter);
        cell.disabled = true;
      }

      if (isTarget) {
        cell.classList.add("target-cell");
        const target = document.createElement("span");
        target.className = "laser-target";
        target.id = "laser-target-indicator";
        cell.appendChild(target);
        cell.disabled = true;
      }

      if (checkpoint) {
        cell.classList.add("checkpoint-cell");
        const marker = document.createElement("span");
        marker.className = "laser-checkpoint";
        marker.dataset.checkpoint = key;
        cell.appendChild(marker);
      }

      if (laserPlaced.has(key)) {
        const orientation = laserPlaced.get(key);
        const mirror = document.createElement("span");
        mirror.className = `laser-mirror angle-${orientation}`;
        cell.appendChild(mirror);
      }

      if (!cell.disabled) {
        cell.addEventListener("click", () => placeLaserPiece(row, col));
      }

      laserBoard.appendChild(cell);
    }
  }
}

function placeLaserPiece(row, col) {
  const key = laserKey(row, col);

  if (laserPuzzle.obstacles.has(key)) return;
  if (row === laserPuzzle.emitter.row && col === laserPuzzle.emitter.col) return;
  if (row === laserPuzzle.target.row && col === laserPuzzle.target.col) return;

  const isCheckpoint = laserPuzzle.checkpoints.some(
    checkpoint => checkpoint.row === row && checkpoint.col === col
  );

  if (isCheckpoint) {
    laserStatus.classList.remove("good");
    laserStatus.classList.add("bad");
    laserStatus.textContent = "Checkpoints must stay clear so the beam can pass through.";
    return;
  }

  if (laserSelectedPiece === "eraser") {
    laserPlaced.delete(key);
  } else {
    if (laserPlaced.has(key)) {
      laserPlaced.set(key, (laserPlaced.get(key) + 1) % 8);
    } else {
      if (laserPlaced.size >= laserPuzzle.mirrorLimit) {
        laserStatus.classList.remove("good");
        laserStatus.classList.add("bad");
        laserStatus.textContent = "No mirrors left — rotate one or erase one.";
        return;
      }

      laserPlaced.set(key, 2);
    }
  }

  laserResult.classList.add("hidden");
  renderLaserBoard();
  traceLaser();
}

function laserCellCenter(row, col) {
  return [(col + 0.5) * 100, (row + 0.5) * 100];
}

function traceLaser() {
  laserBeamLayer.innerHTML = "";

  const width = laserCols() * 100;
  const height = laserRows() * 100;
  laserBeamLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);

  laserStatus.classList.remove("good", "bad");

  const points = [];
  let row = laserPuzzle.emitter.row;
  let col = laserPuzzle.emitter.col;
  let dir = laserPuzzle.emitter.dir;
  let hitTarget = false;
  const hitCheckpoints = new Set();
  const seenStates = new Set();

  points.push(laserCellCenter(row, col));

  for (let steps = 0; steps < 350; steps++) {
    const stateKey = `${row},${col},${dir}`;
    if (seenStates.has(stateKey)) break;
    seenStates.add(stateKey);

    const [dr, dc] = laserDirVectors[dir];
    const nr = row + dr;
    const nc = col + dc;

    if (!laserInBounds(nr, nc)) {
      points.push([
        (col + 0.5 + dc * 0.5) * 100,
        (row + 0.5 + dr * 0.5) * 100
      ]);
      break;
    }

    if (laserPuzzle.obstacles.has(laserKey(nr, nc))) {
      points.push([
        (col + 0.5 + dc * 0.5) * 100,
        (row + 0.5 + dr * 0.5) * 100
      ]);
      break;
    }

    row = nr;
    col = nc;
    points.push(laserCellCenter(row, col));

    const key = laserKey(row, col);

    if (laserPuzzle.checkpoints.some(cp => laserKey(cp.row, cp.col) === key)) {
      hitCheckpoints.add(key);
    }

    if (row === laserPuzzle.target.row && col === laserPuzzle.target.col) {
      hitTarget = true;
      break;
    }

    if (laserPlaced.has(key)) {
      dir = laserReflect(dir, laserPlaced.get(key));
    }
  }

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("class", "laser-beam-line");
  polyline.setAttribute("points", points.map(([x, y]) => `${x},${y}`).join(" "));
  laserBeamLayer.appendChild(polyline);

  document.querySelectorAll(".laser-checkpoint").forEach(marker => {
    marker.classList.toggle("hit", hitCheckpoints.has(marker.dataset.checkpoint));
  });

  const targetIndicator = $("#laser-target-indicator");
  if (targetIndicator) targetIndicator.classList.toggle("hit", hitTarget);

  const mirrorsUsed = laserPlaced.size;
  laserMirrorCount.textContent = `${mirrorsUsed} / ${laserPuzzle.mirrorLimit}`;
  laserCheckpointCount.textContent = `${hitCheckpoints.size} / ${laserPuzzle.checkpoints.length}`;

  const allCheckpointsHit =
    hitCheckpoints.size === laserPuzzle.checkpoints.length;

  if (hitTarget && allCheckpointsHit) {
    laserStatus.classList.add("good");
    laserStatus.textContent = "Perfect — the whole beam path is complete!";

    const optimal = laserPuzzle.solutionMirrors.length;
    const extra = mirrorsUsed - optimal;
    const stars = extra <= 0 ? 3 : extra === 1 ? 2 : 1;

    laserResultStars.textContent =
      "★".repeat(stars) + "☆".repeat(3 - stars);

    laserResultText.textContent =
      mirrorsUsed === optimal
        ? `Perfect solution — ${mirrorsUsed} mirrors.`
        : `${mirrorsUsed} mirrors used. Best is ${optimal}.`;

    laserResult.classList.remove("hidden");
  } else if (hitTarget && !allCheckpointsHit) {
    laserStatus.classList.add("bad");
    laserStatus.textContent = "The target was hit, but a checkpoint was missed.";
    laserResult.classList.add("hidden");
  } else {
    laserStatus.textContent = "Place mirrors, then watch the beam update.";
    laserResult.classList.add("hidden");
  }
}

laserPieceButtons.forEach(button => {
  button.addEventListener("click", () => {
    laserSelectedPiece = button.dataset.laserPiece;
    laserPieceButtons.forEach(b =>
      b.classList.toggle("active", b === button)
    );
  });
});

laserLevelButtons.forEach(button => {
  button.addEventListener("click", () => {
    laserLevel = button.dataset.laserLevel;
    localStorage.setItem("laserLevel", laserLevel);

    laserLevelButtons.forEach(b => {
      b.classList.toggle("active", b.dataset.laserLevel === laserLevel);
    });

    buildLaserPuzzle();
  });
});

laserLevelButtons.forEach(button => {
  button.classList.toggle("active", button.dataset.laserLevel === laserLevel);
});

laserNewButton.addEventListener("click", buildLaserPuzzle);

buildLaserPuzzle();

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
