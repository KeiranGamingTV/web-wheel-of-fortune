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
let isSolving = false;
let solveTiles = []; 
let currentSolveIndex = 0;
let hasAlertedNoVowels = false;

// DOM Elements
const wheelImg = document.getElementById('fortune-wheel');
const spinValueText = document.getElementById('spin-value-text');

/* Menu & Initialization */
function showPlayerSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('player-selection').classList.remove('hidden');
}

function startGame(count) {
    fadeOutMenuMusic();
    numPlayers = count;
    playerBanks = [0, 0, 0];
    currentPlayer = 0;
    
    document.getElementById('player-selection').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    for(let i = 1; i <= 3; i++) {
        const display = document.getElementById(`p${i}-display`);
        display.classList.toggle('hidden', i > numPlayers);
    }
    
    init();
}

function init() {
    currentWheelRotation = 0;
    isVowelMode = false;
    hasAlertedNoVowels = false;
    
    const data = allCategories[Math.floor(Math.random() * allCategories.length)];
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    // Play Reveal Sound
    const revealSnd = document.getElementById('snd-reveal');
    revealSnd.currentTime = 0;
    revealSnd.play().catch(() => {});

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
    // 0 (top-left), 12 (top-right), 39 (bottom-left), 51 (bottom-right)
    const deadSlots = [0, 12, 39, 51]; 
    for (let i = 0; i < 52; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (deadSlots.includes(i)) tile.classList.add('dead');
        tile.id = `tile-${i}`;
        board.appendChild(tile);
    }
}

function layoutLetters() {
    const words = currentPuzzle.split(" ");
    const rowStartsDefault = [1, 14, 27, 40];
    const rowStartsExpanded = [0, 13, 26, 39];
    const rowLimitsDefault = 12;
    const rowLimitsExpanded = 13;
    
    let rowsUsed = [[], [], [], []];
    let currentRow = 0;

    words.forEach(word => {
        let currentLineText = rowsUsed[currentRow].join(" ");
        let spaceNeeded = currentLineText.length === 0 ? word.length : word.length + 1;

        let currentLimit = (currentRow === 1 || currentRow === 2) ? rowLimitsExpanded : rowLimitsDefault;

        if (currentLineText.length + spaceNeeded <= currentLimit) {
            rowsUsed[currentRow].push(word);
        } else {
            currentRow++;
            if (currentRow < 4) {
                rowsUsed[currentRow] = [word];
            }
        }
    });

    const totalLines = rowsUsed.filter(r => r.length > 0).length;
    let activeRowIndex = totalLines <= 2 ? 1 : 0; 

    rowsUsed.forEach(rowWords => {
        if (activeRowIndex >= 4 || rowWords.length === 0) return;
        
        let combinedRowText = rowWords.join(" ");
        let startTile;

        if (activeRowIndex === 1 || activeRowIndex === 2) {
            if (combinedRowText.length > rowLimitsDefault) {
                startTile = rowStartsExpanded[activeRowIndex];
            } else {
                startTile = rowStartsDefault[activeRowIndex];
            }
        } else {
            startTile = rowStartsDefault[activeRowIndex];
        }

        let currentTileIndex = startTile;

        rowWords.forEach((word, wordIdx) => {
            for (let char of word) {
                const tile = document.getElementById(`tile-${currentTileIndex}`);
                if (tile) {
                    tile.classList.add('active');
                    if (/^[A-Z]$/.test(char)) {
                        tile.classList.add('hidden-letter');
                        tile.dataset.letter = char;
                    } else {
                        tile.innerText = char;
                        tile.classList.add('symbol-tile');
                    }
                }
                currentTileIndex++;
            }
            if (wordIdx < rowWords.length - 1) {
                currentTileIndex++;
            }
        });
        activeRowIndex++;
    });
}

function createKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = "";

    const rows = [
        "QWERTYUIOP".split(""),
        "ASDFGHJKL".split(""),
        "ZXCVBNM".split("")
    ];

    rows.forEach((row, rowIndex) => {
        if (rowIndex === 1) {
            const spacer = document.createElement('div');
            spacer.classList.add('key-spacer');
            spacer.style.gridColumn = "span 1"; 
            kb.appendChild(spacer);
        }
        
        if (rowIndex === 2) {
            const spacer = document.createElement('div');
            spacer.classList.add('key-spacer');
            spacer.style.gridColumn = "span 2"; 
            kb.appendChild(spacer);
        }

        row.forEach(l => {
            const btn = document.createElement('button');
            btn.innerText = l;
            btn.classList.add('key');
            btn.id = `key-${l}`;
            btn.onclick = () => handleGuess(l);
            kb.appendChild(btn);
        });
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
    const hiddenTiles = document.querySelectorAll('.tile.active.hidden-letter');
    const vowels = "AEIOU";
    return Array.from(hiddenTiles).some(tile => vowels.includes(tile.dataset.letter));
}

async function handleGuess(letter) {
    if (isSolving) {
        handleSolveLetter(letter);
        return;
    }

    const btn = document.getElementById(`key-${letter}`);
    btn.disabled = true;
    btn.classList.add('used'); 
    
    // Find matching tiles and convert to an array
    let targets = Array.from(document.querySelectorAll(`.tile[data-letter='${letter}']`));
    
    if (targets.length > 0) {
        // Sort tiles by ID index (top-left to bottom-right)
        targets.sort((a, b) => {
            const indexA = parseInt(a.id.split('-')[1]);
            const indexB = parseInt(b.id.split('-')[1]);
            return indexA - indexB;
        });

        togglePhase('revealLetter');
        
        // Reveal tiles one by one
        for (const t of targets) {
            // 1. Turn the spot blue
            t.classList.add('revealing');
            
            // 2. Play the ding sound
            const dingSnd = document.getElementById('snd-ding');
            dingSnd.currentTime = 0;
            dingSnd.play().catch(() => {});

            // 3. Wait 0.75 seconds
            await new Promise(resolve => setTimeout(resolve, 750));

            // 4. Reveal the letter and make it white
            t.classList.remove('revealing', 'hidden-letter'); 
            t.innerText = letter; 
        }

        // Apply scoring after all letters are revealed
        if (!isVowelMode) {
            playerBanks[currentPlayer] += (currentSpinValue * targets.length);
        }

        if (!hasAlertedNoVowels && !checkVowelsRemaining()) {
            alert("THERE ARE NO MORE VOWELS IN THE PUZZLE.");
            hasAlertedNoVowels = true;
        }
    } else {
        // Handle incorrect guess
        const wrongSnd = document.getElementById('snd-wrong');
        wrongSnd.currentTime = 0;
        wrongSnd.play().catch(() => {});

        alert(`NO ${letter}!`);
        currentPlayer = (currentPlayer + 1) % numPlayers;
    }
    
    isVowelMode = false;
    togglePhase('menu');
}

function handleSolveLetter(letter) {
    if (currentSolveIndex < solveTiles.length) {
        const targetTile = solveTiles[currentSolveIndex];
        targetTile.innerText = letter;
        targetTile.classList.remove('hidden-letter');
        
        currentSolveIndex++;
        if (currentSolveIndex >= solveTiles.length) {
            checkSolve();
        } else {
            highlightCurrentSolveTile();
        }
    }
}

function highlightCurrentSolveTile() {
    solveTiles.forEach(t => t.classList.remove('solving-active'));
    if (currentSolveIndex < solveTiles.length) {
        solveTiles[currentSolveIndex].classList.add('solving-active');
    }
}

/* Wheel Logic */
document.getElementById('spin-trigger').addEventListener('click', () => {
    isVowelMode = false;
    spinValueText.innerText = ""; 
    togglePhase('wheel');

    const spinDuration = Math.floor(Math.random() * 2000) + 5000;
    const constantSpeed = 12;
    let startTime = null;
    
    // Track rotation for clicking sound
    let lastClickRotation = currentWheelRotation; 
    const clickSnd = document.getElementById('snd-click');

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        if (elapsed < spinDuration) {
            const remaining = 1 - (elapsed / spinDuration);
            currentWheelRotation += constantSpeed * Math.pow(remaining, 2);
            wheelImg.style.transform = `rotate(${currentWheelRotation}deg)`;

            const currentStep = Math.floor((currentWheelRotation + 7.5) / 15);
            const lastStep = Math.floor((lastClickRotation + 7.5) / 15);

            if (currentStep > lastStep) {
                clickSnd.currentTime = 0;
                clickSnd.play().catch(() => {});
                lastClickRotation = currentWheelRotation;
            }

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
            if (currentSpinValue === "BANKRUPT") {
                playerBanks[currentPlayer] = 0;
                triggerSpecialEffect('bankrupt');
            } else if (currentSpinValue === "LOSE A TURN") {
                triggerSpecialEffect('loseaturn');
            } else {
                alert(currentSpinValue);
                currentPlayer = (currentPlayer + 1) % numPlayers;
                togglePhase('menu');
            }
        }
    }, 1500);
}

function triggerSpecialEffect(type) {
    const overlay = document.getElementById(`${type}-overlay`);
    
    if (type === 'bankrupt') {
        const bankruptSnd = document.getElementById('snd-bankrupt');
        bankruptSnd.currentTime = 0;
        bankruptSnd.play().catch(() => {});
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('zoom-effect');

    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('zoom-effect');
        
        currentPlayer = (currentPlayer + 1) % numPlayers;
        togglePhase('menu');
    }, 3600);
}

/* Solve & Vowel Actions */
function startSolveAttempt() {
    isSolving = true;
    currentSolveIndex = 0;
    solveTiles = Array.from(document.querySelectorAll('.tile.active.hidden-letter'));
    
    if (solveTiles.length === 0) return;

    // Start Countdown Music
    const solveMusic = document.getElementById('snd-solve-music');
    solveMusic.currentTime = 0;
    solveMusic.play().catch(() => {});

    togglePhase('solve');
    highlightCurrentSolveTile();

    let timeLeft = 20;
    const timerDisplay = document.getElementById('timer-text');
    timerDisplay.innerText = timeLeft;

    solveTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) failSolve("OUT OF TIME!");
    }, 1000);
}

function checkSolve() {
    clearInterval(solveTimer);
    
    // Stop Solve Music
    const solveMusic = document.getElementById('snd-solve-music');
    solveMusic.pause();

    let isCorrect = solveTiles.every(tile => tile.innerText === tile.dataset.letter);

    if (isCorrect) {
        // Play Win Sound
        const winSnd = document.getElementById('snd-win');
        winSnd.currentTime = 0;
        winSnd.play().catch(() => {});

        alert(`PLAYER ${currentPlayer + 1} SOLVED IT!`);
        togglePhase('win');
    } else {
        failSolve("INCORRECT!");
        const wrongSnd = document.getElementById('snd-wrong');
        wrongSnd.currentTime = 0;
        wrongSnd.play().catch(() => {});

        
    }
    isSolving = false;
}

function failSolve(msg) {
    const solveMusic = document.getElementById('snd-solve-music');
    solveMusic.pause();
    
    alert(msg);
    clearInterval(solveTimer);
    isSolving = false;
    solveTiles.forEach(tile => {
        tile.innerText = "";
        tile.classList.add('hidden-letter');
        tile.classList.remove('solving-active');
    });
    currentPlayer = (currentPlayer + 1) % numPlayers;
    togglePhase('menu');
}

function prepareVowelPurchase() {
    if (playerBanks[currentPlayer] >= 250) {
        playerBanks[currentPlayer] -= 250;
        isVowelMode = true;
        updateUI();
        togglePhase('keyboard', "SELECT A VOWEL");
    } else {
        alert("YOU NEED $250 TO BUY A VOWEL.");
    }
}

/* UI Transitions */
function togglePhase(phase, msg = "") {
    const screens = ['action-menu', 'wheel-container', 'keyboard-container', 'solve-overlay'];

    screens.forEach(s => {
        const el = document.getElementById(s);
        el.classList.add('hidden');
        if (s === 'wheel-container') {
            el.classList.remove('visible');
        }
    });

    if (phase === 'revealLetter') {
        document.getElementById('action-menu').classList.add('hidden');
    } else if (phase === 'menu') {
        document.getElementById('action-menu').classList.remove('hidden');
        updateUI();
    } else if (phase === 'solve') {
        document.getElementById('solve-overlay').classList.remove('hidden');
        document.getElementById('keyboard-container').classList.remove('hidden');
        document.getElementById('instruction-text').innerText = "";
        document.querySelectorAll('.key').forEach(btn => btn.disabled = false);
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
    } else if (phase === 'win') {
        document.getElementById('action-menu').classList.remove('hidden');
        document.getElementById('spin-trigger').classList.add('hidden');
        document.getElementById('buy-vowel-btn').classList.add('hidden');
        document.getElementById('solve-trigger').classList.add('hidden');
        document.getElementById('play-again-btn').classList.remove('hidden');
        updateUI();
    }
}

window.onload = () => {
    const menuSnd = document.getElementById('snd-menu');
    menuSnd.play().catch(() => {
        console.log("Autoplay blocked. Music will start on first user interaction.");
        window.addEventListener('mousedown', () => {
            if (menuSnd.paused) menuSnd.play();
        }, { once: true });
    });
};

function fadeOutMenuMusic() {
    const menuSnd = document.getElementById('snd-menu');
    let volume = 1.0;
    const fadeInterval = setInterval(() => {
        if (volume > 0.05) {
            volume -= 0.05;
            menuSnd.volume = volume;
        } else {
            clearInterval(fadeInterval);
            menuSnd.pause();
            menuSnd.volume = 1.0;
        }
    }, 50);
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
