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
    "The cat sat on the mat.","A red hen ran up the hill.","The dog can dig in the mud.",
    "I can see a big green frog.","The sun is hot and bright.","The fish swam in the pond.",
    "Dad had a red hat.","The fox ran into the den.","A duck sat on the wet grass.",
    "We can jump and skip.","The crab hid in the sand.","The black cat had a nap.",
    "I can clap my hands.","The frog can jump on the log.","The ship went past the rocks.",
    "The chick is in the nest.","The rain fell on the path.","The goat went up the hill.",
    "She can see the moon.","He put his coat on.","We went to the park.",
    "They can play in the sand.","You can sit with me.","The little dog is here.",
    "There is a bird in the tree.","My book is on the chair.","The girl has a blue bag.",
    "The boy went home.","I like this red kite.","We have some fresh milk.",
    "Come and look at the frog.","The train went down the track.","The sheep stood by the gate.",
    "The snail went along the path.","The queen sat on a chair.","The light was bright.",
    "The boat can float.","The cow stood in the field.","The bee buzzed by the flower.",
    "The moon shone at night.","The brown owl sat in the tree.","The horse ran past the gate."
  ],
  medium: [
    "The little rabbit hopped across the grass.","We went to the park after lunch.",
    "The bright moon shone over the houses.","My sister found a shell on the beach.",
    "The children played with a yellow ball.","A small bird landed beside the pond.",
    "The farmer shut the gate before dark.","The puppy splashed in a muddy puddle.",
    "She carried her book into the garden.","The train stopped beside the old bridge.",
    "We could hear the rain on the roof.","The squirrel climbed quickly up the tree.",
    "The kitten curled up under the chair.","Three ducks swam slowly across the lake.",
    "The boy helped his friend find her coat.","I would like to visit the farm again.",
    "There were two rabbits near the hedge.","People waited for the bus in the rain.",
    "The children made a den behind the tree.","She looked through the window at the snow.",
    "The biggest snail crawled under a leaf.","The runner was quicker than his friend.",
    "We are going to bake some cakes.","I am helping Dad wash the car.",
    "The birds are singing in the garden.","The dog jumped over the fallen branch.",
    "My friend gave me a funny little card.","The green frog disappeared into the pond.",
    "The children shouted when the race began.","A tiny spider climbed across the wall.",
    "The wind blew leaves along the road.","We packed our lunch before the long walk.",
    "The boat rocked gently beside the harbour.","The fox watched quietly from behind a bush.",
    "The girl smiled when she found her glove.","The rabbit was hiding beneath the bench.",
    "The teacher read a story about a dragon.","We watched the clouds move across the sky.",
    "The little boat sailed around the island.","The children were excited about the trip.",
    "She opened the box and found a surprise.","The fastest runner reached the line first.",
    "The ducks followed their mother to the water.","I’ll bring my boots if it starts to rain."
  ],
  hard: [
    "After breakfast, we walked through the woods and listened for birds.",
    "The enormous dragon stretched its wings before flying over the castle.",
    "When the rain stopped, the children hurried outside to find puddles.",
    "A curious squirrel watched us carefully from the highest branch.",
    "The lighthouse flashed across the dark sea while the boats sailed home.",
    "We collected smooth stones, tiny shells and feathers along the beach.",
    "The little fox disappeared quietly between the trees before we could follow.",
    "Although the path was muddy, everyone enjoyed walking through the forest.",
    "The children whispered because they did not want to wake the sleeping baby.",
    "Before bedtime, Dad read another chapter of our favourite adventure story.",
    "The bright rainbow appeared when the sunshine broke through the clouds.",
    "Our teacher showed us how caterpillars slowly change into butterflies.",
    "The excited children carried their buckets and spades towards the sea.",
    "When we reached the top of the hill, we could see the whole village.",
    "The puppy wagged its tail because somebody had opened the garden gate.",
    "My brother couldn’t find his gloves, so we looked underneath the sofa.",
    "The old wooden bridge creaked as we carefully walked across the stream.",
    "A family of ducks followed one another around the edge of the quiet pond.",
    "The astronaut looked through the window and watched Earth turning below.",
    "We planted sunflower seeds and wondered which plant would grow the tallest.",
    "The children discovered a narrow path hidden behind the thick green bushes.",
    "During the storm, flashes of lightning lit up the sky above our house.",
    "The smallest boat sailed towards the harbour while waves splashed over its side.",
    "The hungry hedgehog searched underneath the leaves for something to eat.",
    "After the race, everyone cheered for the runners and clapped their hands.",
    "The young explorer carefully drew a map so that she could find her way home.",
    "When the music started, the children danced happily around the crowded room.",
    "The enormous dinosaur left footprints across the soft ground beside the river.",
    "We watched a spider patiently build its web between two branches.",
    "The knight opened the heavy wooden door and stepped quietly into the tower.",
    "Because the night was clear, we could see hundreds of stars above the garden.",
    "The children took turns reading the funny poem aloud to the class.",
    "A sudden gust of wind lifted the kite high above the trees.",
    "The rabbit’s ears twitched when it heard a strange noise behind the fence.",
    "We followed the winding path until we reached a waterfall hidden in the woods.",
    "The magician reached into his pocket and pulled out a bright red handkerchief.",
    "Our picnic had to move indoors because dark clouds were gathering overhead.",
    "The little robot rolled across the floor and carefully picked up the blue cube.",
    "Everyone became quiet when the storyteller began the mysterious tale.",
    "The dolphin leapt out of the water before disappearing beneath the waves.",
    "She carried the basket carefully because it was filled with freshly picked apples.",
    "The children compared their drawings and explained which parts they liked best.",
    "After finishing the story, we talked about why the character had changed her mind.",
    "The owl remained completely still until a tiny mouse moved through the grass.",
    "If the weather stays sunny tomorrow, we’ll take our bikes along the canal."
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
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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



// Reading aloud using the device/browser speech synthesiser.
const readingSpeakButton = $("#reading-speak");
const readingSpeakLabel = $("#reading-speak-label");
const readingSpeedButtons = $$("[data-reading-speed]");
const readingVoiceSelect = $("#reading-voice-select");
let readingVoiceKey = localStorage.getItem("readingVoiceKey") || "";
let readingSpeechRate = Number(localStorage.getItem("readingSpeechRate") || 0.95);

function setReadingSpeechRate(rate) {
  readingSpeechRate = Number(rate);
  localStorage.setItem("readingSpeechRate", String(readingSpeechRate));
  readingSpeedButtons.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.readingSpeed) === readingSpeechRate);
  });
}

function stopReadingSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  readingSpeakButton.classList.remove("speaking");
  readingSpeakLabel.textContent = "Read aloud";
}

function readingTextForSpeech() {
  if (readingMode === "read") return readingPrompt.textContent.trim();
  if (!activeReadingTest) return "";
  return activeReadingTest.sentence.replace("___", " ... ");
}

function readingVoiceId(v){return `${v.name}||${v.lang}`;}
function populateReadingVoices(){
  if(!("speechSynthesis" in window))return;
  const voices=window.speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)).sort((a,b)=>(/^en-GB$/i.test(a.lang)?0:1)-(/^en-GB$/i.test(b.lang)?0:1)||a.name.localeCompare(b.name));
  readingVoiceSelect.innerHTML='<option value="">Default English voice</option>';
  voices.forEach(v=>{const o=document.createElement("option");o.value=readingVoiceId(v);o.textContent=`${v.name} (${v.lang})`;readingVoiceSelect.appendChild(o);});
  if([...readingVoiceSelect.options].some(o=>o.value===readingVoiceKey))readingVoiceSelect.value=readingVoiceKey;
}
function chooseReadingVoice(){
  if(!("speechSynthesis" in window))return null;
  const voices=window.speechSynthesis.getVoices();
  return (readingVoiceKey&&voices.find(v=>readingVoiceId(v)===readingVoiceKey))||voices.find(v=>/^en-GB$/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||voices[0]||null;
}

function speakReadingText() {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    readingFeedback.classList.remove("good");
    readingFeedback.classList.add("bad");
    readingFeedback.textContent = "Read aloud is not available on this device.";
    return;
  }

  if (window.speechSynthesis.speaking) {
    stopReadingSpeech();
    return;
  }

  const text = readingTextForSpeech();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = readingSpeechRate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = chooseReadingVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    readingSpeakButton.classList.add("speaking");
    readingSpeakLabel.textContent = "Stop";
  };
  utterance.onend = stopReadingSpeech;
  utterance.onerror = stopReadingSpeech;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

readingSpeakButton.addEventListener("click", speakReadingText);
readingSpeedButtons.forEach(button => {
  button.addEventListener("click", () => {
    stopReadingSpeech();
    setReadingSpeechRate(button.dataset.readingSpeed);
  });
});
setReadingSpeechRate(readingSpeechRate);
readingVoiceSelect.addEventListener("change",()=>{stopReadingSpeech();readingVoiceKey=readingVoiceSelect.value;localStorage.setItem("readingVoiceKey",readingVoiceKey);});
populateReadingVoices();
if("speechSynthesis" in window)window.speechSynthesis.addEventListener?.("voiceschanged",populateReadingVoices);

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.screen !== "reading-screen") stopReadingSpeech();
  });
});


// ----------------------------
// Real World Maths
// ----------------------------
const realmStory=$("#realm-story"),realmQuestion=$("#realm-question"),realmAnswer=$("#realm-answer"),realmUnit=$("#realm-unit"),realmFeedback=$("#realm-feedback");
const realmCats=$$("[data-realm-category]"),realmLevels=$$("[data-realm-level]");let realmCategory="money",realmLevel="easy",realmCurrent;
const realmNames=["Sam","Mia","Leo","Ava","Noah","Ruby","Ben","Ella","Jack","Sophie"],rpick=a=>a[Math.floor(Math.random()*a.length)],pounds=p=>`£${(p/100).toFixed(2)}`;
function makeMoney(l){const n=rpick(realmNames),items=[["sandwich",200],["drink",120],["apple",60],["wrap",250],["juice",140],["cake",90]],a=rpick(items),b=rpick(items.filter(x=>x!==a));let p1=a[1],p2=b[1];if(l==="medium"){p1+=rpick([5,10,15,20]);p2+=rpick([5,10,15,20])}if(l==="hard"){p1+=rpick([17,25,35,45]);p2+=rpick([12,28,38,48])}const total=p1+p2,cash=l==="easy"?500:1000,ask=l!=="easy"||Math.random()>.5;return{story:`${n} goes to the shop for lunch. ${n} buys a ${a[0]} for ${pounds(p1)} and a ${b[0]} for ${pounds(p2)}. ${n} has ${pounds(cash)}.`,question:ask?`How much change does ${n} get?`:"How much does the lunch cost altogether?",answer:(ask?cash-total:total)/100,unit:"£"}}
function makeCooking(l){const n=rpick(realmNames);if(l==="easy"){let e=rpick([50,100,150]),c=rpick([2,3,4]);return{story:`${n} makes ${c} cakes. Each needs ${e} g of mixture.`,question:"How many grams are needed altogether?",answer:e*c,unit:"g"}}if(l==="medium"){let h=rpick([500,750,1000]),u=rpick([150,200,250]);return{story:`${n} has ${h} g of flour and uses ${u} g.`,question:"How many grams are left?",answer:h-u,unit:"g"}}let e=rpick([125,150,175,200]),c=rpick([3,4,5]);return{story:`A recipe needs ${e} g of flour for one batch. ${n} makes ${c} batches.`,question:"How much flour is needed?",answer:e*c,unit:"g"}}
function makeDistance(l){const n=rpick(realmNames);if(l==="easy"){let a=rpick([100,200,300]),b=rpick([100,200,300]);return{story:`${n} walks ${a} m to the park, then ${b} m to the pond.`,question:"How far altogether?",answer:a+b,unit:"m"}}if(l==="medium"){let t=rpick([1000,1200,1500]),d=rpick([300,400,500]);return{story:`${n} is walking a ${t} m trail and has walked ${d} m.`,question:"How many metres are left?",answer:t-d,unit:"m"}}let k=rpick([2,3,4]),e=rpick([250,500,750]);return{story:`${n} cycles ${k} km, then another ${e} m.`,question:"How far is that altogether in metres?",answer:k*1000+e,unit:"m"}}
function makeTime(l){const n=rpick(realmNames);if(l==="easy"){let m=rpick([10,15,20,30]);return{story:`${n} reads for ${m} minutes.`,question:`How many minutes does ${n} read for?`,answer:m,unit:"min"}}if(l==="medium"){let h=rpick([1,2]),m=rpick([15,30]);return{story:`${n} travels for ${h} hour${h>1?"s":""} and ${m} minutes.`,question:"How many minutes is that altogether?",answer:h*60+m,unit:"min"}}let d=rpick([45,60,90]);return{story:`${n} starts an activity at 10:00. It lasts ${d} minutes.`,question:"How many minutes long is the activity?",answer:d,unit:"min"}}
function generateRealm(){if("speechSynthesis"in window)window.speechSynthesis.cancel();realmCurrent=({money:makeMoney,cooking:makeCooking,distance:makeDistance,time:makeTime})[realmCategory](realmLevel);realmStory.textContent=realmCurrent.story;realmQuestion.textContent=realmCurrent.question;realmUnit.textContent=realmCurrent.unit;realmAnswer.value="";realmFeedback.className="realm-feedback";realmFeedback.textContent="Have a go!"}
function checkRealm(){const v=Number(realmAnswer.value.replace("£","").replace(",",".")),ok=Number.isFinite(v)&&Math.abs(v-realmCurrent.answer)<.001;realmFeedback.className=`realm-feedback ${ok?"good":"bad"}`;realmFeedback.textContent=ok?"That’s right! ★":"Not quite — have another go."}
realmCats.forEach(b=>b.addEventListener("click",()=>{realmCategory=b.dataset.realmCategory;realmCats.forEach(x=>x.classList.toggle("active",x===b));generateRealm()}));realmLevels.forEach(b=>b.addEventListener("click",()=>{realmLevel=b.dataset.realmLevel;realmLevels.forEach(x=>x.classList.toggle("active",x===b));generateRealm()}));$("#realm-check").addEventListener("click",checkRealm);realmAnswer.addEventListener("keydown",e=>{if(e.key==="Enter")checkRealm()});$("#realm-new").addEventListener("click",generateRealm);$("#realm-speak").addEventListener("click",()=>{if(!realmCurrent||!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`${realmCurrent.story} ${realmCurrent.question}`);u.rate=readingSpeechRate;const v=chooseReadingVoice();if(v)u.voice=v;window.speechSynthesis.speak(u)});generateRealm();


// ----------------------------
// Gravity
// ----------------------------
const gravityCanvas = $("#gravity-canvas");
const gravityCtx = gravityCanvas.getContext("2d");
const gravityLeft = $("#gravity-left");
const gravityRight = $("#gravity-right");
const gravityThrust = $("#gravity-thrust");
const gravityReset = $("#gravity-reset");
const gravityAgain = $("#gravity-again");
const gravityMessage = $("#gravity-message");
const gravityMessageTitle = $("#gravity-message-title");
const gravityMessageText = $("#gravity-message-text");
const gravityHeight = $("#gravity-height");
const gravitySpeed = $("#gravity-speed");

const GW = gravityCanvas.width;
const GH = gravityCanvas.height;

const gravityInput = {
  left: false,
  right: false,
  thrust: false
};

const gravityWorld = {
  // Deliberately gentle, floaty physics for touch play.
  gravity: 0.045,
  thrust: 0.095,
  rotationSpeed: 0.034,
  drag: 0.996,
  maxSpeed: 4.2,
  running: true
};

// Hand-built cavern. Each rectangle is a solid wall.
const gravityWalls = [
  {x:0, y:0, w:38, h:1040},
  {x:682, y:0, w:38, h:1040},

  {x:38, y:920, w:185, h:28},
  {x:500, y:920, w:182, h:28},

  {x:38, y:760, w:210, h:26},
  {x:405, y:690, w:277, h:26},

  {x:38, y:530, w:270, h:26},
  {x:470, y:470, w:212, h:26},

  {x:38, y:300, w:190, h:26},
  {x:370, y:255, w:312, h:26}
];

const gravityStartPad = {x:282, y:956, w:156, h:18};
const gravityGoalPad = {x:270, y:92, w:180, h:18};

let rocket;

function resetGravityGame() {
  rocket = {
    x: 360,
    y: 910,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 16,
    landed: false,
    crashed: false
  };

  gravityWorld.running = true;
  gravityInput.left = gravityInput.right = gravityInput.thrust = false;
  gravityMessage.classList.add("hidden");
}

function gravityRectCircleCollision(rect, x, y, r) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

function gravityPadLanding(pad) {
  const withinX = rocket.x > pad.x + 12 && rocket.x < pad.x + pad.w - 12;
  const bottom = rocket.y + rocket.radius;
  const nearTop = bottom >= pad.y - 4 && bottom <= pad.y + 12;
  return withinX && nearTop;
}

function crashGravity(reason = "Rocket crashed") {
  if (!gravityWorld.running) return;
  gravityWorld.running = false;
  rocket.crashed = true;
  gravityMessageTitle.textContent = "Crash!";
  gravityMessageText.textContent = reason;
  gravityMessage.classList.remove("hidden");
}

function winGravity() {
  if (!gravityWorld.running) return;
  gravityWorld.running = false;
  rocket.landed = true;
  gravityMessageTitle.textContent = "Nice landing!";
  gravityMessageText.textContent = "You reached the top landing pad.";
  gravityMessage.classList.remove("hidden");
}

function updateGravity() {
  if (!gravityWorld.running) return;

  if (gravityInput.left) rocket.angle -= gravityWorld.rotationSpeed;
  if (gravityInput.right) rocket.angle += gravityWorld.rotationSpeed;

  if (gravityInput.thrust) {
    rocket.vx += Math.sin(rocket.angle) * gravityWorld.thrust;
    rocket.vy -= Math.cos(rocket.angle) * gravityWorld.thrust;
  }

  rocket.vy += gravityWorld.gravity;
  rocket.vx *= gravityWorld.drag;
  rocket.vy *= gravityWorld.drag;

  const speed = Math.hypot(rocket.vx, rocket.vy);
  if (speed > gravityWorld.maxSpeed) {
    rocket.vx = rocket.vx / speed * gravityWorld.maxSpeed;
    rocket.vy = rocket.vy / speed * gravityWorld.maxSpeed;
  }

  rocket.x += rocket.vx;
  rocket.y += rocket.vy;

  // World boundaries
  if (rocket.x < rocket.radius || rocket.x > GW - rocket.radius ||
      rocket.y < rocket.radius || rocket.y > GH - rocket.radius) {
    crashGravity("You hit the edge of the cavern.");
    return;
  }

  // Goal pad: success only when arriving gently and roughly upright.
  if (gravityPadLanding(gravityGoalPad)) {
    const upright = Math.abs(Math.sin(rocket.angle)) < 0.42;
    const gentle = Math.hypot(rocket.vx, rocket.vy) < 3.0;

    if (upright && gentle) {
      rocket.y = gravityGoalPad.y - rocket.radius;
      rocket.vx = rocket.vy = 0;
      winGravity();
      return;
    }
  }

  // Start pad is safe only at the beginning / gentle touch.
  if (gravityPadLanding(gravityStartPad) && rocket.vy >= 0 && Math.hypot(rocket.vx, rocket.vy) < 3.2) {
    rocket.y = gravityStartPad.y - rocket.radius;
    rocket.vy = Math.min(0, rocket.vy);
  }

  for (const wall of gravityWalls) {
    if (gravityRectCircleCollision(wall, rocket.x, rocket.y, rocket.radius)) {
      crashGravity("You hit the cavern wall.");
      return;
    }
  }
}

function drawGravityBackground() {
  const g = gravityCtx.createLinearGradient(0,0,0,GH);
  g.addColorStop(0,"#111b30");
  g.addColorStop(1,"#080d17");
  gravityCtx.fillStyle = g;
  gravityCtx.fillRect(0,0,GW,GH);

  gravityCtx.fillStyle = "rgba(255,255,255,.13)";
  for (let i=0;i<36;i++) {
    const x = (i*137)%GW;
    const y = (i*211)%GH;
    gravityCtx.fillRect(x,y,2,2);
  }
}

function drawGravityWalls() {
  gravityCtx.fillStyle = "#293447";
  gravityCtx.strokeStyle = "#3e4b61";
  gravityCtx.lineWidth = 2;

  for (const wall of gravityWalls) {
    gravityCtx.fillRect(wall.x, wall.y, wall.w, wall.h);
    gravityCtx.strokeRect(wall.x+.5, wall.y+.5, wall.w-1, wall.h-1);
  }
}

function drawPad(pad, goal=false) {
  gravityCtx.fillStyle = goal ? "#6ed28c" : "#7b8da8";
  gravityCtx.fillRect(pad.x,pad.y,pad.w,pad.h);
  gravityCtx.fillStyle = goal ? "rgba(110,210,140,.18)" : "rgba(123,141,168,.15)";
  gravityCtx.fillRect(pad.x,pad.y-22,pad.w,22);

  gravityCtx.fillStyle = goal ? "#9df0b5" : "#b9c5d6";
  gravityCtx.font = "bold 14px system-ui";
  gravityCtx.textAlign = "center";
  gravityCtx.fillText(goal ? "LAND HERE" : "START", pad.x+pad.w/2, pad.y-6);
}

function drawRocket() {
  gravityCtx.save();
  gravityCtx.translate(rocket.x, rocket.y);
  gravityCtx.rotate(rocket.angle);

  if (gravityInput.thrust && gravityWorld.running) {
    gravityCtx.beginPath();
    gravityCtx.moveTo(-7, 13);
    gravityCtx.lineTo(0, 33 + Math.random()*8);
    gravityCtx.lineTo(7, 13);
    gravityCtx.closePath();
    gravityCtx.fillStyle = "#ffb54f";
    gravityCtx.fill();

    gravityCtx.beginPath();
    gravityCtx.moveTo(-4, 13);
    gravityCtx.lineTo(0, 26 + Math.random()*5);
    gravityCtx.lineTo(4, 13);
    gravityCtx.closePath();
    gravityCtx.fillStyle = "#fff0a0";
    gravityCtx.fill();
  }

  gravityCtx.beginPath();
  gravityCtx.moveTo(0,-20);
  gravityCtx.lineTo(14,13);
  gravityCtx.lineTo(0,8);
  gravityCtx.lineTo(-14,13);
  gravityCtx.closePath();
  gravityCtx.fillStyle = "#e9edf3";
  gravityCtx.fill();

  gravityCtx.beginPath();
  gravityCtx.arc(0,-3,5,0,Math.PI*2);
  gravityCtx.fillStyle = "#65b8e8";
  gravityCtx.fill();

  gravityCtx.restore();
}

function drawGravity() {
  drawGravityBackground();
  drawGravityWalls();
  drawPad(gravityStartPad,false);
  drawPad(gravityGoalPad,true);
  drawRocket();

  const height = Math.max(0, Math.round((gravityStartPad.y - rocket.y) / 8));
  gravityHeight.textContent = `${height} m`;
  gravitySpeed.textContent = `${Math.hypot(rocket.vx,rocket.vy).toFixed(1)}`;
}

let gravityLast = performance.now();
function gravityLoop(now) {
  const dt = Math.min(2.2, (now - gravityLast) / 16.667);
  gravityLast = now;

  // Fixed-ish small integration steps for stability.
  const steps = Math.max(1, Math.ceil(dt));
  for (let i=0;i<steps;i++) updateGravity();

  drawGravity();
  requestAnimationFrame(gravityLoop);
}

function bindGravityHold(button, key) {
  const down = e => {
    e.preventDefault();
    gravityInput[key] = true;
    button.classList.add("pressed");
  };
  const up = e => {
    e.preventDefault();
    gravityInput[key] = false;
    button.classList.remove("pressed");
  };

  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("pointerleave", up);
}

bindGravityHold(gravityLeft,"left");
bindGravityHold(gravityRight,"right");
bindGravityHold(gravityThrust,"thrust");

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") gravityInput.left = true;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") gravityInput.right = true;
  if (e.key === "ArrowUp" || e.key === " ") gravityInput.thrust = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") gravityInput.left = false;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") gravityInput.right = false;
  if (e.key === "ArrowUp" || e.key === " ") gravityInput.thrust = false;
});

gravityReset.addEventListener("click", resetGravityGame);
gravityAgain.addEventListener("click", resetGravityGame);

resetGravityGame();
requestAnimationFrame(gravityLoop);

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

function addGuideMarker(cell, item) {
  const marker = document.createElement("span");
  marker.className = "guide-marker-simple";

  if (item.visited) {
    const dot = document.createElement("span");
    dot.className = "guide-simple-dot";
    marker.appendChild(dot);
  }

  const arrow = document.createElement("span");
  const guideDir = ((item.finalDir % 4) + 4) % 4;
  const guideDirClass = ["dir-0", "dir-2", "dir-4", "dir-6"][guideDir];
  arrow.className = `guide-simple-arrow ${guideDirClass}`;
  arrow.textContent = item.collision ? "×" : "➤";
  if (item.collision) arrow.classList.add("collision");
  marker.appendChild(arrow);

  cell.appendChild(marker);
}

function simulateCodingGuide() {
  const cells = new Map();

  let state = {
    row: codingPuzzle.start.row,
    col: codingPuzzle.start.col,
    dir: 0
  };

  function ensureCell(row, col) {
    const key = `${row},${col}`;
    if (!cells.has(key)) {
      cells.set(key, {
        row,
        col,
        visited: false,
        collision: false,
        finalDir: state.dir
      });
    }
    return cells.get(key);
  }

  // Mark the starting square so the first facing direction is visible.
  const startCell = ensureCell(state.row, state.col);
  startCell.visited = true;
  startCell.finalDir = state.dir;

  for (const command of codingProgram) {
    const next = nextCodingState(state, command);

    if (command === "left" || command === "right") {
      state = { row: next.row, col: next.col, dir: next.dir };
      const cell = ensureCell(state.row, state.col);
      cell.finalDir = state.dir;
      continue;
    }

    if (next.collision) {
      const cell = ensureCell(state.row, state.col);
      cell.collision = true;
      cell.finalDir = state.dir;
      break;
    }

    state = { row: next.row, col: next.col, dir: next.dir };
    const cell = ensureCell(state.row, state.col);
    cell.visited = true;
    cell.finalDir = state.dir;
  }

  return [...cells.values()];
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

      const guideItem = guide.find(item => item.row === row && item.col === col);

      if (guideItem) {
        addGuideMarker(cell, guideItem);
      }

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
// Laser Lab - builder + play modes
// ----------------------------
const laserBoard = $("#laser-board");
const laserBeamLayer = $("#laser-beam-layer");
const laserStatus = $("#laser-status");
const laserModeButtons = $$("[data-laser-mode]");
const laserSizeButtons = $$("[data-laser-size]");
const laserSetupTools = $$("[data-laser-tool]");
const laserPlayTools = $$("[data-laser-play-tool]");
const laserSetupPanel = $("#laser-setup-panel");
const laserPlayPanel = $("#laser-play-panel");
const laserMirrorCount = $("#laser-mirror-count");
const laserCheckpointCount = $("#laser-checkpoint-count");
const laserTargetCount = $("#laser-target-count");
const laserResult = $("#laser-result");
const laserResultText = $("#laser-result-text");
const laserLevelName = $("#laser-level-name");
const laserSaveButton = $("#laser-save-level");
const laserSavedLevels = $("#laser-saved-levels");
const laserLoadButton = $("#laser-load-level");
const laserDeleteButton = $("#laser-delete-level");
const laserResetPlay = $("#laser-reset-play");

const laserGridSizes = {
  small: { rows: 10, cols: 8 },
  medium: { rows: 12, cols: 9 },
  large: { rows: 14, cols: 10 }
};

const laserDirVectors = [
  [-1, 0], [-1, 1], [0, 1], [1, 1],
  [1, 0], [1, -1], [0, -1], [-1, -1]
];

let laserMode = "setup";
let laserGridSize = "large";
let laserRowsCount = 14;
let laserColsCount = 10;
let laserSetupTool = "emitter";
let laserPlayTool = "mirror";

let laserLevel = {
  emitter: null,
  checkpoints: [],
  targets: [],
  splitters: new Map(),
  blocks: new Set()
};

let laserMirrors = new Map();

function laserKey(row, col) { return `${row},${col}`; }
function laserInBounds(row, col) {
  return row >= 0 && row < laserRowsCount && col >= 0 && col < laserColsCount;
}
function laserDirAngle(dir) { return (dir * 45 - 90 + 360) % 360; }
function mirrorLineAngle(orientation) { return orientation * 22.5; }
function normalizeAngle(angle) { angle %= 360; return angle < 0 ? angle + 360 : angle; }
function angleToLaserDir(angle) {
  const dir = Math.round((normalizeAngle(angle) + 90) / 45);
  return ((dir % 8) + 8) % 8;
}
function laserReflect(dir, orientation) {
  return angleToLaserDir(2 * mirrorLineAngle(orientation) - laserDirAngle(dir));
}
function laserCellCenter(row, col) { return [(col + .5) * 100, (row + .5) * 100]; }

function setLaserGridSize(sizeName) {
  laserGridSize = sizeName;
  const size = laserGridSizes[sizeName];
  laserRowsCount = size.rows;
  laserColsCount = size.cols;
  laserLevel = { emitter: null, checkpoints: [], targets: [], splitters: new Map(), blocks: new Set() };
  laserMirrors = new Map();
  laserSizeButtons.forEach(b => b.classList.toggle("active", b.dataset.laserSize === sizeName));
  renderLaserBoard(); traceLaser();
}

function setLaserMode(mode) {
  laserMode = mode;
  laserModeButtons.forEach(b => b.classList.toggle("active", b.dataset.laserMode === mode));
  laserSetupPanel.classList.toggle("hidden", mode !== "setup");
  laserPlayPanel.classList.toggle("hidden", mode !== "play");
  laserResult.classList.add("hidden");
  renderLaserBoard(); traceLaser();
}

function clearLaserCell(row, col) {
  const key = laserKey(row, col);
  if (laserLevel.emitter && laserLevel.emitter.row === row && laserLevel.emitter.col === col) laserLevel.emitter = null;
  laserLevel.checkpoints = laserLevel.checkpoints.filter(x => !(x.row === row && x.col === col));
  laserLevel.targets = laserLevel.targets.filter(x => !(x.row === row && x.col === col));
  laserLevel.splitters.delete(key);
  laserLevel.blocks.delete(key);
  laserMirrors.delete(key);
}

function cellHasFixedObject(row, col) {
  const key = laserKey(row, col);
  return !!(
    (laserLevel.emitter && laserLevel.emitter.row === row && laserLevel.emitter.col === col) ||
    laserLevel.checkpoints.some(x => x.row === row && x.col === col) ||
    laserLevel.targets.some(x => x.row === row && x.col === col) ||
    laserLevel.splitters.has(key) ||
    laserLevel.blocks.has(key)
  );
}

function handleLaserSetupTap(row, col) {
  const key = laserKey(row, col);

  if (laserSetupTool === "eraser") {
    clearLaserCell(row, col);
    renderLaserBoard(); traceLaser(); return;
  }

  if (laserSetupTool === "emitter" && laserLevel.emitter &&
      laserLevel.emitter.row === row && laserLevel.emitter.col === col) {
    laserLevel.emitter.dir = (laserLevel.emitter.dir + 1) % 8;
    renderLaserBoard(); traceLaser(); return;
  }

  if (laserSetupTool === "splitter" && laserLevel.splitters.has(key)) {
    laserLevel.splitters.set(key, (laserLevel.splitters.get(key) + 1) % 8);
    renderLaserBoard(); traceLaser(); return;
  }

  clearLaserCell(row, col);

  if (laserSetupTool === "emitter") laserLevel.emitter = { row, col, dir: 2 };
  if (laserSetupTool === "checkpoint") laserLevel.checkpoints.push({ row, col });
  if (laserSetupTool === "target") laserLevel.targets.push({ row, col });
  if (laserSetupTool === "splitter") laserLevel.splitters.set(key, 2);
  if (laserSetupTool === "block") laserLevel.blocks.add(key);

  renderLaserBoard(); traceLaser();
}

function handleLaserPlayTap(row, col) {
  const key = laserKey(row, col);
  if (cellHasFixedObject(row, col)) return;

  if (laserPlayTool === "eraser") laserMirrors.delete(key);
  else if (laserMirrors.has(key)) laserMirrors.set(key, (laserMirrors.get(key) + 1) % 8);
  else laserMirrors.set(key, 2);

  laserResult.classList.add("hidden");
  renderLaserBoard(); traceLaser();
}

function renderLaserBoard() {
  laserBoard.innerHTML = "";
  laserBoard.style.setProperty("--laser-cols", laserColsCount);
  laserBoard.style.setProperty("--laser-rows", laserRowsCount);

  for (let row = 0; row < laserRowsCount; row++) {
    for (let col = 0; col < laserColsCount; col++) {
      const key = laserKey(row, col);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "laser-cell";

      if (laserLevel.blocks.has(key)) cell.classList.add("obstacle");

      if (laserLevel.emitter && laserLevel.emitter.row === row && laserLevel.emitter.col === col) {
        cell.classList.add("emitter-cell");
        const e = document.createElement("span");
        e.className = `laser-emitter dir-${laserLevel.emitter.dir}`;
        cell.appendChild(e);
      }

      if (laserLevel.targets.some(x => x.row === row && x.col === col)) {
        cell.classList.add("target-cell");
        const t = document.createElement("span");
        t.className = "laser-target"; t.dataset.target = key; cell.appendChild(t);
      }

      if (laserLevel.checkpoints.some(x => x.row === row && x.col === col)) {
        cell.classList.add("checkpoint-cell");
        const c = document.createElement("span");
        c.className = "laser-checkpoint"; c.dataset.checkpoint = key; cell.appendChild(c);
      }

      if (laserLevel.splitters.has(key)) {
        const s = document.createElement("span");
        s.className = `laser-splitter angle-${laserLevel.splitters.get(key)}`;
        cell.appendChild(s);
      }

      if (laserMirrors.has(key)) {
        const m = document.createElement("span");
        m.className = `laser-mirror angle-${laserMirrors.get(key)}`;
        cell.appendChild(m);
      }

      cell.addEventListener("click", () => {
        if (laserMode === "setup") handleLaserSetupTap(row, col);
        else handleLaserPlayTap(row, col);
      });

      laserBoard.appendChild(cell);
    }
  }
}

function traceSingleBeam(state, branchIndex, hitCheckpoints, hitTargets, queue) {
  const points = [];
  const seen = new Set();
  let { row, col, dir } = state;
  points.push(laserCellCenter(row, col));

  for (let step = 0; step < 500; step++) {
    const stateKey = `${row},${col},${dir}`;
    if (seen.has(stateKey)) break;
    seen.add(stateKey);

    const [dr, dc] = laserDirVectors[dir];
    const nr = row + dr, nc = col + dc;

    if (!laserInBounds(nr, nc)) {
      points.push([(col + .5 + dc * .5) * 100, (row + .5 + dr * .5) * 100]);
      break;
    }

    const key = laserKey(nr, nc);
    if (laserLevel.blocks.has(key)) {
      points.push([(col + .5 + dc * .5) * 100, (row + .5 + dr * .5) * 100]);
      break;
    }

    row = nr; col = nc; points.push(laserCellCenter(row, col));

    if (laserLevel.checkpoints.some(x => x.row === row && x.col === col)) hitCheckpoints.add(key);

    if (laserLevel.targets.some(x => x.row === row && x.col === col)) {
      hitTargets.add(key);
      break;
    }

    if (laserMirrors.has(key)) {
      dir = laserReflect(dir, laserMirrors.get(key));
      continue;
    }

    if (laserLevel.splitters.has(key)) {
      const reflected = laserReflect(dir, laserLevel.splitters.get(key));
      if (reflected !== dir) {
        queue.push({ row, col, dir: reflected, branchIndex: branchIndex + queue.length + 1 });
      }
    }
  }

  return points;
}

function traceLaser() {
  laserBeamLayer.innerHTML = "";
  laserBeamLayer.setAttribute("viewBox", `0 0 ${laserColsCount * 100} ${laserRowsCount * 100}`);

  const hitCheckpoints = new Set();
  const hitTargets = new Set();

  if (!laserLevel.emitter) {
    updateLaserStats(hitCheckpoints, hitTargets);
    laserStatus.textContent = laserMode === "setup"
      ? "Place a laser, at least one target, then build your puzzle."
      : "This level needs a laser.";
    return;
  }

  const queue = [{ ...laserLevel.emitter, branchIndex: 1 }];
  let processed = 0;

  while (queue.length && processed < 32) {
    const beam = queue.shift();
    processed++;
    const points = traceSingleBeam(beam, beam.branchIndex, hitCheckpoints, hitTargets, queue);
    if (points.length > 1) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("class", `laser-beam-line branch-${((processed - 1) % 4) + 1}`);
      line.setAttribute("points", points.map(([x,y]) => `${x},${y}`).join(" "));
      laserBeamLayer.appendChild(line);
    }
  }

  document.querySelectorAll(".laser-checkpoint").forEach(m => m.classList.toggle("hit", hitCheckpoints.has(m.dataset.checkpoint)));
  document.querySelectorAll(".laser-target").forEach(m => m.classList.toggle("hit", hitTargets.has(m.dataset.target)));

  updateLaserStats(hitCheckpoints, hitTargets);

  const checkpointsOkay = laserLevel.checkpoints.length === 0 || hitCheckpoints.size === laserLevel.checkpoints.length;
  const targetsOkay = laserLevel.targets.length > 0 && hitTargets.size === laserLevel.targets.length;

  if (laserMode === "play" && checkpointsOkay && targetsOkay) {
    laserStatus.classList.add("good");
    laserStatus.textContent = "Puzzle solved!";
    laserResultText.textContent = "Every target and checkpoint was hit.";
    laserResult.classList.remove("hidden");
  } else {
    laserStatus.classList.remove("good","bad");
    laserResult.classList.add("hidden");
    if (laserMode === "play") {
      laserStatus.textContent = laserLevel.targets.length
        ? "Place mirrors to hit every checkpoint and target."
        : "This level needs at least one target.";
    }
  }
}

function updateLaserStats(hitCheckpoints, hitTargets) {
  laserMirrorCount.textContent = String(laserMirrors.size);
  laserCheckpointCount.textContent = `${hitCheckpoints.size} / ${laserLevel.checkpoints.length}`;
  laserTargetCount.textContent = `${hitTargets.size} / ${laserLevel.targets.length}`;
}

function serializeLaserLevel() {
  return {
    version: 1,
    name: laserLevelName.value.trim() || "Untitled Laser Level",
    gridSize: laserGridSize,
    rows: laserRowsCount, cols: laserColsCount,
    emitter: laserLevel.emitter,
    checkpoints: laserLevel.checkpoints,
    targets: laserLevel.targets,
    splitters: [...laserLevel.splitters.entries()],
    blocks: [...laserLevel.blocks]
  };
}

function deserializeLaserLevel(data) {
  const sizeName = data.gridSize && laserGridSizes[data.gridSize] ? data.gridSize : "large";
  laserGridSize = sizeName;
  laserRowsCount = data.rows || laserGridSizes[sizeName].rows;
  laserColsCount = data.cols || laserGridSizes[sizeName].cols;
  laserLevel = {
    emitter: data.emitter || null,
    checkpoints: Array.isArray(data.checkpoints) ? data.checkpoints : [],
    targets: Array.isArray(data.targets) ? data.targets : [],
    splitters: new Map(Array.isArray(data.splitters) ? data.splitters : []),
    blocks: new Set(Array.isArray(data.blocks) ? data.blocks : [])
  };
  laserMirrors = new Map();
  laserLevelName.value = data.name || "";
  laserSizeButtons.forEach(b => b.classList.toggle("active", b.dataset.laserSize === sizeName));
  setLaserMode("setup");
}

function getSavedLaserLevels() {
  try { return JSON.parse(localStorage.getItem("laserLabSavedLevels") || "{}"); }
  catch { return {}; }
}
function storeSavedLaserLevels(levels) {
  localStorage.setItem("laserLabSavedLevels", JSON.stringify(levels));
}
function refreshSavedLaserLevels() {
  const levels = getSavedLaserLevels();
  laserSavedLevels.innerHTML = '<option value="">Saved levels…</option>';
  Object.keys(levels).sort().forEach(name => {
    const option = document.createElement("option");
    option.value = name; option.textContent = name; laserSavedLevels.appendChild(option);
  });
}

laserModeButtons.forEach(b => b.addEventListener("click", () => setLaserMode(b.dataset.laserMode)));
laserSizeButtons.forEach(b => b.addEventListener("click", () => setLaserGridSize(b.dataset.laserSize)));
laserSetupTools.forEach(b => b.addEventListener("click", () => {
  laserSetupTool = b.dataset.laserTool;
  laserSetupTools.forEach(x => x.classList.toggle("active", x === b));
}));
laserPlayTools.forEach(b => b.addEventListener("click", () => {
  if (!b.dataset.laserPlayTool) return;
  laserPlayTool = b.dataset.laserPlayTool;
  laserPlayTools.forEach(x => { if (x.dataset.laserPlayTool) x.classList.toggle("active", x === b); });
}));

laserResetPlay.addEventListener("click", () => {
  laserMirrors = new Map(); laserResult.classList.add("hidden"); renderLaserBoard(); traceLaser();
});

laserSaveButton.addEventListener("click", () => {
  const data = serializeLaserLevel();
  const levels = getSavedLaserLevels();
  levels[data.name] = data;
  storeSavedLaserLevels(levels);
  refreshSavedLaserLevels();
  laserSavedLevels.value = data.name;
  laserStatus.textContent = `Saved "${data.name}".`;
});

laserLoadButton.addEventListener("click", () => {
  const name = laserSavedLevels.value;
  if (!name) return;
  const levels = getSavedLaserLevels();
  if (!levels[name]) return;
  deserializeLaserLevel(levels[name]);
  laserStatus.textContent = `Loaded "${name}".`;
});

laserDeleteButton.addEventListener("click", () => {
  const name = laserSavedLevels.value;
  if (!name) return;
  const levels = getSavedLaserLevels();
  delete levels[name];
  storeSavedLaserLevels(levels);
  refreshSavedLaserLevels();
  laserStatus.textContent = `Deleted "${name}".`;
});

refreshSavedLaserLevels();
setLaserMode("setup");
renderLaserBoard();
traceLaser();

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
