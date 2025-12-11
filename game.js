// =======================================================
// Treasure Hunt: Island of Bananas 🍌
// Some parts of this code were generated with help from ChatGPT (OpenAI)
// and adapted by <YOUR NAME>. (Put your real name here.)
// =======================================================

const BANANA_API_URL = "https://marcconrad.com/uob/banana/api.php?out=json";

// DOM REFERENCES
const loginScreen = document.getElementById("login-screen");
const gameScreen = document.getElementById("game-screen");

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const playerEmailDisplay = document.getElementById("player-email-display");

const hintBtn = document.getElementById("hint-btn");
const soundToggleBtn = document.getElementById("sound-toggle");
const logoutBtn = document.getElementById("logout-btn");

const locationButtonsContainer = document.getElementById("location-buttons");
const locationTitle = document.getElementById("location-title");
const locationDescription = document.getElementById("location-description");

const puzzleImage = document.getElementById("puzzle-image");
const puzzleQuestion = document.getElementById("puzzle-question");
const answerInput = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer-btn");

const hintText = document.getElementById("hint-text");
const message = document.getElementById("message");
const progressList = document.getElementById("progress-list");
const inventoryList = document.getElementById("inventory-list");

// AUDIO
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");
const successSound = document.getElementById("success-sound");
const failSound = document.getElementById("fail-sound");

// GAME STATE
const locations = {
    beach: {
        name: "Sunny Beach 🏖️",
        description: "You arrive at a golden beach. Waves whisper secrets about a hidden map in the sand.",
        image: "assets/images/beach.jpg",
        type: "local",
        question: "A sequence is carved in the sand: 4, 9, 16, 25, ?. What is the next number?",
        solution: "36",
        hint: "Think of square numbers: 2², 3², 4², 5², ...",
        reward: "Shell of Clues 🐚"
    },
    jungle: {
        name: "Mystic Jungle 🌴",
        description: "The jungle is dense and echoing. You spot stones arranged in a pattern.",
        image: "assets/images/jungle.jpg",
        type: "local",
        question: "A map is 80% complete. If 12 fragments are already found, how many make the full map?",
        solution: "15",
        hint: "12 is 80% of the total. Divide 12 by 0.8.",
        reward: "Leaf of Wisdom 🍃"
    },
    volcano: {
        name: "Banana Volcano 🌋",
        description: "Lava glows like molten bananas! A magical tablet summons a Banana puzzle...",
        image: "assets/images/volcano.jpg",
        type: "banana-api",
        question: "Look at the Banana puzzle image and enter the correct number.",
        hint: "Observe patterns in shapes and numbers.",
        reward: "Lava Banana Gem 💎"
    },
    village: {
        name: "Banana Village 🏝️",
        description: "The village elder challenges you with a final riddle.",
        image: "assets/images/village.jpg",
        type: "local",
        question: "The Golden Banana is split into 4 pieces. You found 3. What fraction have you found?",
        solution: "3/4",
        hint: "Write a fraction like 3/4.",
        reward: "Golden Banana Treasure 🍌✨"
    }
};

const gameState = {
    currentLocationKey: "beach",
    solvedLocations: new Set(),
    inventory: [],
    bananaSolution: null,
    soundOn: true
};

// UTILITIES
function playSound(sound) {
    if (!gameState.soundOn) return;
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.classList.remove("success", "error");
    if (type) {
        message.classList.add(type);
    }
}

// VIRTUAL IDENTITY HELPERS (localStorage)
function saveIdentity(email) {
    localStorage.setItem("islandPlayerEmail", email);
}
function loadIdentity() {
    return localStorage.getItem("islandPlayerEmail");
}
function clearIdentity() {
    localStorage.removeItem("islandPlayerEmail");
}

// ---- SIMPLE USER DATABASE (localStorage) ----
function loadUsers() {
    const raw = localStorage.getItem("islandUsers");
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem("islandUsers", JSON.stringify(users));
}

// RENDER HELPERS
function renderProgress() {
    progressList.innerHTML = "";
    gameState.solvedLocations.forEach(locKey => {
        const li = document.createElement("li");
        li.textContent = locations[locKey].name;
        progressList.appendChild(li);
    });
}

function renderInventory() {
    inventoryList.innerHTML = "";
    gameState.inventory.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        inventoryList.appendChild(li);
    });
}

function highlightActiveLocationButton() {
    const buttons = locationButtonsContainer.querySelectorAll("button");
    buttons.forEach(btn => {
        if (btn.dataset.location === gameState.currentLocationKey) {
            btn.classList.add("active-location");
        } else {
            btn.classList.remove("active-location");
        }
    });
}

// LOCATION & PUZZLE
async function loadLocation(locationKey) {
    const loc = locations[locationKey];
    if (!loc) return;

    gameState.currentLocationKey = locationKey;
    highlightActiveLocationButton();

    locationTitle.textContent = loc.name;
    locationDescription.textContent = loc.description;

    answerInput.value = "";
    hintText.textContent = "";
    showMessage("");

    puzzleImage.src = loc.image;

    if (loc.type === "local") {
        puzzleQuestion.textContent = loc.question;
        gameState.bananaSolution = null;
    } else if (loc.type === "banana-api") {
        puzzleQuestion.textContent = loc.question + " (From Banana API)";
        await loadBananaPuzzle();
    }
}

// INTEROPERABILITY: Banana API
async function loadBananaPuzzle() {
    try {
        showMessage("Loading Banana puzzle from the server... 🍌", "success");

        const response = await fetch(BANANA_API_URL);
        const data = await response.json();

        puzzleImage.src = data.question;
        gameState.bananaSolution = String(data.solution).trim();

        showMessage("Puzzle loaded! Study the image and enter the correct number.", "success");
    } catch (err) {
        console.error(err);
        showMessage("Could not load Banana puzzle. Check your internet and try again.", "error");
    }
}

function checkAnswer() {
    const locKey = gameState.currentLocationKey;
    const loc = locations[locKey];
    if (!loc) return;

    const userAnswerRaw = answerInput.value.trim();

    if (!userAnswerRaw) {
        showMessage("Please enter an answer first! 🙈", "error");
        answerInput.classList.add("shake");
        setTimeout(() => answerInput.classList.remove("shake"), 300);
        playSound(failSound);
        return;
    }

    let isCorrect = false;

    if (loc.type === "local") {
        const normalizedUser = userAnswerRaw.toLowerCase();
        const normalizedSolution = String(loc.solution).toLowerCase();
        isCorrect = normalizedUser === normalizedSolution;
    } else if (loc.type === "banana-api") {
        if (gameState.bananaSolution == null) {
            showMessage("Puzzle not loaded yet. Please wait a moment and try again.", "error");
        } else {
            isCorrect = userAnswerRaw === gameState.bananaSolution;
        }
    }

    if (isCorrect) {
        handleCorrectAnswer(locKey);
    } else {
        handleWrongAnswer();
    }
}

function handleCorrectAnswer(locKey) {
    const loc = locations[locKey];

    if (!gameState.solvedLocations.has(locKey)) {
        gameState.solvedLocations.add(locKey);
        gameState.inventory.push(loc.reward);
    }

    renderProgress();
    renderInventory();
    playSound(successSound);
    showMessage(`Correct! 🎉 You earned: ${loc.reward}`, "success");

    if (gameState.solvedLocations.size === Object.keys(locations).length) {
        hintText.textContent =
            "You solved all locations! Combine all items to tell the final Golden Banana story. 🍌✨";
    }
}

function handleWrongAnswer() {
    playSound(failSound);
    showMessage("Not quite… Try again! 🤔", "error");
    answerInput.classList.add("shake");
    setTimeout(() => answerInput.classList.remove("shake"), 300);
}

// HINTS
function showHint() {
    const locKey = gameState.currentLocationKey;
    const loc = locations[locKey];
    if (!loc) return;

    if (loc.type === "banana-api") {
        hintText.textContent =
            "Check how shapes or bananas change from one panel to the next. Look for patterns. 🔍";
    } else {
        hintText.textContent = loc.hint;
    }

    playSound(clickSound);
}

// LOGIN / LOGOUT
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const mode = authModeSelect.value; // "login" or "signup"

    if (!email || !password) {
        showMessage("Email and password are required to start your adventure. 🕵️", "error");
        return;
    }

    saveIdentity(email);
    startGameFor(email);
});

function startGameFor(email) {
    playerEmailDisplay.textContent = email;
    loginScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("active-screen");

    if (gameState.soundOn) {
        bgMusic.play().catch(() => {});
    }

    loadLocation(gameState.currentLocationKey);
}

logoutBtn.addEventListener("click", () => {
    clearIdentity();
    gameScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    loginScreen.classList.add("active-screen");
    bgMusic.pause();
    bgMusic.currentTime = 0;
    showMessage("");
});

// OTHER EVENTS
locationButtonsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-location]");
    if (!button) return;

    playSound(clickSound);
    const locationKey = button.dataset.location;
    loadLocation(locationKey);
});

hintBtn.addEventListener("click", showHint);

submitAnswerBtn.addEventListener("click", () => {
    checkAnswer();
});

answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
    }
});

soundToggleBtn.addEventListener("click", () => {
    gameState.soundOn = !gameState.soundOn;
    soundToggleBtn.textContent = gameState.soundOn ? "🔊 Sound: On" : "🔇 Sound: Off";

    if (gameState.soundOn) {
        bgMusic.play().catch(() => {});
    } else {
        bgMusic.pause();
    }
});

// INITIALISATION
document.addEventListener("DOMContentLoaded", () => {
    const savedEmail = loadIdentity();
    if (savedEmail) {
        startGameFor(savedEmail);
    } else {
        loginScreen.classList.remove("hidden");
        loginScreen.classList.add("active-screen");
    }
});
