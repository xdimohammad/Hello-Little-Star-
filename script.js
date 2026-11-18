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

let stars = 0;
let currentCategory = null;
let currentQuestion = 0;
let correctAnswers = 0;
let answered = false;
let praiseIndex = 0;
let firstInteraction = false;

// Prevent multiple animal sounds from playing together
let animalSoundPlaying = false;

const praiseMessages = [
  "That's wonderful!",
  "Great job!"
];

// ANIMAL IMAGE URLS
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

// REAL ANIMAL RECORDINGS
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

// PLAY REAL ANIMAL SOUND
let currentAnimalSound = null;
let animalSoundStopTimer = null;

function playAnimalSound(animal) {
  return new Promise((resolve) => {
    const sound = animalSounds[animal];

    if (!sound) {
      resolve();
      return;
    }

    // Stop previous animal sound
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

    // Finish only once
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

    // Wait for the real recording to finish
    sound.addEventListener("ended", finishSound);
    sound.addEventListener("error", finishSound);

    const playPromise = sound.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Animal sound could not play:", animal, error);
        finishSound();
      });
    }

    // Safety limit for longer recordings
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

// GAME QUESTIONS
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
          { id: "oval", image: "🥚" },
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

// VOICE
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

// MUSIC
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
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
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

// CREATE ANIMAL IMAGE
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

// VISUAL ANSWER CREATION
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
    const visual = document.createElement("span");
    visual.className = "answer-emoji";
    visual.textContent = choice.image;

    button.appendChild(visual);
    button.setAttribute("aria-label", choice.id);
    button.dataset.answer = choice.id;
  }

  // SHAPES
  else if (category === "shapes") {
    const visual = document.createElement("span");
    visual.className = "answer-shape";
    visual.textContent = choice.image;

    button.appendChild(visual);
    button.setAttribute("aria-label", choice.id);
    button.dataset.answer = choice.id;
  }

  // NUMBERS
  else if (category === "numbers") {
    const visual = document.createElement("span");
    visual.className = "answer-number";
    visual.textContent = choice.object.repeat(choice.count);

    button.appendChild(visual);
    button.setAttribute("aria-label", String(choice.count));
    button.dataset.answer = String(choice.count);
  }

  button.addEventListener("click", () => {
    const value = category === "numbers"
      ? Number(button.dataset.answer)
      : button.dataset.answer;

    // ANIMALS: sound first, then wait 1 second, then feedback
    if (category === "animals") {
      if (answered || animalSoundPlaying) return;

      animalSoundPlaying = true;

      // Stop any currently speaking voice
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      playAnimalSound(value).then(() => {
        // Wait 1 second AFTER the animal recording finishes
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

// GAME
function chooseCategory(category) {
  // Stop animal sound if changing category
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
  categoryEmoji.textContent = game.emoji;
  completionOverlay.classList.remove("show");

  loadQuestion();
  speak(game.intro, 0.85);
}

function loadQuestion() {
  const game = games[currentCategory];
  const item = game.questions[currentQuestion];

  answered = false;
  animalSoundPlaying = false;

  question.textContent = item.prompt;
  questionImage.innerHTML = "";
  questionImage.className = "question-image";

  if (currentCategory === "colors") {
    questionImage.classList.add("color-target");

    const target = document.createElement("div");
    target.className = "target-color";
    target.style.backgroundColor = item.color;

    questionImage.appendChild(target);
  }

  else if (currentCategory === "numbers") {
    questionImage.textContent = item.object.repeat(item.count);
  }

  // ANIMAL QUESTION
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

  else {
    questionImage.textContent = item.image;
  }

  questionProgress.textContent =
    "Question " + (currentQuestion + 1) + " of " +
    game.questions.length;

  feedback.textContent = "Can you find it?";
  feedback.style.color = "#8c75a4";

  nextButton.hidden = true;
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

function checkAnswer(selected, selectedButton) {
  if (answered) return;

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

    feedback.textContent = "⭐ " + praiseMessages[praiseIndex];
    feedback.style.color = "#43a36a";

    speak(praiseMessages[praiseIndex], 0.88);
    praiseIndex = (praiseIndex + 1) % praiseMessages.length;

    playCorrectSound();

    nextButton.hidden = false;
    nextButton.textContent =
      currentQuestion === games[currentCategory].questions.length - 1
        ? "Finish 🎉"
        : "Next Question ➜";

  } else {
    selectedButton.classList.add("wrong");
    selectedButton.disabled = true;

    feedback.textContent = "Good try! Try another one!";
    feedback.style.color = "#d47c8c";

    speak("Good try! Try again!", 0.85);
    playWrongSound();
  }
}

function nextQuestion() {
  if (!answered) return;

  const total = games[currentCategory].questions.length;

  if (currentQuestion < total - 1) {
    currentQuestion++;
    loadQuestion();
  } else {
    finishGame();
  }
}

function finishGame() {
  completionScore.textContent = "⭐ " + correctAnswers + " Stars!";
  completionOverlay.classList.add("show");

  speak("Amazing work! You did a wonderful job!", 0.85);
}

  
function playAgain() {
  completionOverlay.classList.remove("show");

  // Reset animal sound
  if (currentAnimalSound) {
    currentAnimalSound.pause();
    currentAnimalSound.currentTime = 0;
  }

  if (animalSoundStopTimer) {
    clearTimeout(animalSoundStopTimer);
    animalSoundStopTimer = null;
  }

  animalSoundPlaying = false;

  // Stop current voice
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  // Reset category selection
  document.querySelectorAll(".category-card").forEach(button => {
    button.classList.remove("active");
  });

  currentCategory = null;
  currentQuestion = 0;
  correctAnswers = 0;
  answered = false;

  // Return to category menu
  gameTitle.textContent = "Let's Play!";
  categoryEmoji.textContent = "🌟";
  questionProgress.textContent = "Choose a learning category";

  question.textContent = "What would you like to learn?";
  questionImage.className = "question-image";
  questionImage.innerHTML = "🌈";

  answers.innerHTML =
    '<div class="answer-placeholder">Choose a category above</div>';

  feedback.textContent = "Let's have fun learning!";
  feedback.style.color = "#8c75a4";

  nextButton.hidden = true;

  speak("Choose what to learn!", 0.85);
}

}

// FULLSCREEN
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

// BUTTONS
document.querySelectorAll(".category-card").forEach(button => {
  button.addEventListener("click", () => {
    chooseCategory(button.dataset.category);
  });
});

nextButton.addEventListener("click", nextQuestion);
musicButton.addEventListener("click", toggleMusic);
fullscreenButton.addEventListener("click", toggleFullscreen);

$("playAgainButton").addEventListener("click", playAgain);

// START MUSIC ON FIRST INTERACTION
document.addEventListener("pointerdown", event => {
  if (event.target.closest("#musicButton")) return;

  if (!firstInteraction) {
    firstInteraction = true;
    startMusic();
  }
}, { once: true });

// STOP MUSIC WHEN PAGE IS HIDDEN
document.addEventListener("visibilitychange", () => {
  if (document.hidden && musicEnabled) {
    stopMusic();
  }
});

// LOAD VOICES
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}
