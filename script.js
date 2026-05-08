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

/* const wheelSegments = [
    2500, 300, 600, 300, 500, 10000, 
    550, 400, 300, 900, 500, 650, 
    900, "BANKRUPT", 600, 400, 300, "LOSE A TURN", 
    800, 350, 450, 700, 300, 600
];
*/

// I had to shift the wedge slices around a little bit.
const newWheelSegments = [
    2500, 2500, 300,
    300, 300, 600,
    600, 600, 300,
    300, 300, 500,
    500, 500, "BANKRUPT",
    10000, "BANKRUPT", 550,
    550, 550, 400,
    400, 400, 300,
    300, 300, 900,
    900, 900, 500,
    500, 500, 650,
    650, 650, 900, 
    900, 900, "BANKRUPT",
    "BANKRUPT", "BANKRUPT", 600,
    600, 600, 400,
    400, 400, 300,
    300, 300, "LOSE A TURN",
    "LOSE A TURN", "LOSE A TURN", 800,
    800, 800, 350,
    350, 350, 450,
    450, 450, 700,
    700, 700, 300,
    300, 300, 600,
    600, 600, 2500
];

// Game State
let currentRound = 1;
let numPlayers = 1;
let currentPlayer = 0;
let playerRoundBanks = [0, 0, 0];
let playerTotalBanks = [0, 0, 0];
let currentPuzzle = "";
let currentSpinValue = 0;
let isVowelMode = false;
let currentWheelRotation = 0; 
let solveTimer = null;
let isSolving = false;
let solveTiles = []; 
let currentSolveIndex = 0;
let hasAlertedNoVowels = false;
let playerNames = ["PLAYER 1", "PLAYER 2", "PLAYER 3"];

let isBonusRound = false;
let bonusConsonantsPicked = 0;
let bonusVowelsPicked = 0;
const BONUS_CONSONANT_LIMIT = 3;
const BONUS_VOWEL_LIMIT = 1;

// DOM Elements
const wheelImg = document.getElementById('fortune-wheel');
const spinValueText = document.getElementById('spin-value-text');

function showPlayerSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('player-selection').classList.remove('hidden');
}

function startGame(count) {
    numPlayers = count;
    document.getElementById('player-selection').classList.add('hidden');
    const nameEntry = document.getElementById('name-entry');
    const container = document.getElementById('name-inputs-container');
    container.innerHTML = "";
    nameEntry.classList.remove('hidden');

    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = "name-input-group";
        div.innerHTML = `
            <label>Player ${i}:</label>
            <input type="text" id="p${i}-name-input" placeholder="NAME" autocomplete="off">
        `;
        container.appendChild(div);
    }
}

function finalizeStart() {
    fadeOutMenuMusic();
    playerTotalBanks = [0, 0, 0];
    currentRound = 1;
    isBonusRound = false;

    for (let i = 1; i <= numPlayers; i++) {
        const val = document.getElementById(`p${i}-name-input`).value.trim();
        playerNames[i - 1] = val !== "" ? val.toUpperCase() : `PLAYER ${i}`;
    }

    document.getElementById('name-entry').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    for (let i = 1; i <= 3; i++) {
        const display = document.getElementById(`p${i}-display`);
        display.classList.toggle('hidden', i > numPlayers);
    }

    startRoundSequence();
}

async function startRoundSequence() {
    playerRoundBanks = [0, 0, 0];
    isVowelMode = false;
    hasAlertedNoVowels = false;

    if (!isBonusRound) {
        currentPlayer = (currentRound - 1) % numPlayers;
    }

    document.getElementById('next-round-btn').classList.add('hidden');
    document.getElementById('play-again-btn').classList.add('hidden');
    const bonusBtn = document.getElementById('bonus-round-btn');
    if (bonusBtn) bonusBtn.classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    
    const banner = document.getElementById('round-banner');
    
    banner.classList.remove('banner-enter', 'banner-exit');
    
    banner.innerText = isBonusRound ? "BONUS ROUND" : `ROUND ${currentRound}`;
    banner.style.background = isBonusRound ? "black" : "transparent";
    
    void banner.offsetWidth; 

    banner.classList.add('banner-enter');
    await new Promise(r => setTimeout(r, 2000));
    
    banner.classList.remove('banner-enter');
    banner.classList.add('banner-exit');
    await new Promise(r => setTimeout(r, 600));

    document.getElementById('game-screen').classList.remove('hidden');
    
    if (isBonusRound) {
        initBonusRound();
    } else {
        init();
    }
}

function init() {
    currentWheelRotation = 0;
    const data = allCategories[Math.floor(Math.random() * allCategories.length)];
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    const revealSnd = document.getElementById('snd-reveal');
    revealSnd.currentTime = 0;
    revealSnd.play().catch(() => {});

    wheelImg.style.transition = 'none';
    wheelImg.style.transform = 'rotate(0deg)';

    createGrid();
    layoutLetters();
    createKeyboard();
    
    document.getElementById('spin-trigger').classList.remove('hidden');
    document.getElementById('buy-vowel-btn').classList.remove('hidden');
    document.getElementById('solve-trigger').classList.remove('hidden');
    document.getElementById('action-menu').classList.remove('hidden');
    
    document.getElementById('next-round-btn').classList.add('hidden');
    document.getElementById('play-again-btn').classList.add('hidden');
    const bonusBtn = document.getElementById('bonus-round-btn');
    if (bonusBtn) bonusBtn.classList.add('hidden');
    
    updateUI();
    togglePhase('menu');
}

// Leaderboard Transition
function showLeaderboard() {
    const view = document.getElementById('leaderboard-view');
    const container = document.getElementById('leaderboard-scores');
    container.innerHTML = "";
    
    document.getElementById('game-screen').classList.add('hidden');
    view.classList.remove('hidden');

    const maxScore = Math.max(...playerTotalBanks);

    for(let i = 0; i < numPlayers; i++) {
        const scoreDiv = document.createElement('div');
        scoreDiv.className = `player-score p${i+1}-color`;
        scoreDiv.innerHTML = `${playerNames[i]}: $${playerTotalBanks[i].toLocaleString()}`;

        if (playerTotalBanks[i] === maxScore && maxScore > 0) {
            scoreDiv.classList.add('leader-halo');
        }
        container.appendChild(scoreDiv);
    }

    setTimeout(() => {
        view.classList.add('hidden');
        if (currentRound < 3) {
            currentRound++;
            startRoundSequence();
        } else {
            handleBonusRoundEntry();
        }
    }, 5000);
}

function handleBonusRoundEntry() {
    document.getElementById('game-screen').classList.add('hidden');
    
    const maxScore = Math.max(...playerTotalBanks);
    currentPlayer = playerTotalBanks.indexOf(maxScore);

    const picker = document.createElement('div');
    picker.id = "bonus-picker";
    picker.style = "position:fixed; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:10000; color:white; font-family:Arial Black;";
    
    const h2 = document.createElement('h2');
    h2.innerText = `${playerNames[currentPlayer]}: CHOOSE A CATEGORY`;
    picker.appendChild(h2);

    const btnCont = document.createElement('div');
    btnCont.style.display = "flex";
    btnCont.style.gap = "20px";

    const choices = [...allCategories].sort(() => 0.5 - Math.random()).slice(0, 3);
    choices.forEach(cat => {
        const btn = document.createElement('button');
        btn.innerText = cat.category;
        btn.className = "bonus-category-btn";
        btn.onclick = () => {
            window.selectedBonusData = cat;
            isBonusRound = true;
            bonusConsonantsPicked = 0;
            bonusVowelsPicked = 0;
            picker.remove();
            startRoundSequence();
        };
        btnCont.appendChild(btn);
    });

    picker.appendChild(btnCont);
    document.body.appendChild(picker);
}

function initBonusRound() {
    const data = window.selectedBonusData;
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    createGrid();
    layoutLetters();
    createKeyboard();

    const rstlne = "RSTLNE".split("");
    rstlne.forEach(l => {
        const targets = document.querySelectorAll(`.tile[data-letter='${l}']`);
        targets.forEach(t => {
            t.classList.remove('hidden-letter');
            t.innerText = l;
        });
        const key = document.getElementById(`key-${l}`);
        if(key) {
            key.disabled = true;
            key.classList.add('used');
        }
    });

    togglePhase('bonus-picking');
}

function handleBonusPick(letter) {
    const vowels = "AEIOU";
    const isVowel = vowels.includes(letter);
    const key = document.getElementById(`key-${letter}`);

    if (isVowel && bonusVowelsPicked < BONUS_VOWEL_LIMIT) {
        bonusVowelsPicked++;
        key.disabled = true;
        key.classList.add('used');
    } else if (!isVowel && bonusConsonantsPicked < BONUS_CONSONANT_LIMIT) {
        bonusConsonantsPicked++;
        key.disabled = true;
        key.classList.add('used');
    }

    if (bonusConsonantsPicked === BONUS_CONSONANT_LIMIT && bonusVowelsPicked === BONUS_VOWEL_LIMIT) {
        revealBonusPicks();
    } else {
        togglePhase('bonus-picking');
    }
}

async function revealBonusPicks() {
    togglePhase('revealLetter');
    const usedKeys = Array.from(document.querySelectorAll('.key.used'))
                    .map(k => k.innerText)
                    .filter(l => !"RSTLNE".includes(l));

    for (const letter of usedKeys) {
        let targets = Array.from(document.querySelectorAll(`.tile[data-letter='${letter}']`));
        if (targets.length > 0) {
            for (const t of targets) {
                t.classList.add('revealing');
                document.getElementById('snd-ding').currentTime = 0;
                document.getElementById('snd-ding').play().catch(() => {});
                await new Promise(r => setTimeout(r, 750));
                t.classList.remove('revealing', 'hidden-letter');
                t.innerText = letter;
            }
        } else {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    await new Promise(r => setTimeout(r, 4000));
    
    const revealSnd = document.getElementById('snd-reveal');
    const originalSrc = revealSnd.src;

    const randomNum = Math.floor(Math.random() * 5) + 1;
    const randomPath = `sounds/good_luck/${randomNum}.wav`;

    revealSnd.src = randomPath;
    revealSnd.currentTime = 0;

    try {
        await revealSnd.play();
    } catch (err) {
        revealSnd.src = originalSrc;
        revealSnd.currentTime = 0;
        await revealSnd.play().catch(() => {});
    }
    
    startSolveAttempt();
}

function resetGame() {
    location.reload();
}

function createGrid() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = "";
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
            if (currentRow < 4) rowsUsed[currentRow] = [word];
        }
    });

    const totalLines = rowsUsed.filter(r => r.length > 0).length;
    let activeRowIndex = totalLines <= 2 ? 1 : 0; 

    rowsUsed.forEach(rowWords => {
        if (activeRowIndex >= 4 || rowWords.length === 0) return;
        let combinedRowText = rowWords.join(" ");
        let startTile;

        if (activeRowIndex === 1 || activeRowIndex === 2) {
            startTile = (combinedRowText.length > rowLimitsDefault) ? rowStartsExpanded[activeRowIndex] : rowStartsDefault[activeRowIndex];
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
            if (wordIdx < rowWords.length - 1) currentTileIndex++;
        });
        activeRowIndex++;
    });
}

function createKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = "";
    const rows = ["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), "ZXCVBNM".split("")];
    rows.forEach((row, rowIndex) => {
        if (rowIndex === 1) {
            const s = document.createElement('div'); s.classList.add('key-spacer'); s.style.gridColumn = "span 1"; kb.appendChild(s);
        }
        if (rowIndex === 2) {
            const s = document.createElement('div'); s.classList.add('key-spacer'); s.style.gridColumn = "span 2"; kb.appendChild(s);
        }
        row.forEach(l => {
            const btn = document.createElement('button');
            btn.innerText = l;
            btn.classList.add('key');
            btn.id = `key-${l}`;
            btn.onclick = () => {
                if (isBonusRound && !isSolving) handleBonusPick(l);
                else handleGuess(l);
            };
            kb.appendChild(btn);
        });
    });
}

function updateUI() {
    for (let i = 0; i < numPlayers; i++) {
        const displayAmount = isBonusRound ? playerTotalBanks[i] : playerRoundBanks[i];
        const bankElement = document.getElementById(`p${i + 1}-bank`);
        
        const displayDiv = document.getElementById(`p${i + 1}-display`);
        displayDiv.innerHTML = `${playerNames[i]}: $<span id="p${i + 1}-bank">${displayAmount.toLocaleString()}</span>`;

        document.getElementById(`p${i + 1}-display`).classList.remove('active-turn');
    }
    
    document.getElementById(`p${currentPlayer+1}-display`).classList.add('active-turn');

    const buyBtn = document.getElementById('buy-vowel-btn');
    const hasVowelsLeft = checkVowelsRemaining();
    if (!hasVowelsLeft) {
        buyBtn.disabled = true;
        buyBtn.style.opacity = "0.5";
    } else {
        buyBtn.disabled = (playerRoundBanks[currentPlayer] < 250 || isBonusRound);
        buyBtn.style.opacity = isBonusRound ? "0.5" : "1";
    }
}

function checkVowelsRemaining() {
    const hiddenTiles = document.querySelectorAll('.tile.active.hidden-letter');
    const vowels = "AEIOU";
    return Array.from(hiddenTiles).some(tile => vowels.includes(tile.dataset.letter));
}

async function handleGuess(letter) {
    if (isSolving) { handleSolveLetter(letter); return; }

    const btn = document.getElementById(`key-${letter}`);
    btn.disabled = true;
    btn.classList.add('used'); 
    
    let targets = Array.from(document.querySelectorAll(`.tile[data-letter='${letter}']`));
    
    if (targets.length > 0) {
        targets.sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
        togglePhase('revealLetter');
        for (const t of targets) {
            t.classList.add('revealing');
            const dingSnd = document.getElementById('snd-ding');
            dingSnd.currentTime = 0; dingSnd.play().catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 750));
            t.classList.remove('revealing', 'hidden-letter'); 
            t.innerText = letter; 
        }
        if (!isVowelMode) {
            playerRoundBanks[currentPlayer] += (currentSpinValue * targets.length);
        }

        const remainingHidden = document.querySelectorAll('.tile.active.hidden-letter');
        if (remainingHidden.length === 0) {
            document.getElementById('snd-win').currentTime = 0;
            document.getElementById('snd-win').play().catch(() => {});
            
            playerTotalBanks[currentPlayer] += playerRoundBanks[currentPlayer];
            alert(`${playerNames[currentPlayer]} REVEALED THE ENTIRE PUZZLE!`);
            togglePhase('win');
            return;
        }

        if (!hasAlertedNoVowels && !checkVowelsRemaining()) {
            alert("THERE ARE NO MORE VOWELS IN THE PUZZLE.");
            hasAlertedNoVowels = true;
        }
    } else {
        const wrongSnd = document.getElementById('snd-wrong');
        wrongSnd.currentTime = 0; wrongSnd.play().catch(() => {});
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
        if (currentSolveIndex >= solveTiles.length) checkSolve();
        else highlightCurrentSolveTile();
    }
}

function highlightCurrentSolveTile() {
    solveTiles.forEach(t => t.classList.remove('solving-active'));
    if (currentSolveIndex < solveTiles.length) solveTiles[currentSolveIndex].classList.add('solving-active');
}

document.getElementById('spin-trigger').addEventListener('click', () => {
    isVowelMode = false;
    spinValueText.innerText = ""; 
    togglePhase('wheel');
    const spinDuration = Math.floor(Math.random() * 2000) + 5000;
    const constantSpeed = 12;
    let startTime = null;
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
                clickSnd.currentTime = 0; clickSnd.play().catch(() => {});
                lastClickRotation = currentWheelRotation;
            }
            requestAnimationFrame(animateWheel);
        } else finalizeSpin();
    }
    requestAnimationFrame(animateWheel);
});

function finalizeSpin() {
    const stopPoint = currentWheelRotation % 360;
    const wedgeSize = 5; 
    const centerOffset = 2.5; 
    let actualDegree = (360 - stopPoint + centerOffset) % 360;
    if (actualDegree < 0) actualDegree += 360;

    currentSpinValue = newWheelSegments[Math.floor(actualDegree / wedgeSize)];
    
    const displayValue = typeof currentSpinValue === 'number' ? `$${currentSpinValue.toLocaleString()}` : currentSpinValue;
    spinValueText.innerText = displayValue;

    setTimeout(() => {
        if (typeof currentSpinValue === 'number') togglePhase('keyboard', `GUESS A CONSONANT (${displayValue})`);
        else {
            if (currentSpinValue === "BANKRUPT") {
                playerRoundBanks[currentPlayer] = 0;
                triggerSpecialEffect('bankrupt');
            } else if (currentSpinValue === "LOSE A TURN") triggerSpecialEffect('loseaturn');
            else {
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
        bankruptSnd.currentTime = 0; bankruptSnd.play().catch(() => {});
    }
    overlay.classList.remove('hidden'); overlay.classList.add('zoom-effect');
    setTimeout(() => {
        overlay.classList.add('hidden'); overlay.classList.remove('zoom-effect');
        currentPlayer = (currentPlayer + 1) % numPlayers;
        togglePhase('menu');
    }, 3600);
}

function startSolveAttempt() {
    isSolving = true; currentSolveIndex = 0;
    solveTiles = Array.from(document.querySelectorAll('.tile.active.hidden-letter'));
    if (solveTiles.length === 0) return;
    const solveMusic = document.getElementById('snd-solve-music');
    solveMusic.currentTime = 0; solveMusic.play().catch(() => {});
    togglePhase('solve');
    highlightCurrentSolveTile();
    let timeLeft = 20;
    const timerDisplay = document.getElementById('timer-text');
    timerDisplay.innerText = timeLeft;
    solveTimer = setInterval(() => {
        timeLeft--; timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) failSolve("OUT OF TIME!");
    }, 1000);
}

function checkSolve() {
    clearInterval(solveTimer);
    document.getElementById('snd-solve-music').pause();
    let isCorrect = solveTiles.every(tile => tile.innerText === tile.dataset.letter);

    if (isCorrect) {
        document.getElementById('snd-win').currentTime = 0;
        document.getElementById('snd-win').play().catch(() => {});
        
        if (isBonusRound) {
            const prize = (Math.floor(Math.random() * 13) * 5000) + 40000;
            playerTotalBanks[currentPlayer] += prize;
            updateUI(); 
            alert(`YOU SOLVED IT! YOU WIN $${prize.toLocaleString()}!`);
        } else {
            playerTotalBanks[currentPlayer] += playerRoundBanks[currentPlayer];
            alert(`${playerNames[currentPlayer]} SOLVED IT!`);
        }
        togglePhase('win');
    } else {
        failSolve("INCORRECT!");
    }
    isSolving = false;
}

function failSolve(msg) {
    document.getElementById('snd-solve-music').pause();
    const wrongSnd = document.getElementById('snd-wrong');
    wrongSnd.currentTime = 0; 
    wrongSnd.play().catch(() => {});
    
    alert(msg);
    clearInterval(solveTimer);
    isSolving = false;

    solveTiles.forEach(t => {
        t.innerText = "";
        t.classList.add('hidden-letter');
        t.classList.remove('solving-active');
    });

    if (isBonusRound) {
        document.querySelectorAll('.tile.active.hidden-letter').forEach(t => {
            t.innerText = t.dataset.letter;
            t.classList.remove('hidden-letter');
        });
        togglePhase('win');
    } else {
        currentPlayer = (currentPlayer + 1) % numPlayers;
        togglePhase('menu');
    }
}

function prepareVowelPurchase() {
    if (playerRoundBanks[currentPlayer] >= 250) {
        playerRoundBanks[currentPlayer] -= 250;
        isVowelMode = true;
        updateUI();
        togglePhase('keyboard', "SELECT A VOWEL");
    } else alert("YOU NEED $250 TO BUY A VOWEL.");
}

function togglePhase(phase, msg = "") {
    const screens = ['action-menu', 'wheel-container', 'keyboard-container', 'solve-overlay'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        el.classList.add('hidden');
        if (s === 'wheel-container') el.classList.remove('visible');
    });

    if (phase === 'revealLetter') document.getElementById('action-menu').classList.add('hidden');
    else if (phase === 'menu') {
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
    } else if (phase === 'bonus-picking') {
        document.getElementById('keyboard-container').classList.remove('hidden');
        document.getElementById('instruction-text').innerText = "CHOOSE 3 CONSONANTS AND 1 VOWEL";
        const vowels = "AEIOU";
        "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
            const btn = document.getElementById(`key-${l}`);
            if (btn && !btn.classList.contains('used')) {
                const isV = vowels.includes(l);
                btn.disabled = isV ? (bonusVowelsPicked >= BONUS_VOWEL_LIMIT) : (bonusConsonantsPicked >= BONUS_CONSONANT_LIMIT);
            }
        });
    } else if (phase === 'keyboard') {
        document.getElementById('keyboard-container').classList.remove('hidden');
        document.getElementById('instruction-text').innerText = msg;
        const vowels = "AEIOU";
        "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
            const btn = document.getElementById(`key-${l}`);
            if (btn) {
                const isVowel = vowels.includes(l);
                const isUsed = btn.classList.contains('used');
                if (isUsed) btn.disabled = true;
                else btn.disabled = isVowelMode ? !isVowel : isVowel;
            }
        });
    } else if (phase === 'win') {
        document.getElementById('action-menu').classList.remove('hidden');
        document.getElementById('spin-trigger').classList.add('hidden');
        document.getElementById('buy-vowel-btn').classList.add('hidden');
        document.getElementById('solve-trigger').classList.add('hidden');
        
        if (isBonusRound) {
            document.getElementById('play-again-btn').classList.remove('hidden');
        } else if (currentRound < 3) {
            document.getElementById('next-round-btn').classList.remove('hidden');
        } else {
            let bonusBtn = document.getElementById('bonus-round-btn');
            if (!bonusBtn) {
                bonusBtn = document.createElement('button');
                bonusBtn.id = "bonus-round-btn";
                bonusBtn.innerText = "BONUS ROUND";
                bonusBtn.className = "bonus-round-trigger-btn";
                bonusBtn.onclick = () => showLeaderboard();
                document.getElementById('action-menu').appendChild(bonusBtn);
            }
            bonusBtn.classList.remove('hidden');
        }
        updateUI();
    }
}

window.onload = () => {
    const menuSnd = document.getElementById('snd-menu');
    menuSnd.play().catch(() => {
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
            volume -= 0.05; menuSnd.volume = volume;
        } else {
            clearInterval(fadeInterval); menuSnd.pause(); menuSnd.volume = 1.0;
        }
    }, 50);
}

function openCredits() { document.getElementById('credits-modal').style.display = 'flex'; }
function closeCredits() { document.getElementById('credits-modal').style.display = 'none'; }
window.addEventListener('keydown', (e) => { if (e.key === "Escape") closeCredits(); });