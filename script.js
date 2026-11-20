
const $ = (id) => document.getElementById(id);

const app = $("app");
const starCount = $("starCount");
const musicButton = $("musicButton");
const fullscreenButton = $("fullscreenButton");
const gameTitle = $("gameTitle");
const categoryEmoji = $("categoryEmoji");
const questionProgress = $("questionProgress");
const question = $("question");
const questionImage = $("questionImage");
const answers = $("answers");
const feedback = $("feedback");
const nextButton = $("nextButton");
const completionOverlay = $("completionOverlay");
const completionScore = $("completionScore");

// HOME BUTTON
const topActions = document.querySelector(".top-actions");
const homeButton = document.createElement("button");

homeButton.type = "button";
homeButton.className = "top-button home-button";
homeButton.textContent = "⌂";
homeButton.title = "Back to Home";
homeButton.setAttribute("aria-label", "Back to Home");
homeButton.hidden = true;

if (topActions) {
  topActions.insertBefore(homeButton, musicButton);
}

// REMOVE OLD NAVIGATION BUTTONS
if (nextButton) nextButton.remove();

const oldPlayAgainButton = $("playAgainButton");
if (oldPlayAgainButton) oldPlayAgainButton.remove();

const oldPlayAgain = $("playAgain");
if (oldPlayAgain) oldPlayAgain.remove();

// GAME VARIABLES
let stars = 0;
let currentCategory = null;
let currentQuestion = 0;
let correctAnswers = 0;
let answered = false;
let praiseIndex = 0;
let firstInteraction = false;

let questionAdvanceTimer = null;
let courseTransitionTimer = null;
let countdownInterval = null;
let courseTransitionLocked = false;

let animalSoundPlaying = false;

// PRAISE
const praiseMessages = [
  "That's wonderful!",
  "Great job!"
];

// =====================================
// TWEMOJI VISUALS
// =====================================

function createEmojiImage(emoji, className) {
  const image = document.createElement("img");

  const code = Array.from(emoji)
    .map(char => char.codePointAt(0).toString(16))
    .filter(code => code !== "fe0f")
    .join("-");

  const primaryURL =
    `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;

  const backupURL =
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`;

  image.src = primaryURL;
  image.alt = emoji;
  image.className = className || "twemoji-image";
  image.draggable = false;
  image.loading = "eager";
  image.decoding = "async";

  image.style.width = "1em";
  image.style.height = "1em";
  image.style.objectFit = "contain";
  image.style.display = "inline-block";

  image.onerror = () => {
    if (image.src !== backupURL) {
      image.src = backupURL;
    }
  };

  return image;
}

function createEmojiGroup(emoji, count, className) {
  const group = document.createElement("span");

  group.className = className || "emoji-group";
  group.style.display = "inline-flex";
  group.style.alignItems = "center";
  group.style.justifyContent = "center";
  group.style.flexWrap = "wrap";
  group.style.gap = "0.08em";

  for (let i = 0; i < count; i++) {
    group.appendChild(
      createEmojiImage(emoji, "twemoji-image")
    );
  }

  return group;
}

function setCategoryEmoji(emoji) {
  categoryEmoji.innerHTML = "";

  const image = createEmojiImage(
    emoji,
    "category-emoji-image"
  );

  image.style.width = "1.2em";
  image.style.height = "1.2em";
  image.style.verticalAlign = "middle";

  categoryEmoji.appendChild(image);
}

// =====================================
// ANIMAL IMAGE URLS
// =====================================

const animalImages = {
  cat: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/01_cat.png",
  dog: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/02_dog.png",
  rabbit: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/03_rabbit.png",
  cow: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/04_cow.png",
  sheep: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/05_sheep.png",
  duck: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/06_duck.png",
  elephant: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/07_elephant.png",
  lion: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/08_lion.png",
  monkey: "https://raw.githubusercontent.com/xdimohammad/hello-little-star-assets/main/09_monkey.png"
};

// =====================================
// REAL ANIMAL RECORDINGS
// =====================================

const animalSoundFiles = {
  cat: "Meow.ogg",
  dog: "Barking of a dog 2.ogg",
  rabbit: "Sounds of a rollicking House Rabbit.flac",
  cow: "Mudchute cow 1.ogg",
  sheep: "Sheep bleating.ogg",
  duck: "Tufted Duck.ogg",
  elephant: "Elephant voice - trumpeting.ogg",
  lion: "Lion raring-sound1TamilNadu178.ogg",
  monkey: "Mantled Howler Monkey (Alouatta palliata) (W ALOUATTA PALLIATA R1 C2).ogg"
};

const animalSounds = {};

Object.entries(animalSoundFiles).forEach(([animal, filename]) => {
  const sound = new Audio(
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/" +
    encodeURIComponent(filename)
  );

  sound.preload = "auto";
  animalSounds[animal] = sound;
});

let currentAnimalSound = null;
let animalSoundStopTimer = null;

function playAnimalSound(animal) {
  return new Promise((resolve) => {
    const sound = animalSounds[animal];

    if (!sound) {
      resolve();
      return;
    }

    if (currentAnimalSound) {
      currentAnimalSound.pause();
      currentAnimalSound.currentTime = 0;
    }

    if (animalSoundStopTimer) {
      clearTimeout(animalSoundStopTimer);
      animalSoundStopTimer = null;
    }

    currentAnimalSound = sound;

    sound.pause();
    sound.currentTime = 0;
    sound.volume = 1;

    let finished = false;

    function finishSound() {
      if (finished) return;

      finished = true;

      if (animalSoundStopTimer) {
        clearTimeout(animalSoundStopTimer);
        animalSoundStopTimer = null;
      }

      sound.removeEventListener("ended", finishSound);
      sound.removeEventListener("error", finishSound);

      sound.pause();
      sound.currentTime = 0;

      resolve();
    }

    sound.addEventListener("ended", finishSound);
    sound.addEventListener("error", finishSound);

    const playPromise = sound.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Animal sound could not play:", animal, error);
        finishSound();
      });
    }

    const duration =
      animal === "monkey" ? 4 :
      animal === "rabbit" ? 4 :
      animal === "sheep" ? 4 :
      animal === "lion" ? 4 :
      3;

    animalSoundStopTimer = setTimeout(() => {
      finishSound();
    }, duration * 1000);
  });
}

// =====================================
// GAME QUESTIONS
// =====================================

const games = {
  colors: {
    title: "Learn Colors",
    emoji: "🎨",
    intro: "Let's learn colors!",
    questions: [
      {
        prompt: "Find RED!",
        color: "#f04455",
        correct: "red",
        choices: [
          { id: "blue", color: "#3988ed" },
          { id: "red", color: "#f04455" },
          { id: "yellow", color: "#ffd43b" },
          { id: "green", color: "#42b978" }
        ]
      },
      {
        prompt: "Find BLUE!",
        color: "#3988ed",
        correct: "blue",
        choices: [
          { id: "pink", color: "#f49ac2" },
          { id: "blue", color: "#3988ed" },
          { id: "orange", color: "#ff9638" },
          { id: "purple", color: "#9b72d6" }
        ]
      },
      {
        prompt: "Find YELLOW!",
        color: "#ffd43b",
        correct: "yellow",
        choices: [
          { id: "green", color: "#42b978" },
          { id: "red", color: "#f04455" },
          { id: "yellow", color: "#ffd43b" },
          { id: "purple", color: "#9b72d6" }
        ]
      },
      {
        prompt: "Find GREEN!",
        color: "#42b978",
        correct: "green",
        choices: [
          { id: "green", color: "#42b978" },
          { id: "pink", color: "#f49ac2" },
          { id: "blue", color: "#3988ed" },
          { id: "orange", color: "#ff9638" }
        ]
      },
      {
        prompt: "Find PINK!",
        color: "#f49ac2",
        correct: "pink",
        choices: [
          { id: "purple", color: "#9b72d6" },
          { id: "orange", color: "#ff9638" },
          { id: "pink", color: "#f49ac2" },
          { id: "green", color: "#42b978" }
        ]
      }
    ]
  },

  animals: {
    title: "Learn Animals",
    emoji: "🐻",
    intro: "Let's learn animals!",
    questions: [
      {
        prompt: "Which one is a cat?",
        spoken: "Which one is a cat?",
        correct: "cat",
        choices: ["dog", "cat", "cow", "duck"]
      },
      {
        prompt: "Which one is an elephant?",
        spoken: "Which one is an elephant?",
        correct: "elephant",
        choices: ["rabbit", "monkey", "elephant", "lion"]
      },
      {
        prompt: "Which one is a rabbit?",
        spoken: "Which one is a rabbit?",
        correct: "rabbit",
        choices: ["lion", "rabbit", "cat", "sheep"]
      },
      {
        prompt: "Which one is a duck?",
        spoken: "Which one is a duck?",
        correct: "duck",
        choices: ["dog", "duck", "cow", "monkey"]
      },
      {
        prompt: "Which one is a lion?",
        spoken: "Which one is a lion?",
        correct: "lion",
        choices: ["sheep", "cat", "lion", "elephant"]
      }
    ]
  },

  shapes: {
    title: "Learn Shapes",
    emoji: "🔺",
    intro: "Let's learn shapes!",
    questions: [
      {
        prompt: "Find the circle!",
        image: "🔴",
        correct: "circle",
        choices: [
          { id: "square", image: "🟦" },
          { id: "circle", image: "🔴" },
          { id: "triangle", image: "🔺" },
          { id: "star", image: "⭐" }
        ]
      },
      {
        prompt: "Find the triangle!",
        image: "🔺",
        correct: "triangle",
        choices: [
          { id: "circle", image: "🟡" },
          { id: "heart", image: "❤️" },
          { id: "triangle", image: "🔺" },
          { id: "square", image: "🟩" }
        ]
      },
      {
        prompt: "Find the square!",
        image: "🟦",
        correct: "square",
        choices: [
          { id: "star", image: "⭐" },
          { id: "square", image: "🟦" },
          { id: "circle", image: "🔴" },
          { id: "triangle", image: "🔺" }
        ]
      },
      {
        prompt: "Find the heart!",
        image: "❤️",
        correct: "heart",
        choices: [
          { id: "heart", image: "❤️" },
          { id: "triangle", image: "🔺" },
          { id: "square", image: "🟦" },
          { id: "circle", image: "🟡" }
        ]
      },
      {
        prompt: "Find the star!",
        image: "⭐",
        correct: "star",
        choices: [
          { id: "circle", image: "🔴" },
          { id: "oval", image: "oval" },
          { id: "star", image: "⭐" },
          { id: "square", image: "🟩" }
        ]
      }
    ]
  },

  fruits: {
    title: "Learn Fruits",
    emoji: "🍎",
    intro: "Let's learn fruits!",
    questions: [
      {
        prompt: "Which one is an apple?",
        image: "🍎",
        correct: "apple",
        choices: [
          { id: "banana", image: "🍌" },
          { id: "apple", image: "🍎" },
          { id: "grapes", image: "🍇" },
          { id: "pear", image: "🍐" }
        ]
      },
      {
        prompt: "Which one is a banana?",
        image: "🍌",
        correct: "banana",
        choices: [
          { id: "orange", image: "🍊" },
          { id: "strawberry", image: "🍓" },
          { id: "banana", image: "🍌" },
          { id: "apple", image: "🍎" }
        ]
      },
      {
        prompt: "Which one is an orange?",
        image: "🍊",
        correct: "orange",
        choices: [
          { id: "grapes", image: "🍇" },
          { id: "orange", image: "🍊" },
          { id: "pear", image: "🍐" },
          { id: "kiwi", image: "🥝" }
        ]
      },
      {
        prompt: "Which one is a strawberry?",
        image: "🍓",
        correct: "strawberry",
        choices: [
          { id: "watermelon", image: "🍉" },
          { id: "banana", image: "🍌" },
          { id: "strawberry", image: "🍓" },
          { id: "orange", image: "🍊" }
        ]
      },
      {
        prompt: "Which one is a watermelon?",
        image: "🍉",
        correct: "watermelon",
        choices: [
          { id: "apple", image: "🍎" },
          { id: "watermelon", image: "🍉" },
          { id: "grapes", image: "🍇" },
          { id: "lemon", image: "🍋" }
        ]
      }
    ]
  },

  numbers: {
    title: "Learn Numbers",
    emoji: "🔢",
    intro: "Let's count together!",
    questions: [
      {
        prompt: "Find ONE star!",
        count: 1,
        object: "⭐",
        correct: 1,
        choices: [1, 2, 3, 4]
      },
      {
        prompt: "Find TWO apples!",
        count: 2,
        object: "🍎",
        correct: 2,
        choices: [1, 2, 3, 4]
      },
      {
        prompt: "Find THREE hearts!",
        count: 3,
        object: "❤️",
        correct: 3,
        choices: [1, 2, 3, 4]
      },
      {
        prompt: "Find FOUR flowers!",
        count: 4,
        object: "🌸",
        correct: 4,
        choices: [1, 2, 3, 4]
      },
      {
        prompt: "Find FIVE balloons!",
        count: 5,
        object: "🎈",
        correct: 5,
        choices: [2, 3, 4, 5]
      }
    ]
  }
};

// =====================================
// VOICE
// =====================================

function speak(text, rate = 0.82) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = 1.12;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const englishVoices = voices.filter(v =>
    v.lang.toLowerCase().startsWith("en")
  );

  const preferredVoice = englishVoices.find(v =>
    /samantha|karen|moira|tessa|female|zira|aria|jenny/i.test(v.name)
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  } else if (englishVoices.length) {
    utterance.voice = englishVoices[0];
  }

  window.speechSynthesis.speak(utterance);
}

// =====================================
// MUSIC
// =====================================

let audioContext = null;
let masterMusicGain = null;
let musicTimer = null;
let musicEnabled = false;
let musicStep = 0;

const melody = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 783.99, 698.46,
  523.25, 659.25, 880.00, 783.99,
  698.46, 659.25, 587.33, 523.25
];

function initializeAudio() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return false;

    audioContext = new AudioContextClass();

    masterMusicGain = audioContext.createGain();
    masterMusicGain.gain.value = 0;
    masterMusicGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return true;
}

function playMusicNote(frequency, duration = 0.42) {
  if (!audioContext || !masterMusicGain || !musicEnabled) return;

  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  noteGain.gain.setValueAtTime(0.0001, audioContext.currentTime);

  noteGain.gain.exponentialRampToValueAtTime(
    0.12,
    audioContext.currentTime + 0.06
  );

  noteGain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration
  );

  oscillator.connect(noteGain);
  noteGain.connect(masterMusicGain);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + 0.04);
}

function startMusic() {
  if (musicEnabled) return;
  if (!initializeAudio()) return;

  musicEnabled = true;
  musicButton.textContent = "🎵";

  masterMusicGain.gain.cancelScheduledValues(audioContext.currentTime);

  masterMusicGain.gain.setTargetAtTime(
    0.055,
    audioContext.currentTime,
    0.3
  );

  musicTimer = setInterval(() => {
    if (!musicEnabled) return;

    playMusicNote(melody[musicStep], 0.42);
    musicStep = (musicStep + 1) % melody.length;
  }, 460);
}

function stopMusic() {
  musicEnabled = false;
  musicButton.textContent = "🔇";

  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  if (audioContext && masterMusicGain) {
    masterMusicGain.gain.setTargetAtTime(
      0,
      audioContext.currentTime,
      0.18
    );
  }
}

function toggleMusic() {
  if (musicEnabled) stopMusic();
  else startMusic();
}

function playCorrectSound() {
  if (!initializeAudio()) return;

  [660, 830, 990].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.09;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}

function playWrongSound() {
  if (!initializeAudio()) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(
    300,
    audioContext.currentTime
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    220,
    audioContext.currentTime + 0.18
  );

  gain.gain.setValueAtTime(0.09, audioContext.currentTime);

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.2
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.21);
}

// =====================================
// CREATE ANIMAL IMAGE
// =====================================

function createAnimalImage(animal, className) {
  const image = document.createElement("img");

  image.src = animalImages[animal];
  image.alt = animal;
  image.className = className;
  image.loading = "eager";
  image.decoding = "async";
  image.draggable = false;

  image.style.objectFit = "contain";
  image.style.display = "block";
  image.style.margin = "auto";

  image.onerror = () => {
    image.alt = "Image unavailable";
  };

  return image;
}

// =====================================
// SHAPE ANSWER VISUAL
// =====================================

function createOvalShape() {
  const oval = document.createElement("span");

  oval.className = "answer-shape answer-oval";

  oval.style.display = "block";
  oval.style.width = "56px";
  oval.style.height = "38px";
  oval.style.flex = "0 0 56px";
  oval.style.borderRadius = "50%";
  oval.style.backgroundColor = "#F5C94E";
  oval.style.border = "3px solid #DDAE35";
  oval.style.boxSizing = "border-box";

  return oval;
}

// =====================================
// VISUAL ANSWER CREATION
// =====================================

function makeAnswerButton(choice, category) {
  const button = document.createElement("button");

  button.className = "answer-button";

  // COLORS
  if (category === "colors") {
    const visual = document.createElement("span");

    visual.className = "answer-color";
    visual.style.backgroundColor = choice.color;

    button.appendChild(visual);
    button.setAttribute("aria-label", choice.id);
    button.dataset.answer = choice.id;
  }

  // ANIMALS
  else if (category === "animals") {
    const visual = createAnimalImage(
      choice,
      "answer-animal-image"
    );

    visual.style.width = "100%";
    visual.style.height = "105px";
    visual.style.maxWidth = "120px";

    button.appendChild(visual);
    button.setAttribute("aria-label", choice);
    button.dataset.answer = choice;
  }

  // FRUITS
  else if (category === "fruits") {
    const visual = createEmojiImage(
      choice.image,
      "answer-emoji"
    );

    visual.style.width = "56px";
    visual.style.height = "56px";
    visual.style.maxWidth = "56px";
    visual.style.maxHeight = "56px";
    visual.style.flex = "0 0 56px";
    visual.style.objectFit = "contain";

    button.appendChild(visual);
    button.setAttribute("aria-label", choice.id);
    button.dataset.answer = choice.id;
  }

  // SHAPES
  else if (category === "shapes") {
    let visual;

    if (choice.id === "oval") {
      visual = createOvalShape();
    } else {
      visual = createEmojiImage(
        choice.image,
        "answer-shape"
      );

      const shapeSize =
        choice.id === "triangle" ? "68px" : "56px";

      visual.style.width = shapeSize;
      visual.style.height = shapeSize;
      visual.style.maxWidth = shapeSize;
      visual.style.maxHeight = shapeSize;
      visual.style.flex = `0 0 ${shapeSize}`;
      visual.style.objectFit = "contain";
    }

    button.appendChild(visual);
    button.setAttribute("aria-label", choice.id);
    button.dataset.answer = choice.id;
  }

  // NUMBERS
  else if (category === "numbers") {
    const visual = createEmojiGroup(
      choice.object,
      choice.count,
      "answer-number"
    );

    visual.style.fontSize = "1.8rem";
    visual.style.maxWidth = "100%";

    button.appendChild(visual);
    button.setAttribute("aria-label", String(choice.count));
    button.dataset.answer = String(choice.count);
  }

  button.addEventListener("click", () => {
    const value = category === "numbers"
      ? Number(button.dataset.answer)
      : button.dataset.answer;

    if (category === "animals") {
      if (answered || animalSoundPlaying) return;

      animalSoundPlaying = true;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      playAnimalSound(value).then(() => {
        setTimeout(() => {
          animalSoundPlaying = false;
          checkAnswer(value, button);
        }, 1000);
      });

      return;
    }

    checkAnswer(value, button);
  });

  return button;
}

// =====================================
// GAME
// =====================================

function chooseCategory(category) {
  if (questionAdvanceTimer) {
    clearTimeout(questionAdvanceTimer);
    questionAdvanceTimer = null;
  }

  if (courseTransitionTimer) {
    clearTimeout(courseTransitionTimer);
    courseTransitionTimer = null;
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  courseTransitionLocked = false;
  homeButton.hidden = false;

  if (currentAnimalSound) {
    currentAnimalSound.pause();
    currentAnimalSound.currentTime = 0;
  }

  if (animalSoundStopTimer) {
    clearTimeout(animalSoundStopTimer);
    animalSoundStopTimer = null;
  }

  animalSoundPlaying = false;

  currentCategory = category;
  currentQuestion = 0;
  correctAnswers = 0;

  document.querySelectorAll(".category-card").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === category
    );
  });

  const game = games[category];

  gameTitle.textContent = game.title;
  setCategoryEmoji(game.emoji);

  completionOverlay.classList.remove("show");

  loadQuestion();
  speak(game.intro, 0.85);
}

// =====================================
// LOAD QUESTION
// =====================================

function loadQuestion() {
  const game = games[currentCategory];
  const item = game.questions[currentQuestion];

  answered = false;
  animalSoundPlaying = false;

  question.textContent = item.prompt;

  questionImage.innerHTML = "";
  questionImage.className = "question-image";

  // COLORS
  if (currentCategory === "colors") {
    questionImage.classList.add("color-target");

    const target = document.createElement("div");

    target.className = "target-color";
    target.style.backgroundColor = item.color;

    questionImage.appendChild(target);
  }

  // NUMBERS
  else if (currentCategory === "numbers") {
    const visual = createEmojiGroup(
      item.object,
      item.count,
      "question-emoji-group"
    );

    visual.style.fontSize = "2.5rem";
    visual.style.maxWidth = "100%";

    questionImage.appendChild(visual);
  }

  // ANIMALS
  else if (currentCategory === "animals") {
    const animal = item.correct;

    const visual = createAnimalImage(
      animal,
      "question-animal-image"
    );

    visual.style.width = "180px";
    visual.style.height = "150px";
    visual.style.maxWidth = "100%";

    questionImage.appendChild(visual);
  }

  // SHAPES AND FRUITS
  else {
    const visual = createEmojiImage(
      item.image,
      "question-emoji-image"
    );

    visual.style.width = "5rem";
    visual.style.height = "5rem";

    questionImage.appendChild(visual);
  }

  questionProgress.textContent =
    "Question " + (currentQuestion + 1) +
    " of " + game.questions.length;

  feedback.textContent = "Can you find it?";
  feedback.style.color = "#8c75a4";

  answers.innerHTML = "";

  item.choices.forEach(choice => {
    let answerChoice = choice;

    if (currentCategory === "numbers") {
      answerChoice = {
        count: choice,
        object: item.object
      };
    }

    const button = makeAnswerButton(
      answerChoice,
      currentCategory
    );

    answers.appendChild(button);
  });

  speak(item.spoken || item.prompt, 0.78);
}

// =====================================
// CHECK ANSWER
// =====================================

function checkAnswer(selected, selectedButton) {
  if (answered || !currentCategory || !games[currentCategory]) return;

  const item = games[currentCategory].questions[currentQuestion];

  const allButtons = answers.querySelectorAll(".answer-button");

  if (selected === item.correct) {
    answered = true;
    correctAnswers++;
    stars++;

    starCount.textContent = stars;

    selectedButton.classList.add("correct");

    allButtons.forEach(button => {
      button.disabled = true;
    });

    feedback.textContent =
      "⭐ " + praiseMessages[praiseIndex];

    feedback.style.color = "#43a36a";

    speak(praiseMessages[praiseIndex], 0.88);

    praiseIndex =
      (praiseIndex + 1) % praiseMessages.length;

    playCorrectSound();

    if (correctAnswers >= games[currentCategory].questions.length) {
      showCourseCompletion();
    } else {
      if (questionAdvanceTimer) {
        clearTimeout(questionAdvanceTimer);
      }

      questionAdvanceTimer = setTimeout(() => {
        questionAdvanceTimer = null;
        nextQuestion();
      }, 1100);
    }

  } else {
    selectedButton.classList.add("wrong");
    selectedButton.disabled = true;

    feedback.textContent = "Good try! Try another one!";
    feedback.style.color = "#d47c8c";

    speak("Good try! Try again!", 0.85);
    playWrongSound();
  }
}

// =====================================
// NEXT QUESTION
// =====================================

function nextQuestion() {
  if (!answered || !currentCategory) return;

  const total = games[currentCategory].questions.length;

  if (currentQuestion < total - 1) {
    currentQuestion++;
    loadQuestion();
  } else {
    showCourseCompletion();
  }
}

// =====================================
// COURSE COMPLETION + COUNTDOWN
// =====================================

function showCourseCompletion() {
  if (courseTransitionLocked || !currentCategory) return;

  courseTransitionLocked = true;
  homeButton.hidden = true;

  let secondsLeft = 5;

  completionScore.innerHTML = `
    ⭐ ${correctAnswers} Stars!
    <br>
    Course completed!
    <br>
    Next course starts in
    <br>
    <span id="countdownNumber"
      style="
        display:inline-block;
        font-size:3.5rem;
        font-weight:900;
        line-height:1.2;
        color:#9b72d6;
        margin-top:8px;
      ">5</span>
  `;

  completionOverlay.classList.add("show");

  speak(
    "Amazing work! You completed this course! Let's try another course in five seconds!",
    0.85
  );

  countdownInterval = setInterval(() => {
    secondsLeft--;

    const countdownNumber =
      document.getElementById("countdownNumber");

    if (countdownNumber) {
      countdownNumber.textContent = secondsLeft;
    }

    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000);

  courseTransitionTimer = setTimeout(() => {
    courseTransitionTimer = null;

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    const otherCourses = Object.keys(games).filter(
      category => category !== currentCategory
    );

    const randomCourse =
      otherCourses[
        Math.floor(Math.random() * otherCourses.length)
      ];

    courseTransitionLocked = false;
    chooseCategory(randomCourse);

  }, 5000);
}

// =====================================
// BACK TO HOME
// =====================================

function goHome() {
  if (courseTransitionLocked) return;

  if (questionAdvanceTimer) {
    clearTimeout(questionAdvanceTimer);
    questionAdvanceTimer = null;
  }

  if (courseTransitionTimer) {
    clearTimeout(courseTransitionTimer);
    courseTransitionTimer = null;
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (currentAnimalSound) {
    currentAnimalSound.pause();
    currentAnimalSound.currentTime = 0;
  }

  if (animalSoundStopTimer) {
    clearTimeout(animalSoundStopTimer);
    animalSoundStopTimer = null;
  }

  animalSoundPlaying = false;
  courseTransitionLocked = false;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  completionOverlay.classList.remove("show");
  homeButton.hidden = true;

  document.querySelectorAll(".category-card").forEach(button => {
    button.classList.remove("active");
  });

  currentCategory = null;
  currentQuestion = 0;
  correctAnswers = 0;
  answered = false;

  gameTitle.textContent = "Let's Play!";

  setCategoryEmoji("🌟");

  questionProgress.textContent = "Choose a learning category";

  question.textContent = "What would you like to learn?";

  questionImage.className = "question-image";
  questionImage.innerHTML = "";

  questionImage.appendChild(
    createEmojiImage("🌈", "home-emoji-image")
  );

  answers.innerHTML =
    '<div class="answer-placeholder">Choose a category above</div>';

  feedback.textContent = "Let's have fun learning!";
  feedback.style.color = "#8c75a4";

  speak("Choose what to learn!", 0.85);
}

// =====================================
// FULLSCREEN
// =====================================

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await app.requestFullscreen();

      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock("portrait");
        } catch (error) {
          // Orientation lock may not be supported.
        }
      }

    } else {
      await document.exitFullscreen();
    }

  } catch (error) {
    speak("Fullscreen is not available on this device.", 0.85);
  }
}

document.addEventListener("fullscreenchange", () => {
  fullscreenButton.textContent =
    document.fullscreenElement ? "↙" : "⛶";
});

// =====================================
// BUTTONS
// =====================================

document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => {
    if (courseTransitionLocked) return;

    chooseCategory(button.dataset.category);
  });
});

homeButton.addEventListener("click", goHome);

musicButton.addEventListener("click", toggleMusic);

fullscreenButton.addEventListener("click", toggleFullscreen);

// =====================================
// START MUSIC ON FIRST INTERACTION
// =====================================

document.addEventListener("pointerdown", event => {
  if (event.target.closest("#musicButton")) return;

  if (!firstInteraction) {
    firstInteraction = true;
    startMusic();
  }
}, { once: true });

// =====================================
// STOP MUSIC WHEN PAGE IS HIDDEN
// =====================================

document.addEventListener("visibilitychange", () => {
  if (document.hidden && musicEnabled) {
    stopMusic();
  }
});

// =====================================
// LOAD VOICES
// =====================================

if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}
