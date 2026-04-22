const allCategories = [
    around_the_houseData, before_and_afterData, book_titleData, classic_movieData,
    classic_tvData, college_lifeData, eventData, familyData, fictional_characterData,
    fictional_placeData, food_and_drinkData, fun_and_gamesData, headlineData,
    husband_and_wifeData, in_the_kitchenData, landmarkData, living_thingData,
    megawordData, movie_quotesData, movie_titleData, occupationData, on_the_mapData,
    peopleData, personData, phraseData, placeData, proper_nameData, quotationData,
    rhyme_timeData, rock_onData, same_letterData, same_nameData, show_bizData,
    sloganData, song_artistData, song_lyricsData, song_titleData, star_and_roleData,
    the_50sData, the_60sData, the_70sData, the_80sData, the_90sData, thingData,
    title_authorData, titleData, tv_show_titleData, what_are_you_doingData,
    what_are_you_wearingData
];

const wheelSegments = [
    2500, 300, 600, 300, 500, 10000, 
    550, 400, 300, 900, 500, 650, 
    900, "BANKRUPT", 600, 400, 300, "LOSE A TURN", 
    800, 350, 450, 700, 300, 600
];

// Game State
let numPlayers = 1;
let currentPlayer = 0;
let playerBanks = [0, 0, 0];
let currentPuzzle = "";
let currentSpinValue = 0;
let isVowelMode = false;
let currentWheelRotation = 0; 
let solveTimer = null;

// DOM Elements
const wheelImg = document.getElementById('fortune-wheel');
const spinValueText = document.getElementById('spin-value-text');

/* Menu & Initialization */
function showPlayerSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('player-selection').classList.remove('hidden');
}

function startGame(count) {
    numPlayers = count;
    playerBanks = [0, 0, 0];
    currentPlayer = 0;
    
    document.getElementById('player-selection').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    for(let i = 1; i <= 3; i++) {
        const display = document.getElementById(`p${i}-display`);
        if (i <= numPlayers) {
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
    }
    
    init();
}

function init() {
    currentWheelRotation = 0;
    isVowelMode = false;
    
    const data = allCategories[Math.floor(Math.random() * allCategories.length)];
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    wheelImg.style.transition = 'none';
    wheelImg.style.transform = 'rotate(0deg)';

    createGrid();
    layoutLetters();
    createKeyboard();
    updateUI();
    togglePhase('menu');
}

function resetGame() {
    location.reload();
}

/* Board & Keyboard Setup */
function createGrid() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = "";
    const deadSlots = [0, 13, 42, 55]; 
    for (let i = 0; i < 56; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (deadSlots.includes(i)) tile.classList.add('dead');
        tile.id = `tile-${i}`;
        board.appendChild(tile);
    }
}

function layoutLetters() {
    const words = currentPuzzle.split(" ");
    let tileIndex = 15; 
    
    words.forEach(word => {
        if (tileIndex + word.length > 27 && tileIndex < 28) tileIndex = 29; 
        if (tileIndex + word.length > 41 && tileIndex < 42) tileIndex = 43;

        for (let char of word) {
            const tile = document.getElementById(`tile-${tileIndex}`);
            if (tile) {
                tile.classList.add('active');

                if (/^[A-Z]$/.test(char)) {
                    tile.classList.add('hidden-letter');
                    tile.dataset.letter = char;
                } else {
                    tile.innerText = char;
                    tile.classList.add('symbol-tile');
                }
                tileIndex++;
            }
        }
        tileIndex++;
    });
}

function createKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = "";
    "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
        const btn = document.createElement('button');
        btn.innerText = l;
        btn.classList.add('key');
        btn.id = `key-${l}`;
        btn.onclick = () => handleGuess(l);
        kb.appendChild(btn);
    });
}

/* Gameplay Logic */
function updateUI() {
    for(let i = 0; i < numPlayers; i++) {
        document.getElementById(`p${i+1}-bank`).innerText = playerBanks[i].toLocaleString();
        document.getElementById(`p${i+1}-display`).classList.remove('active-turn');
    }
    
    document.getElementById(`p${currentPlayer+1}-display`).classList.add('active-turn');

    const buyBtn = document.getElementById('buy-vowel-btn');
    const hasVowelsLeft = checkVowelsRemaining();
    
    if (!hasVowelsLeft) {
        buyBtn.disabled = true;
        buyBtn.style.opacity = "0.5";
    } else {
        buyBtn.disabled = (playerBanks[currentPlayer] < 250);
        buyBtn.style.opacity = "1";
    }
}

function checkVowelsRemaining() {
    const activeTiles = document.querySelectorAll('.tile.active.hidden-letter');
    const vowels = "AEIOU";
    for (let tile of activeTiles) {
        if (vowels.includes(tile.dataset.letter)) return true;
    }
    return false;
}

function handleGuess(letter) {
    const btn = document.getElementById(`key-${letter}`);
    btn.disabled = true;
    btn.classList.add('used'); 
    
    const targets = document.querySelectorAll(`.tile[data-letter='${letter}']`);
    const vowels = "AEIOU";

    if (targets.length > 0) {
        targets.forEach(t => { 
            t.classList.remove('hidden-letter'); 
            t.innerText = letter; 
        });

        if (!isVowelMode) {
            playerBanks[currentPlayer] += (currentSpinValue * targets.length);
        }

        if (!checkVowelsRemaining()) {
            if (vowels.includes(letter) || isVowelMode) {
                alert("NO MORE VOWELS IN THE PUZZLE!");
            }
        }
    } else {
        alert(`NO ${letter}!`);
        currentPlayer = (currentPlayer + 1) % numPlayers;
    }
    
    isVowelMode = false;
    togglePhase('menu');
}

/* Wheel Logic */
document.getElementById('spin-trigger').addEventListener('click', () => {
    isVowelMode = false;
    spinValueText.innerText = ""; 
    togglePhase('wheel');

    const spinDuration = Math.floor(Math.random() * 2000) + 5000;
    const constantSpeed = 12;
    let startTime = null;

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        if (elapsed < spinDuration) {
            const remaining = 1 - (elapsed / spinDuration);
            currentWheelRotation += constantSpeed * Math.pow(remaining, 2);
            wheelImg.style.transform = `rotate(${currentWheelRotation}deg)`;
            requestAnimationFrame(animateWheel);
        } else {
            finalizeSpin();
        }
    }
    requestAnimationFrame(animateWheel);
});

function finalizeSpin() {
    const stopPoint = currentWheelRotation % 360;
    const wedgeSize = 15;
    const centerOffset = 7.5;
    let actualDegree = (360 - stopPoint + centerOffset) % 360;
    if (actualDegree < 0) actualDegree += 360;
    
    currentSpinValue = wheelSegments[Math.floor(actualDegree / wedgeSize)];
    
    const displayValue = typeof currentSpinValue === 'number' ? `$${currentSpinValue.toLocaleString()}` : currentSpinValue;
    spinValueText.innerText = displayValue;

    setTimeout(() => {
        if (typeof currentSpinValue === 'number') {
            togglePhase('keyboard', `GUESS A CONSONANT (${displayValue})`);
        } else {
            if (currentSpinValue === "BANKRUPT") playerBanks[currentPlayer] = 0;
            alert(currentSpinValue);
            currentPlayer = (currentPlayer + 1) % numPlayers;
            togglePhase('menu');
        }
    }, 1500);
}

/* Solve & Vowel Actions */
function startSolveAttempt() {
    togglePhase('solve');
    let timeLeft = 20;
    const timerDisplay = document.getElementById('timer-text');
    timerDisplay.innerText = timeLeft;

    solveTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(solveTimer);
            alert("OUT OF TIME!");
            currentPlayer = (currentPlayer + 1) % numPlayers;
            togglePhase('menu');
        }
    }, 1000);
}

function checkSolve() {
    clearInterval(solveTimer);
    const guess = document.getElementById('solve-input').value.toUpperCase().trim();
    if (guess === currentPuzzle) {
        document.querySelectorAll('.tile.active').forEach(t => t.classList.remove('hidden-letter'));
        alert(`PLAYER ${currentPlayer + 1} WINS!`);
        togglePhase('win');
    } else {
        alert("INCORRECT!");
        currentPlayer = (currentPlayer + 1) % numPlayers;
        togglePhase('menu');
    }
    document.getElementById('solve-input').value = "";
}

function prepareVowelPurchase() {
    if (!checkVowelsRemaining()) {
        alert("THERE ARE NO MORE VOWELS IN THE PUZZLE.");
        return;
    }

    if (playerBanks[currentPlayer] >= 250) {
        playerBanks[currentPlayer] -= 250;
        isVowelMode = true;
        updateUI();
        togglePhase('keyboard', "SELECT A VOWEL");
    }
}

/* UI Transitions */
function togglePhase(phase, msg = "") {
    const screens = ['action-menu', 'wheel-container', 'keyboard-container', 'solve-overlay'];
    screens.forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById('wheel-container').classList.remove('visible');

    if (phase === 'menu') {
        document.getElementById('action-menu').classList.remove('hidden');
        document.getElementById('spin-trigger').classList.remove('hidden');
        document.getElementById('buy-vowel-btn').classList.remove('hidden');
        document.getElementById('solve-trigger').classList.remove('hidden');
        document.getElementById('play-again-btn').classList.add('hidden');
        updateUI();
    } else if (phase === 'wheel') {
        const wc = document.getElementById('wheel-container');
        wc.classList.remove('hidden');
        setTimeout(() => wc.classList.add('visible'), 10);
    } else if (phase === 'keyboard') {
        document.getElementById('keyboard-container').classList.remove('hidden');
        document.getElementById('instruction-text').innerText = msg;
        const vowels = "AEIOU";
        "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
            const btn = document.getElementById(`key-${l}`);
            if (btn) {
                const isVowel = vowels.includes(l);
                const isUsed = btn.classList.contains('used');
                
                if (isUsed) {
                    btn.disabled = true;
                } else {
                    btn.disabled = isVowelMode ? !isVowel : isVowel;
                }
            }
        });
    } else if (phase === 'solve') {
        document.getElementById('solve-overlay').classList.remove('hidden');
        document.getElementById('solve-input').focus();
    } else if (phase === 'win') {
        document.getElementById('action-menu').classList.remove('hidden');
        document.getElementById('spin-trigger').classList.add('hidden');
        document.getElementById('buy-vowel-btn').classList.add('hidden');
        document.getElementById('solve-trigger').classList.add('hidden');
        document.getElementById('play-again-btn').classList.remove('hidden');
        updateUI();
    }
}

/* Credits Modal Logic */
function openCredits() {
    const modal = document.getElementById('credits-modal');
    modal.style.display = 'flex';
}

function closeCredits() {
    const modal = document.getElementById('credits-modal');
    modal.style.display = 'none';
}

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeCredits();
});